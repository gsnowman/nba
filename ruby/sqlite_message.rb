#!/usr/bin/env ruby

require 'formatter'

class Module
  #
  # defines the following:
  # - from_hash ( {} ) : populate from a hash of symbol => value
  # - from_sql ( row ) : populate from a sqlite result row
  # - @@fields - an array containing the names of all the sql fields
  # - attr_accesor for each of the sql fields
  #
  def sql_accessor(*syms, &block)
    self.class_eval(
<<EOF
  @@fields = []
  def from_sql(result)
    parse_from_sql result, @@fields
  end
  def from_hash(vals)
    parse_from_hash vals, @@fields
  end
  def to_sql(table_name)
    out_to_sql table_name, @@fields
  end
  def to_hash
    out_to_hash @@fields
  end
EOF
)
    syms.each do |sym|
      self.class_eval("@@fields << '@#{sym}'")
      self.class_eval("attr_accessor :#{sym}")
    end
  end
end

class SqliteMessage
  #
  # sets all the fields in the hash by calling self.send(k=, v) for k,v in hash
  # if there are fields in the list that weren't in the hash, raises execption
  #
  def parse_from_hash(vals, fields)
    vals.each { |k,v| send("#{k}=", v) }
    raise "Must set sql_accessor" if (@fields = fields).nil?
    # snowg: 10/13/13 converting the symbols to strings? not sure if correct
    unset = @fields - (instance_variables.collect {|a| a.to_s})
    raise "Not all fields set #{unset.join(',')}" unless unset.empty?
    self
  end

  #
  # sets the fields in the object by interating through the fields list and 
  #   looking for a corresponding SQL column with the same name
  # raises execption if one of the fields in the field list is not in the
  #   SQL column
  #
  def parse_from_sql(sql_row, fields)
    fields.each do |f|
      field = f.to_s.gsub('@', '')
      raise "'#{field}' not found in record" unless sql_row.include?(field)
      send("#{field}=", sql_row[field])
    end
    self
  end

  #
  # generates SQL insert code (passed the name of the table to insert into)
  #
  def out_to_sql(table_name, fields)
    vars = (@fields = fields).collect {|v| v.to_s.gsub('@', '') }
    vals = vars.collect {|v| Formatter.format(send(v)) }
    "insert into #{table_name} (#{vars.join(',')}) values (#{vals.join(',')});"
  end

  #
  # returns a hash of the field names and their values populated in an object
  #
  def out_to_hash(fields)
    vals = {}
    fields.collect {|f| f.gsub('@', '')}.each {|f| vals[f] = send(f) if respond_to?(f)}
    vals
  end
end


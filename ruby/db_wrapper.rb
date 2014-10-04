#!/usr/bin/env ruby

require 'rubygems'
require 'sqlite3'
require 'formatter'

#
# class that wraps a Sqlite3 database
#
class DbWrapper
  def initialize(file, type_translation = true, results_as_hash = true)
    @db = SQLite3::Database.new(file)
    @db.type_translation = type_translation
    @db.results_as_hash = results_as_hash
  end

  #
  # executes raw sql
  #
  def execute(sql)
    begin
      return @db.execute(sql)
    rescue SQLite3::SQLException => bang
      puts bang, sql
      raise bang
    end
  end

  def execute2(sql)
    begin
      return @db.execute2(sql)
    rescue SQLite3::SQLException => bang
      puts bang, sql
      raise bang
    end
  end

  #
  # executes a select * from a table
  #
  def select(table, type, where = {}, and_or = "and", equals_like = "=", order_by = "")
    order = order_by.empty? ? '' : " ORDER BY #{order_by}"
    sql = "select * from #{table} #{where_clause(where, and_or, equals_like)}#{order};"
    execute(sql).collect { |r| type.new.from_sql(r) }
  end

  #
  # returns an integer of the count return
  # where should be {:symbol => value}
  #
  def count(table, where = {}, and_or = "and", equals_like = "=")
    sql = "select count(*) from #{table} #{where_clause(where, and_or, equals_like)};"
    # execute returns [{0=>"2", "count(*)"=>"2"}] (b/c we get results as hash)
    execute(sql).first[0].to_i
  end

  #
  # returns true if an object exists
  #
  def exists(table, where = {})
    count(table, where) > 0
  end

  #
  # inserts an object into the database
  #
  def insert(object, table)
    sql = object.to_sql(table)
    execute(sql)
  end

  #
  # deletes objects from a table
  #
  def delete(table, where)
    sql = "delete from #{table} #{where_clause(where)};"
    execute sql
  end

  #
  # updates an object in the database based on a specified primary key
  # ignore_fields should include a list of strings (field names)
  #
  def update(object, table, where_field, ignore_fields = [])
    vals = object.to_hash
    vals.delete_if {|k, v| ignore_fields.include?(k) }
    set_fields = vals.collect {|k,v| "#{k} = #{Formatter.format(v)}"}.join(', ')
    where = {where_field => vals[where_field]}
    sql = "update #{table} set #{set_fields} #{where_clause(where)};"
    execute(sql)
  end

  #
  # returns a where clause string, or empty string if the input is empty
  #
  def where_clause(where, and_or = "and", equals_like = "=")
    clause = where.keys.collect { |k| "#{k} #{equals_like} #{Formatter.format(where[k])}" }
    clause.empty? ? "" : "where #{clause.join(" #{and_or} ")}"
  end
end


#!/usr/bin/env ruby

require 'date'

#
# formatting class to format ruby types for SQL insertion
#
class Formatter
  # different types that are formattable
  @@fmt = {
    String => Proc.new { |x| "\"#{x}\"" },
    DateTime => Proc.new { |x| "\"%d-%02d-%02d\"" % [x.year, x.month, x.day] },
    FalseClass => Proc.new { |x| "0" },
    TrueClass => Proc.new { |x| "1" },
    Fixnum => Proc.new { |x| x.to_s },
    Float => Proc.new { |x| x.to_s },
    Bignum => Proc.new { |x| x.to_s }
  }

  def self.format(val)
    fmt = @@fmt[val.class]
    raise "Unable to format #{val} (#{val.class})" if fmt.nil?
    fmt.call(val)
  end
end


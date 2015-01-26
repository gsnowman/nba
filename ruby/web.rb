#!/usr/bin/ruby

require 'open-uri'

#
# Adds html processing functions to the String class.
#
class String
  def gsub_(patterns, replace)
    patterns.class == Array ?
      (patterns.inject(self.clone) {|s, p| s = s.gsub(p, replace)}) :
      (self.gsub(patterns, replace))
  end
  def remove_tag_type(type)
    self.gsub_([/<#{type}( .*?)?>/, /<\/#{type}( .*?)?>/], '')
  end
  def remove_tag_types(types)
    types.inject(self.clone) {|s, tag| s.remove_tag_type(tag)}
  end
  def remove_tags
    self.gsub_([/<.*?>/, "&nbsp;"], '')
  end
  def replace_tags(replace)
    self.gsub_(/<.*>/, replace)
  end
end

#
# Fetches a URL and returns the source as a string.
#
module Web
  def self.fetch_raw(url)
    begin
      open(/http/ =~ url ? url : "http://#{url}")
    rescue => detail
      print "Failed to get #{url}"
      raise detail
    end
  end
  def self.fetch(url)
    self.fetch_raw(url).read
  end
  def self.clean(str)
    str.gsub_(["\n", "\r", "&nbsp;"], '')
  end
  def self.fetch_clean(url)
    self.clean(self.fetch(url))
  end
end


require 'rubygems'
require 'mechanize'
require 'db_wrapper'
require 'set'

agent = Mechanize.new { |agent|
  agent.user_agent_alias = 'Windows Mozilla'
}

league_id = "26130"

pwd = ENV["YAHOO_PWD"]
if pwd.nil? or pwd.empty?
    puts "Must set YAHOO_PWD environment variable"
    exit 1
end

owners = {}
agent.get('https://login.yahoo.com/') do |page|
  temp_page = page.form_with(:id => 'mbr-login-form') do |form|
    form['login'] = 'gsnow3030'
    form['passwd'] = ENV["YAHOO_PWD"]
  end.submit

  (1..12).to_a.each do |team|
    url = "http://basketball.fantasysports.yahoo.com/nba/#{league_id}/#{team}/team?&date=#{Date.today + 1}"
    page = agent.get(url)
    puts "Fetching URL #{url} ..."
    page.links_with(:href => /sports\.yahoo\.com\/nba\/players\/[0-9]+$/) do |links|
      owner_ids = links.collect { |link| link.href.split('/').last.to_i}
      owners[team] = owner_ids
    end
    puts "Found #{owners[team].size} players for team ##{team}"
    if owners[team].size == 0
        filename = result.html
        puts "Wrote HTML file to disk: '#{filename}'"
        File.open(filename, 'w') {|file| file.write(page.body)}
        exit(1)
    end
  end
end

db = DbWrapper.new('../nba.sqlite')
sql = "DELETE FROM owned;"
puts sql
db.execute(sql)

owners.each do |k,v|

  s = Set.new(v)
  s.each do |player_id|
    sql = "INSERT INTO owned VALUES (#{k}, #{player_id});"
    puts sql
    db.execute(sql)
  end
end



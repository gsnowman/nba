require 'rubygems'
require 'mechanize'
require 'db_wrapper'

agent = Mechanize.new { |agent|
  agent.user_agent_alias = 'Windows Mozilla'
  #agent.follow_meta_refresh = true
}

league_id = "28152"

owners = {}
agent.get('https://login.yahoo.com/') do |page|
  temp_page = page.form_with(:name => 'login_form') do |form|
    form['login'] = 'gsnow3030'
    form['passwd'] = ENV["YAHOO_PWD"]
  end.submit

  (1..12).to_a.each do |team|
    page = agent.get("http://basketball.fantasysports.yahoo.com/nba/#{league_id}/#{team}")
    page.links_with(:href => /sports\.yahoo\.com\/nba\/players\/[0-9]+$/) do |links|
      owner_ids = links.collect { |link| link.href.split('/').last.to_i}
      owners[team] = owner_ids
    end
  end
end

db = DbWrapper.new('../nba.sqlite')
sql = "DELETE FROM owned;"
puts sql
db.execute(sql)

owners.each do |k,v|
  v.each do |player_id|
    sql = "INSERT INTO owned VALUES (#{k}, #{player_id});"
    puts sql
    db.execute(sql)
  end
end



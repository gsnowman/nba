require 'rubygems'
require 'mechanize'
require 'web'
require 'set'

if ARGV.size < 1
  puts "Usage #{$0} <week number>"
  exit
end

weeks = {
    1 => [[2, 1], [3, 11], [4, 10], [5, 9], [6, 8], [7, 12]],
    2 => [[2, 12], [1, 3], [4, 11], [5, 10], [6, 9], [7, 8]]
}

agent = Mechanize.new { |agent|
  agent.user_agent_alias = 'Windows Mozilla'
}

def fill(str)
  str
end

password = ENV["YAHOO_PWD"]
league_id = "28152"
week_num = ARGV.first.to_i

ids = []
# go to the login page
login = agent.get('https://login.yahoo.com/')

# fill out, submit the login form
temp_page = login.form_with(:name => 'login_form') do |form|
  form['login'] = 'gsnow3030'
  form['passwd'] = password
end.submit

# go to the league home page for a specific week
#base_url = "http://basketball.fantasysports.yahoo.com/nba/#{league_id}"
#selected_week = "?sbtab=fantasy&sbweek=#{week_num}#fantasy"
#url = "#{base_url}#{selected_week}"

#page = agent.get(url)

# look for matchup pages
#regexp = /nba\/#{league_id}\/matchup\?week=#{week_num}&mid1=[0-9]+&mid2=[0-9]+/

#matchups = nil
# create a set of all the matchup links
#page.links_with(:href => regexp) do |links|
#  matchups = Set.new(links.collect {|l| l.href})
#end
#
matchups = weeks[week_num.to_i].collect do |m|
    "/nba/#{league_id}/matchup?week=#{week_num}&mid1=#{m.first}&mid2=#{m.last}"
end

# parse all of the stats out
all_vals = []
matchups.each do |matchup_link|
  matchup_url = "http://basketball.fantasysports.yahoo.com#{matchup_link}"
  html = Web.clean(agent.get_file(matchup_url)).gsub('  ', ' ')
  table = html.scan(/<table class="Table-plain.*?<\/table>/)
  trs = table.first.scan(/<tr.*?<\/tr>/)
  team1, team2 = trs[1], trs[2]

  cols1 = team1.scan(/<td.*?<\/td>/)
  vals1 = cols1.collect {|x| x.remove_tags}
  vals1[0] = fill(vals1[0])
  vals1[10] = fill(vals1[10])
  all_vals << vals1

  cols2 = team2.scan(/<td.*?<\/td>/)
  vals2 = cols2.collect {|x| x.remove_tags}
  vals2[0] = fill(vals2[0])
  vals2[10] = fill(vals2[10])
  all_vals << vals2
end

# the raw stats
all_vals.each do |vals|
  puts vals[0..8].join("\t").strip
end
puts "======================================================"

# the matchups
all_vals.each do |vals|
  puts vals[0..9].join("\t").strip
end

require 'rubygems'
require 'mechanize'
require 'web'
require 'set'

if ARGV.size < 1
  puts "Usage #{$0} <week number>"
  exit
end
week_num = ARGV.first.to_i

pwd = ENV["YAHOO_PWD"]
if pwd.nil? or pwd.empty?
  puts "Must set YAHOO_PWD environment variable"
  exit 1
end

agent = Mechanize.new { |agent| agent.user_agent_alias = 'Windows Mozilla' }

# can't figure out a way to determine matchups, so the easy
# way for now is to hard-code them
weeks = {
    1 =>  [[8, 6], [1, 2], [3, 11], [4, 10], [5, 9], [7, 12]],
    2 =>  [[8, 7], [1, 3], [2, 12], [4, 11], [5, 10], [6, 9]],
    3 =>  [[8, 12], [1, 4], [2, 3], [5, 11], [6, 10], [7, 9]],
    4 =>  [[8, 9], [1, 5], [2, 4], [3, 12], [6, 11], [7, 10]],
    5 =>  [[8, 10], [1, 6], [2, 5], [3, 4], [7, 11], [9, 12]],
    6 =>  [[8, 11], [1, 7], [2, 6], [3, 5], [4, 12], [9, 10]],
    7 =>  [[8, 1], [2, 7], [3, 6], [4, 5], [9, 11], [10, 12]],
    8 =>  [[8, 2], [1, 9], [3, 7], [4, 6], [5, 12], [10, 11]],
}

league_id = "26130"

# go to the login page
agent.get('https://login.yahoo.com/') do |login|
  temp_page = login.form_with(:id => 'mbr-login-form') do |form|
    form['login'] = 'gsnow3030'
    form['passwd'] = pwd
  end.submit

  matchups = weeks[week_num.to_i].collect do |m|
    "/nba/#{league_id}/matchup?week=#{week_num}&mid1=#{m.first}&mid2=#{m.last}"
  end

  # parse all of the stats out
  all_vals = []
  matchups.each do |matchup_link|
    matchup_url = "http://basketball.fantasysports.yahoo.com#{matchup_link}"
    puts "Fetching URL: '#{matchup_url}'"
    html = Web.clean(agent.get_file(matchup_url)).gsub('  ', ' ')
    table = html.scan(/<table class="Table-plain.*?<\/table>/)
    trs = table.first.scan(/<tr.*?<\/tr>/)
    team1, team2 = trs[1], trs[2]

    all_vals << team1.scan(/<td.*?<\/td>/).collect {|x| x.remove_tags}
    all_vals << team2.scan(/<td.*?<\/td>/).collect {|x| x.remove_tags}
  end

  # the raw stats
  all_vals.each {|vals| puts vals[0..8].join("\t").strip}
  puts "======================================================"

  # the matchups
  all_vals.each {|vals| puts vals[0..9].join("\t").strip}
end


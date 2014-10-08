require 'web'
require 'db_wrapper'

season_name = '2014-15_ESPN'

db = DbWrapper.new('../nba.sqlite')
data = Web.clean(File.open('projections.html').read())

players = data.scan(/<tr id="plyr.*?<\/tr>/)

# first thing is to create the table of mappings
db.execute("DROP TABLE IF EXISTS player_ids;")
db.execute("CREATE TABLE player_ids(name VARCHAR(50), yahoo INT, espn INT, rotoworld INT);")
db.execute("DELETE from averages WHERE season = '#{season_name}';")


def weighted_avg(vals)
  sum, n = 0.0, 0.0
  vals.each_with_index do |val, i|
    sum += (i + 1.0) * val
    n += (i + 1.0)
  end
  sum / n
end

players.each do |p|
  tds = p.scan(/<td.*?<\/td>/)

  html = tds[1].scan(/playerId="[0-9]+"/)
  espn_id = html.size == 0 ? -1 : html.first.split('=').last.gsub('"', '').to_i

  rank = tds[0].remove_tags.to_i
  name = tds[1].remove_tags.split(',').first.gsub('  ', ' ')
  fgp = tds[2].remove_tags.to_f
  ftp = tds[3].remove_tags.to_f
  tpm = tds[4].remove_tags.to_f
  reb = tds[5].remove_tags.to_f
  ast = tds[6].remove_tags.to_f
  stl = tds[7].remove_tags.to_f
  blk = tds[8].remove_tags.to_f
  pts = tds[9].remove_tags.to_f

  last = name.split(' ').last.split("'").last.gsub('*', '')
  first = name.split(' ').first.split("'").first
  sql = "SELECT * FROM PLAYERS where first like '%#{first}%' and last like '%#{last}%';"
  players = db.execute(sql)

  # error conditions
  if players.size() == 0
    puts "#{rank}:  Unable to find '#{name}' espn id=#{espn_id}"
    puts "#{rank}:  - SQL: #{sql}"
    next
  elsif players.size() != 1
    puts "#{rank}:  Found #{players.size()} players matching first='#{first}' last='#{last}'"
    players.each {|p| puts "#{rank}:  - '#{p['first']} #{p['last']}'"}
    next
  end

  p = players.first
  yahoo_id = p['player_id']

  # insert the mapping first
  puts "#{rank}:  Mapping yahoo '#{p['first']} #{p['last']}' player_id=#{yahoo_id} to espn '#{name}' player_id=#{espn_id}"
  db.execute("INSERT INTO player_ids VALUES(\"#{p['first']} #{p['last']}\", #{yahoo_id}, #{espn_id}, 0);")

  # CREATE TABLE averages (season VARCHAR(50), player_id INTEGER, team VARCHAR(40), games INTEGER, min DOUBLE,
  #      reb DOUBLE, off DOUBLE, def DOUBLE, ast DOUBLE, stl DOUBLE, blk DOUBLE, pts DOUBLE, tpa DOUBLE, tpm DOUBLE,
  #           fga DOUBLE, fgm DOUBLE, fta DOUBLE, ftm DOUBLE, turnovers DOUBLE, pf DOUBLE);
  # unfortunately, ESPN does not provide projections on # of fg or ft attempts, we'll have to estimate those

  # these are the means, std dev's
  pts_mean  = 14.35475088
  pts_stdev = 4.69424049
  tpm_mean  = 1.046000798
  tpm_stdev = 0.831125077
  reb_mean  = 5.470573613
  reb_stdev = 2.635452221
  ast_mean  = 3.246593841
  ast_stdev = 2.155897725
  stl_mean  = 1.018010561
  stl_stdev = 0.423021501
  blk_mean  = 0.602942934
  blk_stdev = 0.545058275
  fgp_mean  = 0.465815549
  fgp_stdev = 0.054609879
  fga_mean  = 11.52125367
  ftp_mean  = 0.772864612
  ftp_stdev = 0.094757395
  fta_mean  = 3.404121105

  fga = fga_mean
  fga_seasons = db.execute("SELECT fga FROM averages WHERE player_id = #{yahoo_id} order by season asc;").collect {|x| x['fga']}
  fga = weighted_avg(fga_seasons) unless fga_seasons.empty?

  fta = fta_mean
  fta_seasons = db.execute("SELECT fta FROM averages WHERE player_id = #{yahoo_id} order by season asc;").collect {|x| x['fta']}
  fta = weighted_avg(fta_seasons) unless fga_seasons.empty?

  projection_sql =
    "INSERT INTO averages VALUES ('2014-15_ESPN', #{yahoo_id}, '#{p['team']}', 82, 0.0, #{reb}, 0.0, 0.0, #{ast}, #{stl}, #{blk}, #{pts}, 0.0, #{tpm}, #{fga}, #{fga * fgp}, #{fta}, #{fta * ftp}, 0.0, 0.0);"

  puts "#{rank}:  - #{projection_sql}"
  db.execute(projection_sql)
end



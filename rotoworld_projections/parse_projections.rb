require 'web'
require 'db_wrapper'

season_name = '2014-15_RW'

db = DbWrapper.new('../nba.sqlite')
file = File.open('rotoworld_projections.csv')

# first thing is to create the table of mappings
#db.execute("DROP TABLE IF EXISTS player_ids;")
#db.execute("CREATE TABLE IF NOT EXISTS player_ids(name VARCHAR(50), yahoo INT, espn INT, rotoworld INT);")
db.execute("DELETE from averages WHERE season = '#{season_name}';")

file.read().split("\n").each_with_index do |line, rank|
  next if line =~ /ROTOWORLD/ or line =~ /8C,9C/
  rank = rank + 1

  # Pos,8C,9C,Player,Pos,Tm,G,MIN,PTS,FGM,FGA,FG%,3PT,FTM,FTA,FT%,AST,REB,STL,BLK,TO,8CA,Rotoworld_ID
  # 1,1,1,LeBron James,SF,CLE,77,36,26.2,9.3,16.4,57,1.6,5.9,7.9,75,6.8,7.3,1.7,0.6,2.8,184.54,Rotoworld_ID

  words = line.split(',')
  rw_id = words.last.to_i
  name = words[3]
  team = words[5]
  games = words[6].to_i
  min = words[7].to_f
  pts, fgm, fga, fgp, tpm, ftm, fta, ftp, ast, reb, stl, blk, to = words[(8..20)].collect {|x| x.to_f}

  fgp = fgp / 100.0
  ftp = ftp / 100.0

  fgm = fga * fgp
  ftm = fta * ftp

  last = name.split(' ').last.split("'").last.gsub('*', '')
  first = name.split(' ').first.split("'").first
  sql = "SELECT * FROM PLAYERS where first like '%#{first}%' and last like '%#{last}%';"
  players = db.execute(sql)

  # error conditions
  if players.empty?
    puts "#{rank}:  Unable to find '#{name}' rw id=#{rw_id}"
    puts "#{rank}:  - SQL: #{sql}"
    next
  elsif players.size() != 1
    puts "#{rank}:  Found #{players.size()} players matching first='#{first}' last='#{last}'"
    players.each {|p| puts "#{rank}:  - '#{p['first']} #{p['last']}' #{p['player_id']}"}
    next
  end

  p = players.first
  yahoo_id = p['player_id']

  # insert the mapping first
  puts "#{rank}:  Mapping yahoo '#{p['first']} #{p['last']}' player_id=#{yahoo_id} to rw '#{name}' player_id=#{rw_id}"
  player_ids = db.execute("SELECT * FROM player_ids WHERE yahoo = #{yahoo_id}")
  if player_ids.empty?
      sql = "INSERT INTO player_ids VALUES(\"#{p['first']} #{p['last']}\", #{yahoo_id}, 0, #{rw_id});"
      db.execute(sql)
      puts "#{rank}:  - #{sql}"
  else
      sql = "UPDATE player_ids SET rotoworld = #{rw_id} WHERE yahoo = #{yahoo_id}"
      db.execute(sql)
      puts "#{rank}:  - #{sql}"
  end

  # CREATE TABLE averages (season VARCHAR(50), player_id INTEGER, team VARCHAR(40), games INTEGER, min DOUBLE,
  #      reb DOUBLE, off DOUBLE, def DOUBLE, ast DOUBLE, stl DOUBLE, blk DOUBLE, pts DOUBLE, tpa DOUBLE, tpm DOUBLE,
  #           fga DOUBLE, fgm DOUBLE, fta DOUBLE, ftm DOUBLE, turnovers DOUBLE, pf DOUBLE);

  projection_sql =
    "INSERT INTO averages VALUES ('#{season_name}', #{yahoo_id}, '#{p['team']}', #{games}, #{min}, #{reb}, null, null, #{ast}, #{stl}, #{blk}, #{pts}, null, #{tpm}, #{fga}, #{fga * fgp}, #{fta}, #{fta * ftp}, #{to}, null);"

  puts "#{rank}:  - #{projection_sql}"
  db.execute(projection_sql)
end



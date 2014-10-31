require 'web'
require 'db_wrapper'

# To update this:
#
# view-source on the projections file, save the source to the 'top_200_dynasty.html' and 'top_200_season.html'

db = DbWrapper.new('../nba.sqlite')
data = File.open('top_200_dynasty.html').read()

db.execute("DROP TABLE IF EXISTS RW_Dynasty;")
db.execute("CREATE TABLE IF NOT EXISTS RW_Dynasty (rotoworld_id INT, rank INT);")

tables = data.scan(/<table.*?<\/table>/)
players = tables.inject([]) {|p, t| p.concat(t.scan(/<tr.*?pid=[0-9]+/))}

players.each do |p|
  rotoworld_id = p.scan(/pid=[0-9]+/).first.split('=').last.to_i
  rank = p.scan(/<b>[0-9]+\.<br/).first.remove_tags.gsub('.', '').to_i
  sql = "INSERT INTO RW_Dynasty VALUES (#{rotoworld_id}, #{rank})"
  puts sql
  db.execute(sql)
end




data = File.open('top_200_season.html').read()

db.execute("DROP TABLE IF EXISTS RW_Season;")
db.execute("CREATE TABLE IF NOT EXISTS RW_Season (rotoworld_id INT, rank INT);")

tables = data.scan(/<table.*?<\/table>/)
players = tables.inject([]) {|p, t| p.concat(t.scan(/<tr.*?pid=[0-9]+/))}

players.each do |p|
  rotoworld_id = p.scan(/pid=[0-9]+/).first.split('=').last.to_i
  rank = p.scan(/<b>[0-9]+\.<br/).first.remove_tags.gsub('.', '').to_i
  sql = "INSERT INTO RW_Season VALUES (#{rotoworld_id}, #{rank})"
  puts sql
  db.execute(sql)
end

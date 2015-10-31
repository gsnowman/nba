require 'db_wrapper'
require 'web'

html = Web.clean(File.open('draft_results.html').read())
db = DbWrapper.new('../nba.sqlite')
db.execute("CREATE TABLE IF NOT EXISTS draft (player_id INT, draft_position INT);")
db.execute("DELETE FROM draft;")

players = html.scan(/<td class="player Px-sm">.*?<\/td>/).collect do |p|
  id = p.scan(/sports\.yahoo\.com\/nba\/players\/[0-9]+/).first.split('/').last.to_i
end

players.each_with_index do |p,i|
   sql = "INSERT INTO draft VALUES (#{p}, #{i+1});"
   puts sql
   db.execute(sql)
end


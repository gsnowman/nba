require 'web'
require 'types'
require 'fetch_players'
require 'table_commands'
require 'date_creator'

def combine_seasons(a)
  by_season = a.inject({}) do |d, season|
    s = season['season']
    d[s] = [] unless d.has_key?(s)
    d[s] << season
    d
  end

  by_season.collect do |k, v|
    data = v.first.clone
    for i in 1...v.size
      data['team'] = data['team'] + '-' + v[i]['team']
      %w(games min fgm fga tpm tpa ftm fta off def reb ast turnovers stl blk pf pts).each do |k|
        data[k] = data[k] + v[i][k]
      end
    end
    g = data['games']
    %w(min fgm fga tpm tpa ftm fta off def reb ast turnovers stl blk pf pts).each do |k|
      data[k] = data[k] / g
    end
    data
  end
end

#
# takes a player and populates the career averages for all available years
#
def fetch_averages(player_id)
  url = "http://sports.yahoo.com/nba/players/#{player_id}"
#game_html = Web.clean(File.open('file.html', 'r').read())
  puts "Getting URL #{url}"
  game_html = Web.fetch_clean(url)

  career_totals = game_html.scan(/table summary="Player Season Totals.*?<\/table>/)
  return [] if career_totals.size() == 0
  career = career_totals.first.scan(/<tbody>.*?<\/tbody>/).first
  rows = career.scan(/<tr>.*?<\/tr>/)

  seasons = (rows.collect do |row|
    tds = row.scan(/<th.*?<\/th>/) + row.scan(/<td.*?<\/td>/)
    min = tds[3].remove_tags.split(':')

    games = tds[2].remove_tags.to_f

    # 0     1       2   3   4   5   6   7   8   9   10  11  12  13  14  15  16  17  18
    # Year  Team    G   Min FGM FGA 3P  3PA FT  FTA OR  DR  Reb Ast TO  Stl Blk PF  Pts
    # don't want overall career averages
    tds.first.remove_tags == "Totals" ? [] :
    {
      'player_id' => player_id,
      'season' => tds[0].remove_tags,
      'team' => tds[1].remove_tags.downcase,
      'games' => games,
      'min' => tds[3].remove_tags.to_f,
      'fgm' => tds[4].remove_tags.to_f,
      'fga' => tds[5].remove_tags.to_f,
      'tpm' => tds[6].remove_tags.to_f,
      'tpa' => tds[7].remove_tags.to_f,
      'ftm' => tds[8].remove_tags.to_f,
      'fta' => tds[9].remove_tags.to_f,
      'off' => tds[10].remove_tags.to_f,
      'def' => tds[11].remove_tags.to_f,
      'reb' => tds[12].remove_tags.to_f,
      'ast' => tds[13].remove_tags.to_f,
      'turnovers' => tds[14].remove_tags.to_f,
      'stl' => tds[15].remove_tags.to_f,
      'blk' => tds[16].remove_tags.to_f,
      'pf' => tds[17].remove_tags.to_f,
      'pts' => tds[18].remove_tags.to_f,
    }
  end).flatten
  combine_seasons(seasons)
end

#
# fetches games and inserts them player by player instead of fetching all the
# games prior to the insert
#
def get_career_averages(player_ids)
  (player_ids.collect {|id| fetch_averages(id)}).flatten
end

def print_career_averages(avgs)
    puts (avgs.collect {|a| a['season']}).join(', ')
end

def add_to_database(avgs, db)
  # header and fields
  header = "#season,player_id,team,games,min,reb,off,def,ast,stl,blk,pts,tpa,tpm,fga,fgm,fta,ftm,turnovers,pf"
  fields = header.gsub('#', '').split(',')
  cols = %w(games min reb off def ast stl blk pts tpa tpm fga fgm fta ftm turnovers pf)

  avgs.each do |a|
    sql = "INSERT INTO averages VALUES ('#{a['season']}', #{a['player_id']}, '#{a['team']}', " +
      "#{(cols.collect {|x| a[x].to_s}).join(',')});"
    db.execute(sql)
  end
end

if __FILE__ == $0
  require 'getopt'

  db = DbWrapper.new('nba.sqlite')
  args = Args.new({:player_ids => ['-p', 'Comma delimited player ids', String],
    :start => ['-s', 'Starting player_id', String]},
    Proc.new {"Usage: #{$0} [options]"},
    Proc.new {"fetch_previous_years_averages Version 0.1"})
  args.parse(ARGV)

  player_ids = nil
  if (not args[:start].nil?)
    puts "Starting at player_id=#{args[:start].to_i}"
    teams = fetch_players_from_sqlite_player_id(db, args[:start].to_i)
    player_ids = (teams.collect do |abbrev, t|
      (t.players.collect {|p| p.exp == 0 ? [] : p.player_id}).flatten
    end).flatten.sort
  elsif args[:player_ids].nil?
    teams = fetch_players_from_sqlite(db)
    player_ids = (teams.collect {|ab, t| t.players.collect {|p| p.player_id } }).flatten.sort
  else
    player_ids = (args[:player_ids].split(',').collect {|x| x.to_i }).sort
  end

  puts "#{player_ids.size} players to fetch"

  player_ids.each do |player_id|

    puts "Fetching player_id=#{player_id}"
    all_averages = get_career_averages([player_id])
    db.execute("DELETE FROM averages WHERE player_id = #{player_id};");
    print_career_averages(all_averages)
    add_to_database(all_averages, db)
    puts "     ***     Done with ID=#{player_id}"
  end
end


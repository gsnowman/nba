require 'web'
require 'date'
require 'db_wrapper'

PREFIX="http://sports.yahoo.com"

def log(s)
  ts = DateTime.now().strftime("%Y-%m-%d %H:%M:%S")
  puts "#{ts} - #{s}"
end

def date_str(d)
  "%04d-%02d-%02d" % [d.year, d.month, d.day]
end

def convert_min(m)
  min, sec = m.split(':').collect {|x| x.to_f}
  min + (sec / 60.0)
end

db = DbWrapper.new('../nba.sqlite')

if ARGV.size > 0
  date_yr, date_month, date_day = ARGV.first.split('-').collect {|x| x.to_i}
  d = Date.new(date_yr, date_month, date_day)
else
  d = Date.today - 1
end

date = date_str(d)
log("Using date: #{date}")

url = "#{PREFIX}/nba/scoreboard/?date=#{date}"
log("Fetching URL: #{url}")
list = Web.fetch_clean(url)

games_table = list.scan(/<table class="list">.*?<\/table>/).first
games = games_table.scan(/href=".*?"/)
log("Found #{games.size} games from #{d}")

links = games.collect {|x| PREFIX + x.split('=').last.gsub('"', '')}

team_map = {
  'Boston' => 'bos',
  'New York' => 'nyk',
  'Philadelphia' => 'phi',
  'Brooklyn' => 'bro',
  'Toronto' => 'tor',
  'Cleveland' => 'cle',
  'Indiana' => 'ind',
  'Chicago' => 'chi',
  'Milwaukee' => 'mil',
  'Detroit' => 'det',
  'Miami' => 'mia',
  'Charlotte' => 'cha',
  'Washington' => 'was',
  'Atlanta' => 'atl',
  'Orlando' => 'orl',
  'Phoenix' => 'pho',
  'Sacramento' => 'sac',
  'Golden State' => 'gsw',
  'LA Lakers' => 'lal',
  'LA Clippers' => 'lac',
  'Memphis' => 'mem',
  'Dallas' => 'dal',
  'San Antonio' => 'sas',
  'Houston' => 'hou',
  'New Orleans' => 'nop',
  'Denver' => 'den',
  'Minnesota' => 'min',
  'Oklahoma City' => 'okc',
  'Portland' => 'por',
  'Utah' => 'uth'
}

db.execute("DELETE FROM games WHERE date = '#{date}';")

links.each do |link|

  html = Web.fetch_clean(link)
  game_id = link.gsub('/', '').split('-').last.to_i

  # get the two teams that played from the title (can't figure out another way)
  title = html.scan(/<title>.*?<\/title>/).first.remove_tags.split('|').first.strip
  full_team_names = title.split(' at ').collect {|x| x.strip} # away team always first
  abbrev_team_names = full_team_names.collect {|x| team_map[x]} # use team abbreviation

  log("Fetching box score for URL: '#{link}'")

  # scope="col" was the only reliable identifier I could find to capture each team's table
  team_tables = html.scan(/scope="col".*?class="totals"/)
  log("Found #{team_tables.size} tables/teams")

  if html.scan(/<h3>Game Leaders<\/h3>/).empty?
    log("Game in progress, skipping...")
    next
  end

  # get the total score
  scores = html.scan(/class="totals".*?<\/tr>/).collect do |total|
    total.scan(/<td.*?<\/td>/).last.remove_tags.to_i
  end

  team_tables.each_with_index do |team, team_index|
    teamname, oppname = abbrev_team_names[team_index], abbrev_team_names[(team_index + 1) % 2]
    teamscore, oppscore = scores[team_index], scores[(team_index + 1) % 2]
    win = teamscore > oppscore ? 1 : 0
    home = team_index # away team will be index 0, home team index 1

    rows = team.scan(/<tr>.*?<\/tr>/)
    log("Found #{rows.size} players in team ##{team_index} -- #{teamname}")

    rows.each_with_index do |player, index|
      header = player.scan(/<th.*?<\/th>/)
      name, player_id = "", 0
      if header.size == 1
        # get the name
        name = header.first.scan(/<a.*?<\/a>/).first.remove_tags
        # get the id if it exists
        id_html = header.first.scan(/nba\/players\/[0-9]+/)
        player_id = id_html.first.split('/').last.to_i if id_html.size == 1
      end

      if player_id == 0
        log("WARNING - Unknown player id, name=#{name}, team=#{team_index} player_index=#{index} url=#{link}")
        next
      end

      dnp = (player =~ /DNP/ or player =~ /Inactive/ or player =~ /DND/ or player =~ /NWT/)
      unless dnp
        tds = player.scan(/<td.*?<\/td>/)
        start = (index < 5) ? 1 : 0
        min = convert_min(tds[0].remove_tags)
        fgm, fga = tds[1].remove_tags.split('-').collect {|x| x.to_i}
        tpm, tpa = tds[2].remove_tags.split('-').collect {|x| x.to_i}
        ftm, fta = tds[3].remove_tags.split('-').collect {|x| x.to_i}
        pm = tds[4].remove_tags.gsub('+', '').to_i
        oreb, dreb, reb, ast, to, stl, bs, ba, pf, pts = tds[5..14].collect {|x| x.remove_tags.to_i}

        query = "INSERT INTO games VALUES ('#{date}', #{game_id}, #{player_id}, '#{teamname}', '#{oppname}', #{home}, " +
          "#{teamscore}, #{oppscore}, 0, #{start}, #{min}, #{fgm}, #{fga}, #{ftm}, #{fta}, " +
          "#{tpm}, #{tpa}, #{pm}, #{oreb}, #{dreb}, #{reb}, #{ast}, #{to}, #{stl}, #{bs}, #{pf}, #{pts});"
        log("Insert (#{name}): #{query}")
        db.execute(query)
      else
        query = "INSERT INTO games VALUES ('#{date}', #{game_id}, #{player_id}, '#{teamname}', '#{oppname}', #{home}, " +
          "#{teamscore}, #{oppscore}, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);"
        log("Insert DNP (#{name}): #{query}")
        db.execute(query)
      end
    end
  end
end


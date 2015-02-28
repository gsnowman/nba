#!/usr/bin/env ruby

require 'types'
require 'web'
require 'db_wrapper'
require 'table_commands'
require 'types_pp'

#
# returns list of teams
#
def fetch_players_from_yahoo(teams_to_include = [])
  # get all the teams
  yahoo_url='http://sports.yahoo.com/nba/players'
  teams_src = Web.fetch_clean(yahoo_url)

  # scan for the matching html
  teams_html = teams_src.scan(/\/nba\/teams\/[^\/]+\/roster>[76a-zA-Z ]+<\/a>/)

  # create a list of teams
  teams = teams_html.collect do |t|
    # expects '/nba/teams/sac/roster>Sacramento Kings</a>'
    team = Team.new.from_hash({
      :abbrev => t.split('/')[3].split('"').first,
      :name => t.split(/(<|>)/)[2]})
    team
  end

  teams.delete_if {|x| not teams_to_include.include?(x.abbrev)} unless (teams_to_include.empty?)

  # for each team, collect all the players for that team
  teams.each do |team|
    puts "Team: #{team.abbrev}:"
    team_html = Web.fetch_clean("http://sports.yahoo.com/nba/teams/#{team.abbrev}/roster")
    # testing
    #team_html = Web.clean(File.open('index.html', 'r').read())
    players = team_html.scan(/<tbody>.*?<\/tbody>/)[1]
    team.players = players.scan(/<tr.*?<\/tr>/).collect do |pl|
      begin
        attrs = pl.scan(/<t[dh]{1}.*?<\/t[dh]{1}>/)
        name = attrs[1].remove_tags.strip.split(' ')
        id = pl.scan(/nba\/players\/[0-9]+/).first.split('/').last.to_i

        first = name.shift
        last = name.join(' ')

        player = Player.new.from_hash({
          :player_id => id,
          :number => attrs[0].remove_tags.to_i,
          :first => first,
          :last => last,
          :pos => attrs[2].remove_tags,
          :height => attrs[5].remove_tags.gsub('"', "'"),
          :weight => attrs[6].remove_tags.to_i,
          :age => attrs[7].remove_tags.to_i,
          :exp => attrs[8].remove_tags.to_i,
          :college => attrs[10].remove_tags,
          :salary => attrs[11].remove_tags.gsub('$', '').gsub(',', '').to_i,
          :team => team.abbrev
        })
        player
      rescue Exception => e
        puts e.message
        puts e.backtrace.inspect
        []
      end
    end
    team.players.each do |p|
      puts " - [#{p.player_id}] - #{p.first} #{p.last}"
    end
    team.players.flatten!
  end
  teams
end

#
# returns a hash of { 'team abbrev' => team }
#
def fetch_players_from_sqlite(db, player_ids = nil)
  # TODO: this 'filtering' sucks
  teams = {}
  db.select('teams', Team).each { |team| teams[team.abbrev] = team }
  db.select('players', Player).each do |p|
    if player_ids.nil? or player_ids.include?(p.player_id)
      teams[p.team].players << p
    end
  end
  teams
end

def fetch_players_from_sqlite_player_id(db, low_player_id)
  teams = {}
  db.select('teams', Team).each { |team| teams[team.abbrev] = team }
  db.select('players', Player, {:player_id => low_player_id}, '', ">=", "player_id ASC").each do |p|
    teams[p.team].players << p
  end
  teams
end

#
# takes a db and a list of teams
#
def add_players_to_sqlite(db, teams)
  teams.each do |t|
    unless db.exists('teams', {:abbrev => t.abbrev})
      db.insert(t, 'teams')
      puts "Inserted team '#{t.name}' ('#{t.abbrev}')"
    end

    t.players.each do |p|
      if db.exists('players', {:player_id => p.player_id})
        puts "Updating '#{p.first} #{p.last}' with id #{p.player_id}"
        db.update(p, 'players', 'player_id', ['owned', 'rotoworld']) # last parameter is fields to ignore
      else
        db.insert(p, 'players')
        puts "Inserted '#{p.first} #{p.last}' with id #{p.player_id}"
      end
    end
  end
end

#
# Only adds players to the sqlite database.
#
if $0 == __FILE__
  # create the wrapper and the tables
  db = DbWrapper.new('nba.sqlite')
  db.execute(TableCommands.players_create)

  teams_to_fetch = %w()
  add_players_to_sqlite(db, fetch_players_from_yahoo(teams_to_fetch))
end


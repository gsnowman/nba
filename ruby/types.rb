#!/usr/bin/env ruby

require 'sqlite_message'

class Team < SqliteMessage
  sql_accessor :abbrev, :name
  attr_accessor :players
  def initialize
   @players = []
  end
end

class Player < SqliteMessage
  sql_accessor :player_id, :number, :last, :first, :pos, :height, :weight, :age,
    :exp, :college, :salary, :team
  attr_accessor :games
  def initialize
    @games = []
  end
end

class Game < SqliteMessage
  sql_accessor :player_id, :game_id, :date, :opp, :win, :team_score, :opp_score,
    :start, :min, :fgm, :fga, :tpm, :tpa, :ftm, :fta, :def, :off, :reb, :ast,
    :turnovers, :stl, :blk, :pf, :pts
end



module TableCommands

def self.players_create()
<<EOF
  create table if not exists players (
    player_id integer primary key,
    number integer,
    last varchar(40), 
    first varchar(40),
    pos varchar(10),
    height varchar(8), 
    weight integer,
    age integer,
    exp integer, 
    college varchar(50),
    salary integer,
    team varchar(10),
    owned boolean);
EOF
end

def self.teams_create()
<<EOF
  create table if not exists teams (
    abbrev varchar(6) primary key,
    name varchar(30));
EOF
end

def self.games_create()
<<EOF
  create table if not exists games (
    player_id integer,
    game_id long,
    date datetime,
    opp varchar(10),
    win boolean,
    team_score integer,
    opp_score integer,
    start boolean,
    min float,
    fgm integer,
    fga integer,
    tpm integer,
    tpa integer,
    ftm integer,
    fta integer,
    def integer,
    off integer,
    reb integer,
    ast integer,
    turnovers integer,
    stl integer,
    blk integer,
    pf integer,
    pts integer);
EOF
end

def self.owned_create()
<<EOF
create table if not exists owned (
    player_id integer primary key,
    owned boolean);
EOF
end

end


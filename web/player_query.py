import itertools
import datetime as dt
import cherrypy

def convert_results(db):
    field_names = [d[0].lower() for d in db.description]
    rows = db.fetchall()
    return [dict(itertools.izip(field_names, row)) for row in rows]

class Factors:
    def __init__(self, arr):
        self.pts, self.tpm, self.reb, self.ast, self.stl, self.blk, self.fg, self.ft = arr
    def as_tuple(self):
        return (self.pts, self.tpm, self.reb, self.ast, self.stl, self.blk, self.fg, self.ft)
    def sum(self):
        return sum(self.as_tuple())

class GameQuery:
    def __init__(self):
        self.player_id = None
        self.days = 1000

    def query(self, db):
        self.query1(db)
        return self.query2(db)

    def query1(self, db):
        as_of_date = (dt.datetime.now() - dt.timedelta(days=int(self.days))).strftime("%Y-%m-%d")
        query1 = """
CREATE TEMP TABLE data1 AS
SELECT
    date,team,opp,home,teamscore,oppscore,dnp,start,min,
    pts,tpm,reb,ast,stl,blk,fgm,fga,ftm,fta,
    (1.0*pts - 14.35475088) / 4.69424049 AS zpts,
    (1.0*tpm - 1.046000798) / 0.831125077 AS ztpm,
    (1.0*reb - 5.470573613) / 2.635452221 AS zreb,
    (1.0*ast - 3.246593841) / 2.155897725 AS zast,
    (1.0*stl - 1.018010561) / 0.423021501 AS zstl,
    (1.0*blk - 0.602942934) / 0.545058275 AS zblk,
    CASE WHEN fga = 0 THEN 0.0 ELSE (((1.0*fgm / fga) - 0.465815549) / 0.054609879) * (fga / 11.52125367) END AS zfg,
    CASE WHEN fta = 0 THEN 0.0 ELSE (((1.0*ftm / fta) - 0.772864612) / 0.094757395) * (fta / 3.404121105) END AS zft
FROM games
WHERE player_id = %d AND date >= '%s'
ORDER BY date desc;
""" % (self.player_id, as_of_date);

        cherrypy.log(query1)
        db.execute(query1)

    def query2(self, db):
        query2 = """
SELECT *, (zpts + ztpm + zreb + zast + zstl + zblk + zfg + zft) / 8.0 as z FROM data1;
"""
        cherrypy.log(query2)
        db.execute(query2)
        return convert_results(db)

class PlayerQuery:
    def __init__(self):
        self.owners = None
        self.days = 1000
        self.factors = Factors([1.0] * 8)
        self.player_id = None

    def remove_owned(self):
        self.owners = [0]

    def query(self, db):
        self.query1(db)
        self.query1b(db)
        self.query2(db)
        self.query3(db)
        return self.query4(db)

    def query1(self, db):
        as_of_date = (dt.datetime.now() - dt.timedelta(days=int(self.days))).strftime("%Y-%m-%d")
        query1 = """
CREATE TEMP TABLE data1 AS
SELECT
    REPLACE(P.first || ' ' || P.last, "'", "") AS name,
    P.team AS team,
    P.pos AS pos,
    P.age AS age,
    P.player_id AS player_id,
    CASE WHEN IDS.rotoworld IS NULL THEN 0 ELSE IDS.rotoworld END AS rotoworld_id,
    CASE WHEN O.owner_id IS NULL THEN 0 ELSE O.owner_id END AS owner_id,
    CASE WHEN D.draft_position IS NULL THEN 0 ELSE D.draft_position END AS draft_position,
    COUNT(*) - SUM(dnp) AS games,
    SUM(dnp) AS dnp,
    SUM(min)*1.0 AS min,
    SUM(reb)*1.0 AS reb,
    SUM(oreb)*1.0 AS off,
    SUM(dreb)*1.0 AS def,
    SUM(ast)*1.0 AS ast,
    SUM(stl)*1.0 AS stl,
    SUM(blk)*1.0 AS blk,
    SUM(pts)*1.0 AS pts,
    SUM(tpa)*1.0 AS tpa,
    SUM(tpm)*1.0 AS tpm,
    SUM(fga)*1.0 AS fga,
    SUM(fgm)*1.0 AS fgm,
    SUM(fta)*1.0 AS fta,
    SUM(ftm)*1.0 AS ftm,
    SUM(turnovers)*1.0 AS turnovers,
    SUM(pf)*1.0 AS pf
FROM games G
INNER JOIN players P ON G.player_id == P.player_id
LEFT OUTER JOIN owned O ON P.player_id == O.player_id
LEFT OUTER JOIN player_ids IDS ON P.player_id == IDS.yahoo
LEFT OUTER JOIN draft D ON P.player_id == D.player_id
WHERE G.date >= '%s'
GROUP BY G.player_id;
""" % (as_of_date)
        cherrypy.log(query1)
        db.execute(query1)

    def query1b(self, db):
        query1b = """
CREATE TEMP TABLE data1b AS
SELECT
    name, team, pos, age, player_id, rotoworld_id, owner_id, draft_position, games, dnp,
    CASE WHEN games == 0 THEN 0.0 ELSE min / games END as min,
    CASE WHEN games == 0 THEN 0.0 ELSE reb / games END as reb,
    CASE WHEN games == 0 THEN 0.0 ELSE off / games END as off,
    CASE WHEN games == 0 THEN 0.0 ELSE def / games END as def,
    CASE WHEN games == 0 THEN 0.0 ELSE ast / games END as ast,
    CASE WHEN games == 0 THEN 0.0 ELSE stl / games END as stl,
    CASE WHEN games == 0 THEN 0.0 ELSE blk / games END as blk,
    CASE WHEN games == 0 THEN 0.0 ELSE pts / games END as pts,
    CASE WHEN games == 0 THEN 0.0 ELSE tpa / games END as tpa,
    CASE WHEN games == 0 THEN 0.0 ELSE tpm / games END as tpm,
    CASE WHEN games == 0 THEN 0.0 ELSE fga / games END as fga,
    CASE WHEN games == 0 THEN 0.0 ELSE fgm / games END as fgm,
    CASE WHEN games == 0 THEN 0.0 ELSE fta / games END as fta,
    CASE WHEN games == 0 THEN 0.0 ELSE ftm / games END as ftm,
    CASE WHEN games == 0 THEN 0.0 ELSE turnovers / games END as turnovers,
    CASE WHEN games == 0 THEN 0.0 ELSE pf / games END as pf
FROM data1;
"""
        cherrypy.log(query1b)
        db.execute(query1b);

    def query2(self, db):
        query2 = """
CREATE TEMP TABLE data2 AS
SELECT
    name, team, pos, age, player_id, rotoworld_id, owner_id, draft_position,
    games, dnp, min, pts, tpm, reb, ast, stl, blk, fgm, fga, ftm, fta,
    (pts - 14.35475088) / 4.69424049 AS zpts,
    (tpm - 1.046000798) / 0.831125077 AS ztpm,
    (reb - 5.470573613) / 2.635452221 AS zreb,
    (ast - 3.246593841) / 2.155897725 AS zast,
    (stl - 1.018010561) / 0.423021501 AS zstl,
    (blk - 0.602942934) / 0.545058275 AS zblk,
    CASE WHEN fga = 0 THEN 0.0 ELSE (((fgm / fga) - 0.465815549) / 0.054609879) * (fga / 11.52125367) END AS zfg,
    CASE WHEN fta = 0 THEN 0.0 ELSE (((ftm / fta) - 0.772864612) / 0.094757395) * (fta / 3.404121105) END AS zft
FROM data1b;
"""
        cherrypy.log(query2)
        db.execute(query2)

    def query3(self, db):

        format_args = tuple(
            self.factors.as_tuple() + self.factors.as_tuple() + (self.factors.sum(), )
        )

        query3 = """
CREATE TEMP TABLE data3 AS
SELECT
    name, team, pos, age, player_id, rotoworld_id, owner_id, draft_position,
    games, dnp, min, pts, tpm, reb, ast, stl, blk,
    fgm, fga, CASE WHEN fga == 0.0 THEN 0.0 ELSE fgm*1.0 / fga END as fgp,
    ftm, fta, CASE WHEN fta == 0.0 THEN 0.0 ELSE ftm*1.0 / fta END as ftp,
    zpts * %f as zpts,
    ztpm * %f as ztpm,
    zreb * %f as zreb,
    zast * %f as zast,
    zstl * %f as zstl,
    zblk * %f as zblk,
    zfg * %f as zfg,
    zft * %f as zft,
    (zpts * %f + ztpm * %f + zreb * %f + zast * %f + zstl * %f + zblk * %f + zfg * %f + zft * %f) / %f as z
FROM data2
ORDER BY z DESC;
""" % format_args

        cherrypy.log(query3)
        db.execute(query3)

    def query4(self, db):
        # makes the assumption that both self.owners and self.player_id won't both be non-None
        additional_sql = ""
        if self.owners is not None:
            additional_sql = "WHERE owner_id in (%s)" % ",".join([str(x) for x in self.owners])
        if self.player_id is not None:
            additional_sql = "WHERE player_id in (%d)" % self.player_id

        query4 = "SELECT ROWID as rank, * FROM data3 %s;" % additional_sql
        cherrypy.log(query4)
        db.execute(query4)
        return convert_results(db)


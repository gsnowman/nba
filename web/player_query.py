import itertools
import datetime as dt

class Factors:
    def __init__(self, arr):
        self.pts, self.tpm, self.reb, self.ast, self.stl, self.blk, self.fg, self.ft = arr
    def as_tuple(self):
        return (self.pts, self.tpm, self.reb, self.ast, self.stl, self.blk, self.fg, self.ft)
    def sum(self):
        return sum(self.as_tuple())

class PlayerQuery:
    def __init__(self):
        self.owners = None
        self.days = 1000
        self.factors = Factors([1.0] * 8)

    def results(self, db):
        field_names = [d[0].lower() for d in db.description]
        rows = db.fetchall()
        return [dict(itertools.izip(field_names, row)) for row in rows]

    def remove_owned(self):
        self.owners = [0]

    def query1(self, db):
        as_of_date = (dt.datetime.now() - dt.timedelta(days=int(self.days))).strftime("%Y-%m-%d")
        query1 = """
CREATE TEMP TABLE data1 AS
SELECT
    REPLACE(P.first || ' ' || P.last, "'", "") as name,
    P.team as team,
    P.pos as pos,
    P.age as age,
    P.player_id as player_id,
    CASE WHEN IDS.rotoworld IS NULL THEN 0 ELSE IDS.rotoworld END as rotoworld_id,
    CASE WHEN O.owner_id IS NULL THEN 0 ELSE O.owner_id END as owner_id,
    COUNT(*) - SUM(dnp) as games,
    SUM(dnp) as dnp,
    SUM(min)*1.0 / (COUNT(*) - SUM(dnp)) as min,
    SUM(reb)*1.0 / (COUNT(*) - SUM(dnp)) as reb,
    SUM(oreb)*1.0 / (COUNT(*) - SUM(dnp)) as off,
    SUM(dreb)*1.0 / (COUNT(*) - SUM(dnp)) as def,
    SUM(ast)*1.0 / (COUNT(*) - SUM(dnp)) as ast,
    SUM(stl)*1.0 / (COUNT(*) - SUM(dnp)) as stl,
    SUM(blk)*1.0 / (COUNT(*) - SUM(dnp)) as blk,
    SUM(pts)*1.0 / (COUNT(*) - SUM(dnp)) as pts,
    SUM(tpa)*1.0 / (COUNT(*) - SUM(dnp)) as tpa,
    SUM(tpm)*1.0 / (COUNT(*) - SUM(dnp)) as tpm,
    SUM(fga)*1.0 / (COUNT(*) - SUM(dnp)) as fga,
    SUM(fgm)*1.0 / (COUNT(*) - SUM(dnp)) as fgm,
    SUM(fta)*1.0 / (COUNT(*) - SUM(dnp)) as fta,
    SUM(ftm)*1.0 / (COUNT(*) - SUM(dnp)) as ftm,
    SUM(turnovers)*1.0 / (COUNT(*) - SUM(dnp)) as turnovers,
    SUM(pf)*1.0 / (COUNT(*) - SUM(dnp)) as pf
FROM games G
INNER JOIN players P ON G.player_id == P.player_id
LEFT OUTER JOIN owned O ON P.player_id == O.player_id
LEFT OUTER JOIN player_ids IDS ON P.player_id == IDS.yahoo
WHERE G.date >= '%s'
GROUP BY G.player_id;
""" % (as_of_date)
        db.execute(query1)

    def query2(self, db):
        query2 = """
CREATE TEMP TABLE data2 AS
SELECT
    name, team, pos, age, player_id, rotoworld_id, owner_id, games, dnp, min, pts, tpm, reb, ast, stl, blk, fgm, fga, ftm, fta,
    (pts - 14.35475088) / 4.69424049 AS zpts,
    (tpm - 1.046000798) / 0.831125077 AS ztpm,
    (reb - 5.470573613) / 2.635452221 AS zreb,
    (ast - 3.246593841) / 2.155897725 AS zast,
    (stl - 1.018010561) / 0.423021501 AS zstl,
    (blk - 0.602942934) / 0.545058275 AS zblk,
    CASE WHEN fga = 0 THEN 0.0 ELSE (((fgm / fga) - 0.465815549) / 0.054609879) * (fga / 11.52125367) END AS zfg,
    CASE WHEN fta = 0 THEN 0.0 ELSE (((ftm / fta) - 0.772864612) / 0.094757395) * (fta / 3.404121105) END AS zft
FROM data1;
"""
        db.execute(query2)

    def query3(self, db):

        owner_sql = ""
        if self.owners is not None:
            owner_sql = " AND owner_id in (%s)" % ",".join([str(x) for x in self.owners])

        format_args = tuple(
            self.factors.as_tuple() + self.factors.as_tuple() + (self.factors.sum(), owner_sql)
        )

        query3 = """
SELECT
    name, team, pos, age, player_id, rotoworld_id, owner_id, games, dnp,
    min, pts, tpm, reb, ast, stl, blk,
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
WHERE min > 0.0 %s
ORDER BY z DESC
LIMIT 200;
""" % format_args

        db.execute(query3)
        res = self.results(db)
        db.execute("DROP TABLE data1;")
        db.execute("DROP TABLE data2;")
        return res


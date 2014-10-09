import os
import cherrypy
import webbrowser
import sqlite3
import itertools

DB_STRING = "../nba.sqlite"

def results(curs):
    field_names = [d[0].lower() for d in curs.description]
    rows = curs.fetchall()
    return [dict(itertools.izip(field_names, row)) for row in rows]

class Stats(object):
    @cherrypy.expose
    def test(self, *args, **kwargs):
        return file('public/test.html')

    @cherrypy.expose
    def player(self, *args, **kwargs):
        return file('public/player.html')

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def all_players(self, pts, tpm, reb, ast, stl, blk, fg, ft, season, remove_owned):
        # convert arguments to floats
        pts, tpm, reb, ast, stl, blk, fg, ft = [float(x) for x in [pts, tpm, reb, ast, stl, blk, fg, ft]]
        remove_owned = int(remove_owned)

        remove_owned_sql = "AND SV.player_id NOT IN (SELECT player_id from owned)" if remove_owned == 1 else ""
        sum_z = sum([pts, tpm, reb, ast, stl, blk, fg, ft])
        query = """
SELECT
    season,
    REPLACE(P.first || ' ' || P.last, "'", "") as name,
    SV.player_id,
    CASE WHEN O.owner_id IS NULL THEN 0 ELSE O.owner_id END,
    pts, zpts * %f as zpts,
    tpm, ztpm * %f as ztpm,
    reb, zreb * %f as zreb,
    ast, zast * %f as zast,
    stl, zstl * %f as zstl,
    blk, zblk * %f as zblk,
    fga, fgp, zfg * %f as zfg,
    fta, ftp, zft * %f as zft,
    (zpts * %f + ztpm * %f + zreb * %f + zast * %f + zstl * %f + zblk * %f + zfg * %f + zft * %f) / %f as z
FROM
    season_values SV
INNER JOIN
    players P ON SV.player_id == P.player_id
LEFT OUTER JOIN
    owned O ON SV.player_id == O.player_id
WHERE
    season like '%s' %s
ORDER BY z DESC;
""" % (pts, tpm, reb, ast, stl, blk, fg, ft, pts, tpm, reb, ast, stl, blk, fg, ft, sum_z, season, remove_owned_sql)

        cherrypy.log("all_players :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return results(cur)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_player(self, player_id, pts=1.0, tpm=1.0, reb=1.0, ast=1.0, stl=1.0, blk=1.0, fg=1.0, ft=1.0):
        player_id = int(player_id)
        pts, tpm, reb, ast, stl, blk, fg, ft = [float(x) for x in [pts, tpm, reb, ast, stl, blk, fg, ft]]
        sum_z = sum([pts, tpm, reb, ast, stl, blk, fg, ft])
        query = """
SELECT
    season,
    REPLACE(P.first || ' ' || P.last, "'", "") as name,
    SV.player_id,
    games,
    pts, zpts * %f as zpts,
    tpm, ztpm * %f as ztpm,
    reb, zreb * %f as zreb,
    ast, zast * %f as zast,
    stl, zstl * %f as zstl,
    blk, zblk * %f as zblk,
    fga, fgp, zfg * %f as zfg,
    fta, ftp, zft * %f as zft,
    (zpts * %f + ztpm * %f + zreb * %f + zast * %f + zstl * %f + zblk * %f + zfg * %f + zft * %f) / %f as z
FROM
    season_values SV
INNER JOIN
    players P ON SV.player_id = P.player_id
WHERE SV.player_id = %d ORDER BY season ASC;
""" % (pts, tpm, reb, ast, stl, blk, fg, ft, pts, tpm, reb, ast, stl, blk, fg, ft, sum_z, player_id)

        cherrypy.log("get_player :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return results(cur)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_seasons(self):
        query = "SELECT DISTINCT season FROM season_values ORDER BY season ASC;"
        cherrypy.log("get_seasons :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return [x['season'] for x in results(cur)]

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_owners(self):
        query = "SELECT owner_id, name FROM owners ORDER BY owner_id ASC;"
        cherrypy.log("get_owners :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return results(cur)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def set_owner(self, player_id, owner_id):
        player_id, owner_id = [float(x) for x in [player_id, owner_id]]
        query1 = "DELETE FROM owned where player_id = %d;" % player_id
        query2 = "INSERT INTO owned VALUES (%d, %d);" % (owner_id, player_id)

        cherrypy.log("set_owner :: query1: %s" % query1)
        if (owner_id != 0):
            cherrypy.log("set_owner :: query2: %s" % query2)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query1)
            if (owner_id != 0):
                cur.execute(query2)
        return []

if __name__ == '__main__':
    conf = {
        '/': {
            'tools.sessions.on': True,
            'tools.staticdir.root': os.path.abspath(os.getcwd())
        },
        '/public': {
            'tools.staticdir.on': True,
            'tools.staticdir.dir': './public'
        }
    }

    webbrowser.open('http://127.0.0.1:8080/public/index.html')
    cherrypy.quickstart(Stats(), '/', conf)


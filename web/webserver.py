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
    def player(self, *args, **kwargs):
        return file('public/player.html')

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def all_players(self, pts=1.0, tpm=1.0, reb=1.0, ast=1.0, stl=1.0, blk=1.0, fg=1.0, ft=1.0, season='2014-15_ESPN'):
        # TODO: add season and a drop-down on the UI

        # TODO: we can probably remove ztotal and other non-necessary fields from the season_values table
        # convert arguments to floats
        pts, tpm, reb, ast, stl, blk, fg, ft = [float(x) for x in [pts, tpm, reb, ast, stl, blk, fg, ft]]
        sum_z = sum([pts, tpm, reb, ast, stl, blk, fg, ft])
        query = """
SELECT
    season,
    P.first || ' ' || P.last as name,
    SV.player_id,
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
WHERE season like '%s' ORDER BY z DESC;
""" % (pts, tpm, reb, ast, stl, blk, fg, ft, pts, tpm, reb, ast, stl, blk, fg, ft, sum_z, season)

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
    P.first || ' ' || P.last as name,
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
        query = """
SELECT DISTINCT season FROM season_values ORDER BY season ASC;
"""
        cherrypy.log("get_seasons :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return [x['season'] for x in results(cur)]

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


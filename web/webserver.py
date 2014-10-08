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
    @cherrypy.tools.json_out()
    def all_players(self, pts=1.0, tpm=1.0, reb=1.0, ast=1.0, stl=1.0, blk=1.0, fg=1.0, ft=1.0):
        # TODO: add season and a drop-down on the UI
        # convert arguments to floats
        pts, tpm, reb, ast, stl, blk, fg, ft = [float(x) for x in [pts, tpm, reb, ast, stl, blk, fg, ft]]
        # calculate the sum of the scaling factors
        sum_z = sum([pts, tpm, reb, ast, stl, blk, fg, ft])
        query = """
SELECT
    season,
    name,
    player_id,
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
    season_values WHERE season like '2014-%%' ORDER BY season ASC, z DESC;
""" % (pts, tpm, reb, ast, stl, blk, fg, ft, pts, tpm, reb, ast, stl, blk, fg, ft, sum_z)

        cherrypy.log("all_players :: query: %s" % query)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            cur = con.cursor()
            cur.execute(query)
            return results(cur)

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


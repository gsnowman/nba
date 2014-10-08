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
    def all_players(self):
        query = """
SELECT
    season, name, player_id, pts, zpts, tpm, ztpm, reb, zreb,
    ast, zast, stl, zstl, blk, zblk, fga, fgp, zfg, fta, ftp, zft, ztotal, ztotal / 8.0 as z
FROM
    season_values WHERE season like '2014-%' ORDER BY season ASC, ztotal DESC;
"""
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


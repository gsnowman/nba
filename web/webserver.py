import os
import cherrypy
import webbrowser
import sqlite3
import itertools
from player_query import PlayerQuery, Factors, GameQuery
import datetime as dt

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
    def team(self, *args, **kwargs):
        return file('public/team.html')

    @cherrypy.expose
    def all(self, *args, **kwargs):
        return file('public/all.html')

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def all_players(self, pts, tpm, reb, ast, stl, blk, fg, ft, season, teams, remove_owned, num_days):
        query = PlayerQuery()
        if int(remove_owned) == 1:
            query.remove_owned()
        if len(teams) > 0:
            query.teams = teams.split(',')
        query.factors = Factors([float(x) for x in [pts, tpm, reb, ast, stl, blk, fg, ft]])
        query.days = int(num_days)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            return query.query(con.cursor())

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_player_game_log(self, player_id):
        query = GameQuery()
        query.player_id = int(player_id)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            return query.query(con.cursor())

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_player_seasons(self, player_id):
        player_id = int(player_id)
        pts, tpm, reb, ast, stl, blk, fg, ft = [float(x) for x in [1] * 8]
        sum_z = sum([pts, tpm, reb, ast, stl, blk, fg, ft])
        query = """
SELECT
    season,
    REPLACE(P.first || ' ' || P.last, "'", "") as name,
    SV.player_id,
    games,
    min,
    SV.team,
    pts, zpts * %f as zpts,
    tpm, ztpm * %f as ztpm,
    reb, zreb * %f as zreb,
    ast, zast * %f as zast,
    stl, zstl * %f as zstl,
    blk, zblk * %f as zblk,
    fga * fgp as fgm, fga, fgp, zfg * %f as zfg,
    fta * ftp as ftm, fta, ftp, zft * %f as zft,
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

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_team(self, owner_id, num_days):

        query = PlayerQuery()
        query.owners = [int(owner_id)]
        query.days = int(num_days)

        with sqlite3.connect(DB_STRING) as con:
            con.row_factory = sqlite3.Row
            return query.query(con.cursor())

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def get_player_periods(self, player_id):
        #fmt_string = "%d days"
        #query_elements = [7, 17, 30, 60, None]
        fmt_string = "Month: %s"
        query_elements = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', None]
        all_results = []

        for element in query_elements:
            with sqlite3.connect(DB_STRING) as con:
                con.row_factory = sqlite3.Row
                query = PlayerQuery()
                query.player_id = int(player_id)
                if element is not None:
                    #query.days = days
                    query.month = element
                    results = query.query(con.cursor())
                    results[0]['period'] = fmt_string % element
                    all_results.append(results)
                else:
                    query.days = 999
                    results = query.query(con.cursor())
                    results[0]['period'] = 'season'
                    all_results.append(results)

        return all_results

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

    #webbrowser.open('http://127.0.0.1:8080/all')
    cherrypy.quickstart(Stats(), '/', conf)


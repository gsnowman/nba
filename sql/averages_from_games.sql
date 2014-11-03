
DELETE FROM averages WHERE season = '2014-15';

INSERT INTO
    averages
SELECT
    '2014-15' as season,
    P.player_id as player_id,
    P.team as team,
    COUNT(*) as games,
    SUM(min)*1.0 / COUNT(*) as min,
    SUM(reb)*1.0 / COUNT(*) as reb,
    SUM(oreb)*1.0 / COUNT(*) as off,
    SUM(dreb)*1.0 / COUNT(*) as def,
    SUM(ast)*1.0 / COUNT(*) as ast,
    SUM(stl)*1.0 / COUNT(*) as stl,
    SUM(blk)*1.0 / COUNT(*) as blk,
    SUM(pts)*1.0 / COUNT(*) as pts,
    SUM(tpa)*1.0 / COUNT(*) as tpa,
    SUM(tpm)*1.0 / COUNT(*) as tpm,
    SUM(fga)*1.0 / COUNT(*) as fga,
    SUM(fgm)*1.0 / COUNT(*) as fgm,
    SUM(fta)*1.0 / COUNT(*) as fta,
    SUM(ftm)*1.0 / COUNT(*) as ftm,
    SUM(turnovers)*1.0 / COUNT(*) as turnovers,
    SUM(pf)*1.0 / COUNT(*) as pf
FROM
    games G
INNER JOIN
    players P
ON
    G.player_id = P.player_id
WHERE
    G.dnp == 0
GROUP BY
    G.player_id;

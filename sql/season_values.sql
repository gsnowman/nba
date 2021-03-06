DROP TABLE season_values;

CREATE TABLE season_values
AS
SELECT
    A.season,
    P.player_id,
    A.team,
    games,
    min,
    pts AS pts,
    tpm AS tpm,
    reb AS reb,
    ast AS ast,
    stl AS stl,
    blk AS blk,
    fgm AS fgm,
    fga AS fga,
    CASE WHEN fga = 0 THEN 0.0 ELSE fgm / fga END AS fgp,
    ftm AS ftm,
    fta AS fta,
    CASE WHEN fta = 0 THEN 0.0 ELSE ftm / fta END AS ftp,
    (pts - 14.35475088) / 4.69424049 AS zpts,
    (tpm - 1.046000798) / 0.831125077 AS ztpm,
    (reb - 5.470573613) / 2.635452221 AS zreb,
    (ast - 3.246593841) / 2.155897725 AS zast,
    (stl - 1.018010561) / 0.423021501 AS zstl,
    (blk - 0.602942934) / 0.545058275 AS zblk,
    CASE WHEN fga = 0 THEN 0.0 ELSE (((fgm / fga) - 0.465815549) / 0.054609879) * (fga / 11.52125367) END AS zfg,
    CASE WHEN fta = 0 THEN 0.0 ELSE (((ftm / fta) - 0.772864612) / 0.094757395) * (fta / 3.404121105) END AS zft
FROM averages A
    INNER JOIN players P on p.player_id = A.player_id;


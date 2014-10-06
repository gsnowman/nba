nba
===

# TODO
- get players from here: http://sports.yahoo.com/nba/players?type=lastname&query=A (there are many players that don't show up on NBA rosters)

## Excel Files
- 2013-14_YahooTop168.xls
  - Top 168 players from Yahoo's rankings, used to produce means and standard deviations for calculating the real means and standard devs (Yahoo only provides averages to 1 decimal place).
- CalcMeansAndStDevs.xlsx
  - Calculate the top 168 using the means and standard devs from Y!.  Can then use our stats for calculating real means and standard devs because we have exact averages.
- Shared Means, Z-scores sheets 2013-14 stats.xlsx
  - From Rotoworld article on calculating means, standard devs and z-scores.

### Using Yahoo Top 168
Stat|Mean|Std Dev|
----|:----:|:----:|
pts |14.102|4.879|
tpm |1.040|0.846|
reb |5.499|2.604|
ast |3.056|2.145|
stl |1.010|0.429|
blk |0.635|0.548|
fg% |0.469|0.055|
fga |11.274|3.652|
ft% |0.773|0.094|
fta |3.326|1.854|

### Using My Top 168
Stat|Mean|Std Dev|
----|:----:|:----:|
pts |14.35475088|14.35475088|
tpm |1.046000798|0.831125077|
reb |5.470573613|2.635452221|
ast |3.246593841|2.155897725|
stl |1.018010561|0.423021501|
blk |0.602942934|0.545058275|
fg% |0.465815549|0.054609879|
fga |11.52125367|3.471976413|
ft% |0.772864612|0.094757395|
fta |3.404121105|1.838557163|

## Projections
- Parse data from http://games.espn.go.com/fba/tools/projections
- Use projected averages to estimate player z-score values for 2014-15 season

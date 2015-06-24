#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
cd "${DIR}"
. ../etc/set_ruby_lib.sh

ruby fetch_games.rb '2015-03-14'
ruby fetch_games.rb '2015-03-15'
ruby fetch_games.rb '2015-03-16'
ruby fetch_games.rb '2015-03-17'
ruby fetch_games.rb '2015-03-18'
ruby fetch_games.rb '2015-03-19'
ruby fetch_games.rb '2015-03-20'
ruby fetch_games.rb '2015-03-21'
ruby fetch_games.rb '2015-03-22'
ruby fetch_games.rb '2015-03-23'
ruby fetch_games.rb '2015-03-24'
ruby fetch_games.rb '2015-03-25'
ruby fetch_games.rb '2015-03-26'
ruby fetch_games.rb '2015-03-27'
ruby fetch_games.rb '2015-03-28'
ruby fetch_games.rb '2015-03-29'
ruby fetch_games.rb '2015-03-30'
ruby fetch_games.rb '2015-03-31'
ruby fetch_games.rb '2015-04-01'
ruby fetch_games.rb '2015-04-02'
ruby fetch_games.rb '2015-04-03'
ruby fetch_games.rb '2015-04-04'
ruby fetch_games.rb '2015-04-05'

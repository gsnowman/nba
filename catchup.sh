#!/bin/bash

. etc/set_ruby_lib.sh

for date in "2016-01-24" "2016-01-25" "2016-01-26" "2016-01-27" "2016-01-28" "2016-01-29"; do
    echo -n "Fetching date ${date}..."
    ruby ruby/fetch_games.rb "${date}" 2>&1 >> catchup.log
    echo "Done"
done


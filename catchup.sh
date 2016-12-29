#!/bin/bash

. etc/set_ruby_lib.sh

for date in "2016-03-09" "2016-03-10"; do
    echo -n "Fetching date ${date}..."
    ruby ruby/fetch_games.rb "${date}" 2>&1 >> catchup.log
    echo "Done"
done


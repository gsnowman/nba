#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
cd "${DIR}"

export RUBYLIB=$RUBYLIB:"${DIR}/ruby"

DATE=$(ruby $MY_HOME/fmtdate.rb b1)
FILE="log/${DATE}.log"

WEEK_NUM=4

echo "Fetching games for yesterday..."            | tee -a "${FILE}.log"
echo "==========================================" | tee -a "${FILE}.log"
ruby ruby/fetch_games.rb                          | tee -a "${FILE}.log"

echo "Updating owned status..."                   | tee -a "${FILE}.log"
echo "==========================================" | tee -a "${FILE}.log"
ruby ruby/update_owned_status.rb                  | tee -a "${FILE}.log"

echo "Generating week stats, week ${WEEK_NUM}..." | tee -a "${FILE}.log"
echo "==========================================" | tee -a "${FILE}.log"
ruby ruby/generate_week_stats.rb "${WEEK_NUM}"    | tee -a "${FILE}.log"


#!/bin/bash

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
sqlite3 "${THIS_DIR}/../nba.sqlite" ".read ${THIS_DIR}/../sql/season_values.sql"


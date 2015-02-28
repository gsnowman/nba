#!/bin/bash

DIR=$(cd $(dirname $0) && pwd)
cd "${DIR}"
. ../etc/set_ruby_lib.sh

ruby fetch_games.rb '2015-02-27'


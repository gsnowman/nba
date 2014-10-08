#!/bin/bash

THIS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

export RUBYLIB=$RUBYLIB:${THIS_DIR}/../ruby

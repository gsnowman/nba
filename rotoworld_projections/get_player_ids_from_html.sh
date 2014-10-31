#!/bin/bash

grep -o "playerpage.aspx\?pid=[0-9]+" rotoworld_projections.html | awk -F'=' '{print $NF}' | pbcopy


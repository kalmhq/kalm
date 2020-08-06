#!/bin/bash
set -e

SRC_DIR=$(pwd)/../src

if [[ $(git status -s $SRC_DIR) != "" ]]
then
    npm run lint && react-scripts test --watchAll=false
else
    echo "frontend src dir is clean. Skip pre commit hook."
fi
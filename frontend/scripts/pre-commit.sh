#!/bin/bash
set -e

CURRENT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
SRC_DIR=$CURRENT_DIR/../src

if [[ $(git status -s $SRC_DIR) != "" ]]
then
    cd $CURRENT_DIR/..
    npm run lint && ./node_modules/.bin/react-scripts test --watchAll=false
else
    echo "frontend src dir is clean. Skip pre commit hook."
fi

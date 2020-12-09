#!/bin/bash

git stash push -m "deploying"

BRANCH=$(git branch --show-current)

if [ -z $BRANCH ] || [ $BRANCH != "dev" ]; then
    echo "switch branch to dev"
    exit 1
fi
git push origin dev

gh-pages -d web-build --remote=gh-pages

git checkout master
git merge dev --no-edit
git push origin master

git checkout dev

git stash apply

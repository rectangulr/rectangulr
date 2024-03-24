#!/bin/env bash

set -ex

error=0

grep --line-number -R 'public-api' src/ && error=1

grep --line-number -R 'fit(' src/ && error=1
grep --line-number -R "from 'console'" src/ && error=1

# If in CI, check that no file is .mjs
if [ -n "$CI" ]; then
    res=$(find -name '*.mjs')
    if [ -n "$res" ]; then
        echo "Files with .mjs extension found in commit:"
        echo $res
        error=1
    fi
fi

if [ $error -eq 1 ]; then
    exit 1
fi

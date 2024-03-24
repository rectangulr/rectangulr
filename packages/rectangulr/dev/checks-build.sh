#!/bin/env bash

set -ex

error=0

grep --line-number '@rectangulr' dist/public-api.d.ts && error=1

if [ $error -eq 1 ]; then
    exit 1
fi

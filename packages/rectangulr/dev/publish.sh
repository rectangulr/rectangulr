#!/bin/env bash
set -ex

cd $(dirname $0)/../dist
pwd

npm publish --access public

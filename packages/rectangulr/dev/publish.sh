#!/bin/env bash
set -ex

cd $(dirname $0)/../dist
pwd

npx publish-if-not-exists --access public

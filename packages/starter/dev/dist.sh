#!/bin/env bash
set -ex

mkdir -p dist
cp dist-angular/main.js dist/main.js
cp dist-angular/runtime.js dist/

echo '{"type":"commonjs"}' > dist/package.json

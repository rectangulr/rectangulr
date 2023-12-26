#!/bin/env bash
set -ex

mkdir -p dist

cp -r dist-angular/* dist/
# rm dist/package.json

# # cp -r dist-angular/fesm2022 dist
# cp -r dist-angular/esm2022 dist
# cp -r dist-angular/package.json dist

# # Copy all the .d.ts files
# mkdir -p dist/types
# (cd dist-angular; find -name '*.d.ts' -exec cp -R --parents {} ../dist/types \;)

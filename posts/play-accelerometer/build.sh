#!/usr/bin/env bash

pushd ../../packages/play-accelerometer
bun i
bun run build
popd
rm -r dist
cp -r ../../packages/play-accelerometer/dist ./dist

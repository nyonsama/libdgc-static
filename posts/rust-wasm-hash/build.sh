#!/usr/bin/env bash

pushd ../../packages/rust-wasm-hash
bun i
bun run build
popd
rm -r dist
cp -r ../../packages/rust-wasm-hash/dist ./dist

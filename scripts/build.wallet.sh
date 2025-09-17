#!/usr/bin/env bash
./src/wallet/build.sh

candid-extractor target/wasm32-unknown-unknown/release/wallet.wasm > src/wallet/wallet.did

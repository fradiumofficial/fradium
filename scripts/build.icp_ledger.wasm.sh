#!/bin/bash

# Download ICP ledger and index canisters

DIR=target/ic

if [ ! -d "$DIR" ]; then
  mkdir "$DIR"
fi

IC_VERSION=047925dfd8386aca91d154054149727131766084

scripts/download-immutable.sh "https://download.dfinity.systems/ic/$IC_VERSION/canisters/ledger-canister.wasm.gz" "$DIR"/icp_ledger.wasm.gz
gunzip --force "$DIR"/icp_ledger.wasm.gz
scripts/download-immutable.sh "https://raw.githubusercontent.com/dfinity/ic/$IC_VERSION/rs/ledger_suite/icp/ledger.did" "$DIR"/icp_ledger.did

#!/bin/bash
DIR=target/ic

if [ ! -d "$DIR" ]; then
  mkdir "$DIR"
fi

IC_VERSION=6dcfafb491092704d374317d9a72a7ad2475d7c9

scripts/download-immutable.sh "https://download.dfinity.systems/ic/$IC_VERSION/canisters/ic-icp-index-canister.wasm.gz" "$DIR"/icp_index.wasm.gz
gunzip --force "$DIR"/icp_index.wasm.gz
scripts/download-immutable.sh "https://raw.githubusercontent.com/dfinity/ic/$IC_VERSION/rs/ledger_suite/icp/index/index.did" "$DIR"/icp_index.did
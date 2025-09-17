#!/usr/bin/env bash
ARGS_FILE="$(jq -re .canisters.fradium_index.init_arg_file dfx.json)"
mkdir -p "$(dirname "$ARGS_FILE")"

mkdir -p target/ic
cat <<EOF >"$ARGS_FILE"
(opt variant { 
    Init = record { 
        ledger_id = principal "${CANISTER_ID_FRADIUM_LEDGER}";
        retrieve_blocks_from_ledger_interval_seconds = opt 10; 
    } 
})
EOF
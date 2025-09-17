#!/usr/bin/env bash
ARGS_FILE="$(jq -re .canisters.icp_index.init_arg_file dfx.json)"
mkdir -p "$(dirname "$ARGS_FILE")"

mkdir -p target/ic
cat <<EOF >"$ARGS_FILE"
   (record {ledger_id = principal"${CANISTER_ID_ICP_LEDGER}";})
EOF
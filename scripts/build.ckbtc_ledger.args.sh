#!/usr/bin/env bash
set -euxo pipefail

# Ensure that a minter id exists:
dfx identity get-principal --identity minter 2>/dev/null || dfx identity new minter --storage-mode=plaintext

MINTER_PRINCIPAL=$(dfx identity get-principal --identity minter)
CALLER_PRINCIPAL=$(dfx identity get-principal)

ARGS_FILE="$(jq -re .canisters.ckbtc_ledger.init_arg_file dfx.json)"
mkdir -p "$(dirname "$ARGS_FILE")"

mkdir -p target/ic
cat <<EOF >"$ARGS_FILE"
(variant {
  Init = record {
    token_symbol = "ckBTC";
    token_name = "Chain key local Bitcoin";
    minting_account = record { owner = principal "$MINTER_PRINCIPAL" };
    transfer_fee = 11_500;
    metadata = vec {};
    max_memo_length = opt 80;
    initial_balances = vec {record { record { owner = principal "$CALLER_PRINCIPAL"; }; 100_000_000_000; }; };
    archive_options = record {
      num_blocks_to_archive = 10_000;
      trigger_threshold = 20_000;
      controller_id = principal "$CALLER_PRINCIPAL";
      cycles_for_archive_creation = opt 1_000_000_000_000;
      max_message_size_bytes = null;
      node_max_memory_size_bytes = opt 3_221_225_472;
    };
    feature_flags  = opt record { icrc2 = true };
  }
})
EOF

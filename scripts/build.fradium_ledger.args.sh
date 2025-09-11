#!/usr/bin/env bash
# Ensure that a minter id exists:
dfx identity get-principal --identity minter 2>/dev/null || dfx identity new minter --storage-mode=plaintext
dfx identity get-principal --identity archive_controller 2>/dev/null || dfx identity new archive_controller --storage-mode=plaintext

# Set up minter identity and get minter account ID
export MINTER_ACCOUNT_ID=$(dfx identity get-principal --identity minter)

# Set up deployer identity and get deployer principal
export DEPLOY_ID=$(dfx identity get-principal)

# Set up archive controller identity and parameters
export ARCHIVE_CONTROLLER=$(dfx identity get-principal --identity archive_controller)

# Token information
export TOKEN_NAME="Fradium Token"
export TOKEN_SYMBOL="FRADIUM"

# Token economics parameters
export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=10_000

# Archive parameters
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# Feature flags
export FEATURE_FLAGS=true

ARGS_FILE="$(jq -re .canisters.fradium_ledger.init_arg_file dfx.json)"
mkdir -p "$(dirname "$ARGS_FILE")"

mkdir -p target/ic
cat <<EOF >"$ARGS_FILE"
(variant {Init =
record {
     token_symbol = "${TOKEN_SYMBOL}";
     token_name = "${TOKEN_NAME}";
     minting_account = record { owner = principal "${MINTER_ACCOUNT_ID}" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal "${DEPLOY_ID}"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal "${ARCHIVE_CONTROLLER}";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})
EOF

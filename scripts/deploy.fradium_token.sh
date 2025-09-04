
# =========================
# Set up minter identity and get minter account ID
# =========================
dfx identity use minter
# export MINTER_ACCOUNT_ID=$(dfx canister id backend)
export MINTER_ACCOUNT_ID=$(dfx identity get-principal)

# =========================
# Token information
# =========================
export TOKEN_NAME="Fradium Token"
export TOKEN_SYMBOL="FADM"

# =========================
# Set up deployer identity and get deployer principal
# =========================
dfx identity use default
export DEPLOY_ID=$(dfx identity get-principal)

# =========================
# Token economics parameters
# =========================
export PRE_MINTED_TOKENS=10_000_000_000
export TRANSFER_FEE=10_000

# =========================
# Set up archive controller identity and parameters
# =========================
dfx identity new archive_controller --disable-encryption
dfx identity use archive_controller
export ARCHIVE_CONTROLLER=$(dfx identity get-principal)
export TRIGGER_THRESHOLD=2000
export NUM_OF_BLOCK_TO_ARCHIVE=1000
export CYCLE_FOR_ARCHIVE_CREATION=10000000000000

# =========================
# Feature flags
# =========================
export FEATURE_FLAGS=true

# =========================
# Deploy fradium_token canister with initialization arguments
# =========================
dfx deploy fradium_token --argument "(variant {Init =
record {
     token_symbol = \"${TOKEN_SYMBOL}\";
     token_name = \"${TOKEN_NAME}\";
     minting_account = record { owner = principal \"${MINTER_ACCOUNT_ID}\" };
     transfer_fee = ${TRANSFER_FEE};
     metadata = vec {};
     feature_flags = opt record{icrc2 = ${FEATURE_FLAGS}};
     initial_balances = vec { record { record { owner = principal \"${DEPLOY_ID}\"; }; ${PRE_MINTED_TOKENS}; }; };
     archive_options = record {
         num_blocks_to_archive = ${NUM_OF_BLOCK_TO_ARCHIVE};
         trigger_threshold = ${TRIGGER_THRESHOLD};
         controller_id = principal \"${ARCHIVE_CONTROLLER}\";
         cycles_for_archive_creation = opt ${CYCLE_FOR_ARCHIVE_CREATION};
     };
 }
})"

echo "Token initialized successfully" 

# =========================
# Deploy fradium_token_index canister with initialization arguments
# =========================
export LEDGER_ID=$(dfx canister id fradium_token)
dfx deploy fradium_token_index --argument "(
    opt variant { 
        Init = record { 
            ledger_id = principal \"${LEDGER_ID}\";
            retrieve_blocks_from_ledger_interval_seconds = opt 10; 
        } 
    }
)"

echo "Token index deployed successfully" 
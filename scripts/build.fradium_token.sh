#!/bin/bash
dfx identity new fradium --disable-encryption
dfx identity use fradium

BACKEND_CANISTER_ID=$(dfx canister id backend)

# Create token with initial supply
dfx canister call token initialize_token "(
  record {
    \"principal\" = principal \"$BACKEND_CANISTER_ID\";
    initialSupply = 100_000_000_000_000_000 : nat;
    tokenSymbol = \"FUM\";
    tokenLogo = \"\";
    tokenName = \"Fradium Token\";
  },
)"

echo "Token initialized successfully" 
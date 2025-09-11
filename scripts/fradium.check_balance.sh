#!/usr/bin/env bash
dfx canister call "${CANISTER_ID_FRADIUM_LEDGER}" icrc1_balance_of "(
    record {
        owner = principal \"$(dfx identity get-principal --identity minter)\";
        subaccount = null;
    }
)"

#!/usr/bin/env bash
dfx canister call "${CANISTER_ID_ICP_LEDGER}" icrc1_balance_of "(
    record {
        owner = principal \"$(dfx identity get-principal)\";
        subaccount = null;
    }
)"

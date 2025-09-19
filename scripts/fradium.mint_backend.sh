
# Amount to transfer (sama dengan init mint pada build.icp_ledger.sh = 100 ICP)
AMOUNT=40000000000000000 
 # 100 ICP = 100_000_000_000 e8s
CANISTER_ID_BACKEND=$(dfx canister id backend)
# Transfer ICP to backend canister
echo "Transferring ICP to backend canister..."
TRANSFER_RESULT=$(dfx canister call fradium_ledger icrc1_transfer "(record { 
    from_subaccount = null; 
    to = record { owner = principal \"$CANISTER_ID_BACKEND\"; subaccount = null }; 
    amount = $AMOUNT; 
    fee = null; 
    memo = null; 
    created_at_time = null 
})")

echo "Transfer result: $TRANSFER_RESULT"
echo "Transfer completed!"

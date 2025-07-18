#!/bin/bash

# Script untuk membuat dummy data unsafe address
# Pastikan dfx sudah running dan user sudah login

echo "Creating dummy unsafe address data..."

# Get backend canister principal dynamically
BACKEND_CANISTER_ID=$(dfx canister id backend)
if [ -z "$BACKEND_CANISTER_ID" ]; then
    echo "Error: Failed to get backend canister ID. Make sure dfx is running and backend canister is deployed."
    exit 1
fi
echo "Backend canister ID: $BACKEND_CANISTER_ID"

# Step 1: Buat 3 user dengan principal berbeda
echo "Step 1: Creating 3 users..."

# User 1 - Reporter
echo "Creating User 1 (Reporter)..."
dfx identity new user1 --disable-encryption
dfx identity use safe_user1
USER1_PRINCIPAL=$(dfx identity get-principal)
echo "User 1 Principal: $USER1_PRINCIPAL"

# User 2 - Voter Yes
echo "Creating User 2 (Voter Yes)..."
dfx identity new user2 --disable-encryption
dfx identity use safe_user2
USER2_PRINCIPAL=$(dfx identity get-principal)
echo "User 2 Principal: $USER2_PRINCIPAL"

# User 3 - Voter No
echo "Creating User 3 (Voter No)..."
dfx identity new user3 --disable-encryption
dfx identity use safe_user3
USER3_PRINCIPAL=$(dfx identity get-principal)
echo "User 3 Principal: $USER3_PRINCIPAL"

# User 4 - Voter No
echo "Creating User 4 (Voter No)..."
dfx identity new user4 --disable-encryption
dfx identity use safe_user4
USER4_PRINCIPAL=$(dfx identity get-principal)
echo "User 4 Principal: $USER4_PRINCIPAL"



# Step 2: Claim faucet untuk semua user agar punya token untuk stake
echo "Step 2: Claiming faucet for all users..."

dfx identity use safe_user1
dfx identity get-principal
dfx canister call backend claim_faucet

dfx identity use safe_user2
dfx identity get-principal
dfx canister call backend claim_faucet

dfx identity use safe_user3
dfx identity get-principal
dfx canister call backend claim_faucet

dfx identity use safe_user4
dfx identity get-principal
dfx canister call backend claim_faucet

# Step 3: User 1 membuat report
echo "Step 3: User 1 creating report..."
dfx identity use safe_user1
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
dfx canister call token icrc2_approve '(record { from_subaccount = null; spender = principal "'$BACKEND_CANISTER_ID'"; amount = 500000000; expires_at = null; fee = null; memo = null; created_at_time = null })'
dfx canister call backend create_report '(record { chain = "Bitcoin"; address = "35bSzXvRKLpHsHMrzb82f617cV4Srnt7hS"; category = "scam"; description = "This is a dummy unsafe address for testing"; url = null; evidence = vec { "Evidence 1" }; stake_amount = 500000000 })'

# Step 4: User 2 vote YES (unsafe)
echo "Step 4: User 2 voting YES (unsafe)..."
dfx identity use safe_user2
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
dfx canister call token icrc2_approve '(record { from_subaccount = null; spender = principal "'$BACKEND_CANISTER_ID'"; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null })'
dfx canister call backend vote_report '(record { stake_amount = 100000000; vote_type = true; report_id = 0 })'

# Step 5: User 3 vote NO (safe)
echo "Step 5: User 3 voting NO (safe)..."
dfx identity use safe_user3
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
dfx canister call token icrc2_approve '(record { from_subaccount = null; spender = principal "'$BACKEND_CANISTER_ID'"; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null })'
dfx canister call backend vote_report '(record { stake_amount = 100000000; vote_type = false; report_id = 0 })'

# Step 6: User 4 vote NO (safe)
echo "Step 6: User 4 voting NO (safe)..."
dfx identity use safe_user4
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
dfx canister call token icrc2_approve '(record { from_subaccount = null; spender = principal "'$BACKEND_CANISTER_ID'"; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null })'
dfx canister call backend vote_report '(record { stake_amount = 100000000; vote_type = false; report_id = 0 })'

# Step 7: Ubah deadline agar report selesai dan dinyatakan unsafe
echo "Step 7: Changing deadline to make report unsafe..."
# Set deadline ke waktu yang sudah lewat (1 jam yang lalu)
dfx canister call backend admin_change_report_deadline "(1, 100000000)"

echo "Dummy data creation completed!"
echo "Address 35bSzXvRKLpHsHMrzb82f617cV4Srnt7hS should now be marked as safe"
echo ""
echo "User Principals:"
echo "User 1 (Reporter): $USER1_PRINCIPAL"
echo "User 2 (Voter Yes): $USER2_PRINCIPAL"
echo "User 3 (Voter No): $USER3_PRINCIPAL"
echo "User 4 (Voter No): $USER4_PRINCIPAL"
echo ""
echo "To test analyze_address function:"
echo "dfx canister call backend analyze_address '(\"35bSzXvRKLpHsHMrzb82f617cV4Srnt7hS\")'"

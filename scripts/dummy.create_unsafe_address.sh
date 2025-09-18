#!/bin/bash

# Script untuk membuat dummy data unsafe address
# Pastikan dfx sudah running dan user sudah login

# Suppress warning untuk plaintext identity di mainnet
export DFX_WARNING=-mainnet_plaintext_identity

echo "Creating dummy unsafe address data..."

# Get backend canister principal dynamically
BACKEND_CANISTER_ID=$(dfx canister id backend --ic)
if [ -z "$BACKEND_CANISTER_ID" ]; then
    echo "Error: Failed to get backend canister ID. Make sure dfx is running and backend canister is deployed."
    exit 1
fi
echo "Backend canister ID: $BACKEND_CANISTER_ID"

# Transfer token to backend canister untuk initial funding
# Fungsi ini sudah dipindahkan ke script transfer_icp_to_backend.sh
# Jalankan: ./scripts/transfer_icp_to_backend.sh

# Step 1: Buat 4 user dengan principal berbeda
echo "Step 1: Creating 4 users..."

# User 1 - Reporter
echo "Creating User 1 (Reporter)..."
dfx identity new user1 --storage-mode=plaintext 2>/dev/null || echo "User1 already exists"
dfx identity use user1
USER1_PRINCIPAL=$(dfx identity get-principal)
echo "User 1 Principal: $USER1_PRINCIPAL"

# User 2 - Voter Yes
echo "Creating User 2 (Voter Yes)..."
dfx identity new user2 --storage-mode=plaintext 2>/dev/null || echo "User2 already exists"
dfx identity use user2
USER2_PRINCIPAL=$(dfx identity get-principal)
echo "User 2 Principal: $USER2_PRINCIPAL"

# User 3 - Voter No
echo "Creating User 3 (Voter No)..."
dfx identity new user3 --storage-mode=plaintext 2>/dev/null || echo "User3 already exists"
dfx identity use user3
USER3_PRINCIPAL=$(dfx identity get-principal)
echo "User 3 Principal: $USER3_PRINCIPAL"

# User 4 - Voter No
echo "Creating User 4 (Voter No)..."
dfx identity new user4 --storage-mode=plaintext 2>/dev/null || echo "User4 already exists"
dfx identity use user4
USER4_PRINCIPAL=$(dfx identity get-principal)
echo "User 4 Principal: $USER4_PRINCIPAL"



# Step 2: Claim faucet untuk semua user agar punya token untuk stake
echo "Step 2: Claiming faucet for all users..."

dfx identity use user1
dfx identity get-principal
dfx canister call backend --ic claim_faucet

dfx identity use user2
dfx identity get-principal
dfx canister call backend --ic claim_faucet

dfx identity use user3
dfx identity get-principal
dfx canister call backend --ic claim_faucet

dfx identity use user4
dfx identity get-principal
dfx canister call backend --ic claim_faucet

# Step 3: User 1 membuat report
echo "Step 3: User 1 creating report..."
dfx identity use user1
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token (lebih banyak untuk memastikan cukup)
echo "Approving tokens for backend canister..."
dfx canister call fradium_ledger --ic icrc2_approve '(record { from_subaccount = null; spender = record { owner = principal "'$BACKEND_CANISTER_ID'"; subaccount = null }; amount = 1000000000; expires_at = null; fee = null; memo = null; created_at_time = null; expected_allowance = null })'
echo "Creating report..."
REPORT_RESULT=$(dfx canister call backend --ic create_report '(record { chain = "Bitcoin"; address = "mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M"; category = "scam"; description = "This is a dummy unsafe address for testing"; url = null; evidence = vec { "Evidence 1" }; stake_amount = 500000000 })')
echo "Report creation result: $REPORT_RESULT"

# Extract report ID from result - cek apakah berhasil
if echo "$REPORT_RESULT" | grep -q "Ok"; then
    REPORT_ID=$(echo "$REPORT_RESULT" | grep -o 'report_id = [0-9]*' | grep -o '[0-9]*')
    echo "Created report with ID: $REPORT_ID"
else
    echo "Error: Report creation failed. Trying to get existing report ID..."
    # Coba ambil report ID dari report yang sudah ada
    REPORT_ID=$(dfx canister call backend --ic get_reports | grep -o 'id = [0-9]*' | head -1 | grep -o '[0-9]*')
    if [ -z "$REPORT_ID" ]; then
        echo "Error: No reports found. Exiting..."
        exit 1
    fi
    echo "Using existing report ID: $REPORT_ID"
fi

# Step 4: User 2 vote YES (unsafe)
echo "Step 4: User 2 voting YES (unsafe)..."
dfx identity use user2
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
echo "Approving tokens for backend canister..."
dfx canister call fradium_ledger --ic icrc2_approve '(record { from_subaccount = null; spender = record { owner = principal "'$BACKEND_CANISTER_ID'"; subaccount = null }; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null; expected_allowance = null })'
echo "Voting YES (unsafe) on report ID: $REPORT_ID"
if [ -n "$REPORT_ID" ]; then
    dfx canister call backend --ic vote_report '(record { stake_amount = 100000000; vote_type = false; report_id = '$REPORT_ID' })'
else
    echo "Error: Report ID is empty, skipping vote"
fi

# Step 5: User 3 vote NO (safe)
echo "Step 5: User 3 voting NO (safe)..."
dfx identity use user3
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
echo "Approving tokens for backend canister..."
dfx canister call fradium_ledger --ic icrc2_approve '(record { from_subaccount = null; spender = record { owner = principal "'$BACKEND_CANISTER_ID'"; subaccount = null }; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null; expected_allowance = null })'
echo "Voting NO (safe) on report ID: $REPORT_ID"
if [ -n "$REPORT_ID" ]; then
    dfx canister call backend --ic vote_report '(record { stake_amount = 100000000; vote_type = true; report_id = '$REPORT_ID' })'
else
    echo "Error: Report ID is empty, skipping vote"
fi

# Step 6: User 4 vote NO (safe)
echo "Step 6: User 4 voting NO (safe)..."
dfx identity use user4
echo "Current user: $(dfx identity whoami)"
echo "Current principal: $(dfx identity get-principal)"
# Approve backend canister untuk transfer token
echo "Approving tokens for backend canister..."
dfx canister call fradium_ledger --ic icrc2_approve '(record { from_subaccount = null; spender = record { owner = principal "'$BACKEND_CANISTER_ID'"; subaccount = null }; amount = 100000000; expires_at = null; fee = null; memo = null; created_at_time = null; expected_allowance = null })'
echo "Voting NO (safe) on report ID: $REPORT_ID"
if [ -n "$REPORT_ID" ]; then
    dfx canister call backend --ic vote_report '(record { stake_amount = 100000000; vote_type = true; report_id = '$REPORT_ID' })'
else
    echo "Error: Report ID is empty, skipping vote"
fi

# Step 7: Ubah deadline agar report selesai dan dinyatakan unsafe
echo "Step 7: Changing deadline to make report unsafe..."
# Set deadline ke waktu yang sudah lewat (1 jam yang lalu)
echo "Changing deadline for report ID: $REPORT_ID"
if [ -n "$REPORT_ID" ]; then
    dfx canister call backend --ic admin_change_report_deadline "($REPORT_ID, 100000)"
else
    echo "Error: Report ID is empty, skipping deadline change"
fi

echo "Dummy data creation completed!"
echo "Address mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M should now be marked as unsafe"
echo ""
echo "User Principals:"
echo "User 1 (Reporter): $USER1_PRINCIPAL"
echo "User 2 (Voter Yes): $USER2_PRINCIPAL"
echo "User 3 (Voter No): $USER3_PRINCIPAL"
echo "User 4 (Voter No): $USER4_PRINCIPAL"
echo ""
echo "To test analyze_address function:"
echo "dfx canister call backend --ic analyze_address '(\"mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M\")'"

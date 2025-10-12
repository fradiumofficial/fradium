#!/usr/bin/env bash
# Check if destination address is provided
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <destination_address> [amount_in_icp]"
    echo "Example: $0 \"principal-address-here\" 0.5"
    echo "Example: $0 \"principal-address-here\" 1.25"
    exit 1
fi

DESTINATION_ADDRESS="$1"
AMOUNT_IN_ICP="${2:-0.25}"  # Default amount if not provided (0.25 ICP)

# Convert ICP amount to e8s (smallest unit)
# ICP has 8 decimal places, so multiply by 10^8
AMOUNT_E8S=$(echo "$AMOUNT_IN_ICP * 100000000" | bc)

# Remove decimal part if any (bc might return with .0)
AMOUNT_E8S=$(echo "$AMOUNT_E8S" | cut -d. -f1)

echo "Transferring ${AMOUNT_IN_ICP} ICP (${AMOUNT_E8S} e8s) to ${DESTINATION_ADDRESS}..."

# Execute icrc1_transfer
dfx canister call "${CANISTER_ID_ICP_LEDGER}" icrc1_transfer "(
    record {
        from_subaccount = null;
        to = record { owner = principal \"${DESTINATION_ADDRESS}\"; subaccount = null; };
        amount = ${AMOUNT_E8S};
        fee = null;
        memo = null;
        created_at_time = null;
    }
)"

echo "Transfer completed successfully!"
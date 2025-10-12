#!/usr/bin/env bash
# Check if destination address is provided
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <destination_address> [amount_in_cketh]"
    echo "Example: $0 \"principal-address-here\" 0.1"
    echo "Example: $0 \"principal-address-here\" 1.5"
    exit 1
fi

DESTINATION_ADDRESS="$1"
AMOUNT_IN_CKETH="${2:-0.1}"  # Default amount if not provided (0.1 ckETH)

# Convert ckETH amount to wei (smallest unit)
# ckETH has 18 decimal places, so multiply by 10^18
AMOUNT_WEI=$(echo "$AMOUNT_IN_CKETH * 1000000000000000000" | bc)

# Remove decimal part if any (bc might return with .0)
AMOUNT_WEI=$(echo "$AMOUNT_WEI" | cut -d. -f1)

echo "Transferring ${AMOUNT_IN_CKETH} ckETH (${AMOUNT_WEI} wei) to ${DESTINATION_ADDRESS}..."

# Execute icrc1_transfer
dfx canister call "${CANISTER_ID_CKETH_LEDGER}" icrc1_transfer "(
    record {
        from_subaccount = null;
        to = record { owner = principal \"${DESTINATION_ADDRESS}\"; subaccount = null; };
        amount = ${AMOUNT_WEI};
        fee = null;
        memo = null;
        created_at_time = null;
    }
)"

echo "Transfer completed successfully!"

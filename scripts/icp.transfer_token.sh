#!/usr/bin/env bash
# Check if destination address is provided
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <destination_address> [amount]"
    echo "Example: $0 \"principal-address-here\" 1000000"
    exit 1
fi

DESTINATION_ADDRESS="$1"
AMOUNT="${2:-25000000}"  # Default amount if not provided

echo "Transferring ${AMOUNT} tokens to ${DESTINATION_ADDRESS}..."

# Execute icrc1_transfer
dfx canister call "${CANISTER_ID_ICP_LEDGER}" icrc1_transfer "(
    record {
        from_subaccount = null;
        to = record { owner = principal \"${DESTINATION_ADDRESS}\"; subaccount = null; };
        amount = ${AMOUNT};
        fee = null;
        memo = null;
        created_at_time = null;
    }
)"

echo "Transfer completed successfully!"
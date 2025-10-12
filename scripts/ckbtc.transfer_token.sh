#!/usr/bin/env bash
# Check if destination address is provided
if [ -z "${1:-}" ]; then
    echo "Usage: $0 <destination_address> [amount_in_ckbtc]"
    echo "Example: $0 \"principal-address-here\" 0.001"
    echo "Example: $0 \"principal-address-here\" 0.01"
    exit 1
fi

DESTINATION_ADDRESS="$1"
AMOUNT_IN_CKBTC="${2:-0.001}"  # Default amount if not provided (0.001 ckBTC)

# Convert ckBTC amount to satoshis (smallest unit)
# ckBTC has 8 decimal places, so multiply by 10^8
AMOUNT_SATOSHIS=$(echo "$AMOUNT_IN_CKBTC * 100000000" | bc)

# Remove decimal part if any (bc might return with .0)
AMOUNT_SATOSHIS=$(echo "$AMOUNT_SATOSHIS" | cut -d. -f1)

echo "Transferring ${AMOUNT_IN_CKBTC} ckBTC (${AMOUNT_SATOSHIS} satoshis) to ${DESTINATION_ADDRESS}..."

# Execute icrc1_transfer
dfx canister call "${CANISTER_ID_CKBTC_LEDGER}" icrc1_transfer "(
    record {
        from_subaccount = null;
        to = record { owner = principal \"${DESTINATION_ADDRESS}\"; subaccount = null; };
        amount = ${AMOUNT_SATOSHIS};
        fee = null;
        memo = null;
        created_at_time = null;
    }
)"

echo "Transfer completed successfully!"

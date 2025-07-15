#!/bin/bash

# Check if BTC address is provided as argument
if [ $# -eq 0 ]; then
    echo "Error: BTC address is required"
    echo "Usage: $0 <btc-address> <mining-block>"
    echo "Example: $0 bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh 101"
    exit 1
fi

# Check if Mining Block is provided as argument
if [ $# -eq 1 ]; then
    echo "Error: Mining Block is required"
    echo "Usage: $0 <btc-address> <mining-block>"
    echo "Example: $0 bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh 101"
    exit 1
fi

# Get BTC address from first argument
BTC_ADDRESS="$1"
MINING_BLOCK="$2"

echo "Generating $MINING_BLOCK blocks to address: $BTC_ADDRESS"
echo "This will take a few moments..."

# Execute the bitcoin-cli command with the provided address
bitcoin-cli -conf=$(pwd)/bitcoin.conf generatetoaddress "$MINING_BLOCK" "$BTC_ADDRESS"

if [ $? -eq 0 ]; then
    echo "Successfully generated $MINING_BLOCK blocks to address: $BTC_ADDRESS"
else
    echo "Error: Failed to generate blocks"
    exit 1
fi
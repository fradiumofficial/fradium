#!/bin/bash

# Script untuk check cycles balance semua canister di IC network
# Usage: ./scripts/check.all_canister_cycles.sh

echo "=========================================="
echo "🔍 FRADIUM CANISTER CYCLES CHECKER"
echo "=========================================="

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to format cycles (convert to T, B, M)
format_cycles() {
    local cycles=$1
    if [ $cycles -gt 1000000000000 ]; then
        echo "$(echo "scale=2; $cycles/1000000000000" | bc)T"
    elif [ $cycles -gt 1000000000 ]; then
        echo "$(echo "scale=2; $cycles/1000000000" | bc)B"
    elif [ $cycles -gt 1000000 ]; then
        echo "$(echo "scale=2; $cycles/1000000" | bc)M"
    else
        echo "${cycles}"
    fi
}

# Check wallet balance first
echo -e "${BLUE}📊 Wallet Balance:${NC}"
wallet_balance=$(dfx wallet --ic balance 2>/dev/null | grep -o '[0-9,]*' | tr -d ',')
if [ ! -z "$wallet_balance" ]; then
    formatted_wallet=$(format_cycles $wallet_balance)
    echo -e "   💰 ${GREEN}${formatted_wallet} cycles${NC}"
else
    echo -e "   ${RED}❌ Could not fetch wallet balance${NC}"
fi

echo ""
echo -e "${BLUE}🏭 Canister Balances:${NC}"

# Array of canisters to check
canisters=("backend" "token" "bitcoin" "ransomware_detector" "chatbot" "frontend")

for canister in "${canisters[@]}"; do
    echo -n "   📦 ${canister}: "
    
    # Get canister status and extract cycles
    status_output=$(dfx canister --ic status $canister 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Extract cycles from status output
        cycles=$(echo "$status_output" | grep -i "balance" | grep -o '[0-9,_]*' | tr -d ',_' | head -1)
        
        if [ ! -z "$cycles" ] && [ "$cycles" -gt 0 ]; then
            formatted_cycles=$(format_cycles $cycles)
            
            # Color coding based on cycles amount
            if [ $cycles -gt 1000000000000 ]; then
                echo -e "${GREEN}${formatted_cycles} cycles ✅${NC}"
            elif [ $cycles -gt 100000000000 ]; then
                echo -e "${YELLOW}${formatted_cycles} cycles ⚠️${NC}"
            else
                echo -e "${RED}${formatted_cycles} cycles ⚠️ LOW${NC}"
            fi
        else
            echo -e "${RED}❌ No cycles info${NC}"
        fi
    else
        echo -e "${RED}❌ Canister not found/accessible${NC}"
    fi
done

echo ""
echo "=========================================="
echo -e "${BLUE}💡 Legend:${NC}"
echo -e "   ${GREEN}✅ > 1T cycles (Healthy)${NC}"
echo -e "   ${YELLOW}⚠️  100B-1T cycles (Warning)${NC}"  
echo -e "   ${RED}⚠️  < 100B cycles (Low - Need top up)${NC}"
echo "=========================================="

# Check if bc is available (for calculations)
if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}Note: Install 'bc' for better cycle formatting${NC}"
fi 
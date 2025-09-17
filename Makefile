# Load all env vars
ifneq (,$(wildcard .env))
    include .env
    export $(shell sed -nE "s/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p" .env)
endif

define strip_quotes
$(subst ',,$(subst ",,$(1)))
endef

$(foreach v,$(shell sed -nE "s/^([A-Za-z_][A-Za-z0-9_]*)=.*/\1/p" .env),\
  $(eval $(v) := $(call strip_quotes,$($(v)))))

BITCOIND=$(shell command -v bitcoind || command -v bitcoin-core.daemon)

bitcoin-start:
	$(BITCOIND) -conf="$(CURDIR)/bitcoin.conf" -datadir="$(CURDIR)/bitcoin_data" --port=18444

bitcoin-mining:
	chmod +x "$(CURDIR)/scripts/bitcoin.mining_block.sh"
	"$(CURDIR)/scripts/bitcoin.mining_block.sh" $(address) $(block)

bitcoin-balance:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" getbalance

# Pakai scantxoutset untuk balance address spesifik
bitcoin-balanceof:
	@if [ -z "$(address)" ]; then \
		echo "Usage: make bitcoin-balanceof address=<btc_address>"; exit 1; \
	fi
	@echo "Checking balance for: $(address)"
	@bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" scantxoutset start "[\"addr($(address))\"]" 2>/dev/null | \
	{ command -v jq >/dev/null 2>&1 && jq -r '.total_amount' || python3 -c "import sys, json; j=json.load(sys.stdin); print(j.get('total_amount',0))"; }

bitcoin-newwallet:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" -named createwallet wallet_name="fradium" load_on_startup=true

bitcoin-utxo:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" listunspent

bitcoin-newaddress:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" getnewaddress "fradium"

bitcoin-getaddress:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" getaddressesbylabel "fradium"

bitcoin-send:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" sendtoaddress $(address) $(amount)
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" generatetoaddress 1 mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M

bitcoin-mine:
	bitcoin-cli -conf="$(CURDIR)/bitcoin.conf" generatetoaddress 1 mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M

icp-transfer:
	chmod +x "$(CURDIR)/scripts/icp.transfer_token.sh"
	"$(CURDIR)/scripts/icp.transfer_token.sh" $(address) $(amount)

icp-balance:
	chmod +x "$(CURDIR)/scripts/icp.check_balance.sh"
	"$(CURDIR)/scripts/icp.check_balance.sh"

fradium-transfer:
	chmod +x "$(CURDIR)/scripts/fradium.transfer_token.sh"
	"$(CURDIR)/scripts/fradium.transfer_token.sh" $(address) $(amount)

fradium-balance:
	chmod +x "$(CURDIR)/scripts/fradium.check_balance.sh"
	"$(CURDIR)/scripts/fradium.check_balance.sh"

ckbtc-transfer:
	chmod +x "$(CURDIR)/scripts/ckbtc.transfer_token.sh"
	"$(CURDIR)/scripts/ckbtc.transfer_token.sh" $(address) $(amount)

ckbtc-balance:
	chmod +x "$(CURDIR)/scripts/ckbtc.check_balance.sh"
	"$(CURDIR)/scripts/ckbtc.check_balance.sh"

ckbtc-kyt:
	dfx canister call ckbtc_kyt set_api_key '(record { api_key = "" })'

kill-port:
	@echo "Killing process on port 4943..."
	@PID=$$(lsof -t -i :4943); \
	if [ -n "$$PID" ]; then \
		kill -9 $$PID && echo "Port 4943 has been freed (PID $$PID killed)."; \
	else \
		echo "No process found on port 4943."; \
	fi
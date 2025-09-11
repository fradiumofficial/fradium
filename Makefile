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

deploy-backend:
	dfx deploy backend

deploy-token:
	chmod +x "$(CURDIR)/scripts/deploy.fradium_token.sh"
	"$(CURDIR)/scripts/deploy.fradium_token.sh"

deploy-ai:
	cargo build --release --target wasm32-unknown-unknown --package ransomware_detector
	candid-extractor "target/wasm32-unknown-unknown/release/ransomware_detector.wasm" > "src/ai/detector_service/src/ransomware_detector.did"

deploy-solana:
	cd "src/solana" && ./build.sh
	candid-extractor "target/wasm32-unknown-unknown/release/solana.wasm" > "src/solana/solana.did"

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
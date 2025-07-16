bitcoin-start:
	bitcoind -conf=$(CURDIR)/bitcoin.conf -datadir=$(CURDIR)/bitcoin_data --port=18444

bitcoin-mining:
	chmod +x $(CURDIR)/scripts/bitcoin.mining_block.sh
	$(CURDIR)/scripts/bitcoin.mining_block.sh $(address) $(block)

bitcoin-balance:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf getbalance

bitcoin-newwallet:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf -named createwallet wallet_name="fradium" load_on_startup=true

bitcoin-utxo:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf listunspent

bitcoin-newaddress:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf getnewaddress "fradium"

bitcoin-getaddress:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf getaddressesbylabel "fradium"

bitcoin-send:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf sendtoaddress $(address) $(amount)

bitcoin-mint:
	bitcoin-cli -conf=$(CURDIR)/bitcoin.conf generatetoaddress 1 mtbZzVBwLnDmhH4pE9QynWAgh6H3aC1E6M

build-token:
	chmod +x $(CURDIR)/scripts/build.fradium_token.sh
	$(CURDIR)/scripts/build.fradium_token.sh

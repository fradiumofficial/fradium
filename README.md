<!-- Get balance -->

bitcoin-cli -conf=$(pwd)/bitcoin.conf getbalance

<!-- Check UTXO -->

bitcoin-cli -conf=$(pwd)/bitcoin.conf listunspent

<!-- Create balance -->

bitcoin-cli -conf=$(pwd)/bitcoin.conf getnewaddress

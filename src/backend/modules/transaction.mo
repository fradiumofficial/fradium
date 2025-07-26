import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Int "mo:base/Int";
import BitcoinCanister "canister:bitcoin";
import Types "../types";

module {
    public class TransactionModule(
        transactionHistoryStore: Map.HashMap<Principal, [Types.TransactionEntry]>,
        userWalletsStore: Map.HashMap<Principal, Types.UserWallet>
    ) {
        public func createTransactionHistory(caller: Principal, params: Types.CreateTransactionHistoryParams) : Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Create new transaction entry
            let newTransaction : Types.TransactionEntry = {
                chain = params.chain;
                direction = params.direction;
                amount = params.amount;
                timestamp = params.timestamp;
                details = params.details;
                note = params.note;
                status = #Pending;
            };

            // Get existing transaction history for the user
            let existingHistory = switch (transactionHistoryStore.get(caller)) {
                case (?history) { history };
                case null { [] };
            };

            // Add new transaction to history
            let updatedHistory = Array.append(existingHistory, [newTransaction]);
            transactionHistoryStore.put(caller, updatedHistory);

            return #Ok("Transaction history created successfully");
        };

        public func getTransactionHistory(caller: Principal) : async Types.Result<[Types.TransactionEntry], Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Get user's existing transaction history
            let existingHistory = switch (transactionHistoryStore.get(caller)) {
                case (?history) { history };
                case null { [] };
            };
            
            var updatedHistory = existingHistory;
            
            // Always get Bitcoin address and check UTXOs
            switch (userWalletsStore.get(caller)) {
                case (?wallet) {
                    var bitcoinAddress : ?Text = null;
                    
                    // Find Bitcoin address from user's wallet
                    for (addr in wallet.addresses.vals()) {
                        switch (addr.network, addr.token_type) {
                            case (#Bitcoin, #Bitcoin) {
                                bitcoinAddress := ?addr.address;
                            };
                            case _ { };
                        };
                    };
                    
                    // If we found a Bitcoin address, always check UTXOs
                    switch (bitcoinAddress) {
                        case (?btcAddr) {
                            let allUtxos = await BitcoinCanister.get_all_utxos(btcAddr);
                            
                            // Process each UTXO
                            for (utxo in allUtxos.vals()) {
                                // Check if this UTXO transaction already exists in history
                                var existsInHistory = false;
                                var needsStatusUpdate = false;
                                
                                for (tx in updatedHistory.vals()) {
                                    switch (tx.details) {
                                        case (#Bitcoin(btcDetails)) {
                                            if (btcDetails.txid == utxo.txidHex) {
                                                existsInHistory := true;
                                                if (tx.status == #Pending) {
                                                    needsStatusUpdate := true;
                                                };
                                            };
                                        };
                                        case _ { };
                                    };
                                };
                                
                                if (not existsInHistory) {
                                    // Create new Receive transaction for this UTXO
                                    let newTransaction : Types.TransactionEntry = {
                                        chain = #Bitcoin;
                                        direction = #Receive;
                                        amount = Nat64.toNat(utxo.value);
                                        timestamp = Nat64.fromNat(Int.abs(Time.now()));
                                        details = #Bitcoin({
                                            txid = utxo.txidHex;
                                            from_address = null;
                                            to_address = btcAddr;
                                            fee_satoshi = null;
                                            block_height = ?Nat32.toNat(utxo.height);
                                        });
                                        note = ?"Received Bitcoin";
                                        status = #Success;
                                    };
                                    
                                    updatedHistory := Array.append(updatedHistory, [newTransaction]);
                                } else if (needsStatusUpdate) {
                                    // Update pending transaction status to Success
                                    updatedHistory := Array.map<Types.TransactionEntry, Types.TransactionEntry>(updatedHistory, func (tx: Types.TransactionEntry) : Types.TransactionEntry {
                                        switch (tx.details) {
                                            case (#Bitcoin(btcDetails)) {
                                                if (btcDetails.txid == utxo.txidHex and tx.status == #Pending) {
                                                    {
                                                        chain = tx.chain;
                                                        direction = tx.direction;
                                                        amount = tx.amount;
                                                        timestamp = tx.timestamp;
                                                        details = tx.details;
                                                        note = tx.note;
                                                        status = #Success;
                                                    }
                                                } else {
                                                    tx
                                                };
                                            };
                                            case _ { tx };
                                        };
                                    });
                                };
                            };
                            
                            // Save updated history back to store
                            transactionHistoryStore.put(caller, updatedHistory);
                        };
                        case null { };
                    };
                };
                case null { };
            };
            
            return #Ok(updatedHistory);
        };

        public func getTransactionHistoryStore() : Map.HashMap<Principal, [Types.TransactionEntry]> {
            transactionHistoryStore
        };
    };
}; 
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Nat "mo:base/Nat";
import Types "../types";

module {
    public class WalletModule(userWalletsStore: Map.HashMap<Principal, Types.UserWallet>) {
        public func createWallet(caller: Principal, params: Types.CreateWalletParams) : Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Check if user already has a wallet
            switch (userWalletsStore.get(caller)) {
                case (?_) {
                    return #Err("You already have a wallet created");
                };
                case null { };
            };

            // Create new wallet
            let newWallet : Types.UserWallet = {
                principal = caller;
                addresses = params.addresses;
                created_at = Time.now();
            };

            // Store the wallet
            userWalletsStore.put(caller, newWallet);

            return #Ok("Wallet created successfully with " # Nat.toText(params.addresses.size()) # " addresses");
        };

        public func getWallet(caller: Principal) : Types.Result<Types.UserWallet, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Get user's wallet
            switch (userWalletsStore.get(caller)) {
                case (?wallet) {
                    return #Ok(wallet);
                };
                case null {
                    return #Err("Wallet not found. Please create a wallet first.");
                };
            };
        };

        public func getUserWalletsStore() : Map.HashMap<Principal, Types.UserWallet> {
            userWalletsStore
        };
    };
}; 
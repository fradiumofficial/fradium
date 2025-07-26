import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import TokenCanister "canister:token";
import Types "../types";

module {
    public class FaucetModule(faucetClaimsStore: Map.HashMap<Principal, Time.Time>) {
        // Faucet claim cooldown in nanoseconds (48 hours = 48 * 60 * 60 * 1_000_000_000)
        private let FAUCET_COOLDOWN_DURATION : Time.Time = 172_800_000_000_000;

        public func claimFaucet(caller: Principal) : async Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Check if user has claimed recently
            let currentTime = Time.now();
            switch (faucetClaimsStore.get(caller)) {
                case (?lastClaimTime) {
                    let timeSinceLastClaim = currentTime - lastClaimTime;
                    if (timeSinceLastClaim < FAUCET_COOLDOWN_DURATION) {
                        return #Err("You can only claim faucet once every 48 hours. Please try again later.");
                    };
                };
                case null { /* First time claiming, proceed */ };
            };

            let transferArgs = {
                from_subaccount = null;
                to = { owner = caller; subaccount = null };
                amount = 10 * (10 ** Nat8.toNat(await TokenCanister.get_decimals()));
                fee = null;
                memo = ?Text.encodeUtf8("Faucet Claim");
                created_at_time = null;
            };

            let transferResult = await TokenCanister.icrc1_transfer(transferArgs);
            switch (transferResult) {
                case (#Err(err)) {
                    return #Err("Failed to transfer tokens: " # debug_show(err));
                };
                case (#Ok(_)) {
                    // Record the claim time
                    faucetClaimsStore.put(caller, currentTime);
                    return #Ok("Tokens transferred successfully");
                };
            };
        };

        public func checkFaucetClaim(caller: Principal) : async Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            switch (faucetClaimsStore.get(caller)) {
                case (?lastClaimTime) {
                    let currentTime = Time.now();
                    let timeSinceLastClaim = currentTime - lastClaimTime;
                    let canClaim = timeSinceLastClaim >= FAUCET_COOLDOWN_DURATION;
                    
                    if (canClaim) {
                        return #Ok("You can claim faucet now");
                    } else {
                        let remainingTime = FAUCET_COOLDOWN_DURATION - timeSinceLastClaim;
                        let remainingHours = remainingTime / 3_600_000_000_000; // Convert to hours
                        let remainingMinutes = (remainingTime % 3_600_000_000_000) / 60_000_000_000; // Convert to minutes
                        
                        if (remainingHours > 0 and remainingMinutes > 0) {
                            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
                        } else if (remainingHours > 0) {
                            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours");
                        } else {
                            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
                        };
                    };
                };
                case null {
                    return #Ok("You can claim faucet now");
                };
            };
        };

        public func getFaucetClaimsStore() : Map.HashMap<Principal, Time.Time> {
            faucetClaimsStore
        };
    };
}; 
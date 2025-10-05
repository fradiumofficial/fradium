import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";

import ParentTypes "../../types";

module {
  public type TokenCanisterInterface = actor { 
    icrc1_decimals : shared query () -> async Nat8;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
  };

  type TransferArg = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from_subaccount : ?Blob;
    memo : ?Blob;
    to : { owner : Principal; subaccount : ?Blob };
  };

  type TransferResult = {
    #Err : {
      #BadBurn : { min_burn_amount : Nat };
      #BadFee : { expected_fee : Nat };
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #GenericError : { error_code : Nat; message : Text };
      #InsufficientFunds : { balance : Nat };
      #TemporarilyUnavailable;
      #TooOld
    };
    #Ok : Nat;
  };

  public class FaucetModule(tokenCanister : TokenCanisterInterface) {
    // Constants
    private let FAUCET_COOLDOWN_DURATION : Time.Time = 172_800_000_000_000;
    
    // Storage
    private var faucetClaimsStorage : [(Principal, Time.Time)] = [];
    private var faucetClaimsStore = Map.HashMap<Principal, Time.Time>(0, Principal.equal, Principal.hash);

    // System hooks
    public func preupgrade() {
      faucetClaimsStorage := Iter.toArray(faucetClaimsStore.entries());
    };

    public func postupgrade() {
      faucetClaimsStore := Map.HashMap<Principal, Time.Time>(faucetClaimsStorage.size(), Principal.equal, Principal.hash);
      for ((key, value) in faucetClaimsStorage.vals()) {
        faucetClaimsStore.put(key, value);
      };
    };

    // Public functions
    public func claim_faucet(caller : Principal) : async ParentTypes.Result<Text, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      let currentTime = Time.now();
      switch (faucetClaimsStore.get(caller)) {
        case (?lastClaimTime) {
          let timeSinceLastClaim = currentTime - lastClaimTime;
          if (timeSinceLastClaim < FAUCET_COOLDOWN_DURATION) {
            return #Err("You can only claim faucet once every 48 hours. Please try again later.");
          };
        };
        case null { };
      };

      let transferArgs : TransferArg = {
        from_subaccount = null;
        to = { owner = caller; subaccount = null };
        amount = 10 * (10 ** Nat8.toNat(await tokenCanister.icrc1_decimals()));
        fee = null;
        memo = ?Text.encodeUtf8("Faucet Claim");
        created_at_time = null;
      };

      let transferResult = await tokenCanister.icrc1_transfer(transferArgs);
      switch (transferResult) {
        case (#Err(err)) {
          return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) {
          faucetClaimsStore.put(caller, currentTime);
          return #Ok("Tokens transferred successfully");
        };
      };
    };

    public func check_faucet_claim(caller : Principal) : ParentTypes.Result<Text, Text> {
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
            let remainingHours = remainingTime / 3_600_000_000_000;
            let remainingMinutes = (remainingTime % 3_600_000_000_000) / 60_000_000_000;
            
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

    // Getter/setter for storage
    public func set_faucet_claims_storage(storage : [(Principal, Time.Time)]) {
      faucetClaimsStorage := storage;
    };

    public func get_faucet_claims_storage() : [(Principal, Time.Time)] {
      return faucetClaimsStorage;
    };
  };
};

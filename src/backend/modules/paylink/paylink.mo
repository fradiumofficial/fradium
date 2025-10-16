import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Nat "mo:base/Nat";
import Nat32 "mo:base/Nat32";
import Nat64 "mo:base/Nat64";
import Random "mo:base/Random";

import Types "types";
import SharedTypes "../../types";

module {
  public type Result<T, E> = SharedTypes.Result<T, E>;

  // Token Canister Interfaces
  public type TransferFromError = {
    #BadBurn : { min_burn_amount : Nat };
    #BadFee : { expected_fee : Nat };
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #GenericError : { error_code : Nat; message : Text };
    #InsufficientAllowance : { allowance : Nat };
    #InsufficientFunds : { balance : Nat };
    #TemporarilyUnavailable;
    #TooOld;
  };

  public type TransferFromResult = {
    #Err : TransferFromError;
    #Ok : Nat;
  };

  public type TransferFromArgs = {
    spender_subaccount : ?Blob;
    from : { owner : Principal; subaccount : ?Blob };
    to : { owner : Principal; subaccount : ?Blob };
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  public type TokenCanisterInterface = actor {
    icrc2_transfer_from : shared TransferFromArgs -> async TransferFromResult;
  };
  
  // Generic factory to create an actor for arbitrary ICRC/SNS ledger canister
  // Note: This requires dynamic actor creation via Principal, provided by caller of class
  public type LedgerFactory = (Principal) -> TokenCanisterInterface;

  public type WalletInterface = actor {
    wallet_addresses : shared () -> async {
      bitcoin: Text;
      ethereum: Text;
      solana: Text;
    };
  };

  public class PaylinkModule(
    canisterPrincipal: Principal,
    icpLedger: TokenCanisterInterface,
    fradiumLedger: TokenCanisterInterface,
    ckBTCLedger: TokenCanisterInterface,
    ckETHLedger: TokenCanisterInterface,
    wallet: WalletInterface,
    createLedgerActor: LedgerFactory
  ) {
    private let MAX_LINKS_PER_HOUR : Nat = 10;
    private let MIN_DURATION : Nat = 300_000_000_000; // 5 minutes
    private let MAX_DURATION : Nat = 2_592_000_000_000_000; // 30 days

    // Stable storage
    private var paymentLinksStorage : [(Text, Types.PaymentLink)] = [];
    private var linkCreationTimesStorage : [(Principal, [Time.Time])] = [];

    // Transient stores
    private var paymentLinksStore = Map.HashMap<Text, Types.PaymentLink>(0, Text.equal, Text.hash);
    private var linkCreationTimesStore = Map.HashMap<Principal, [Time.Time]>(0, Principal.equal, Principal.hash);

    // ===== HELPER FUNCTIONS =====
    private func transferFromErrorToText(err: TransferFromError) : Text {
      switch (err) {
        case (#BadFee { expected_fee }) { "Bad fee. Expected: " # Nat.toText(expected_fee) };
        case (#InsufficientFunds { balance }) { "Insufficient funds. Balance: " # Nat.toText(balance) };
        case (#InsufficientAllowance { allowance }) { "Insufficient allowance. Current: " # Nat.toText(allowance) };
        case (#TooOld) { "Transaction too old" };
        case (#CreatedInFuture(details)) { "Transaction created in future" };
        case (#Duplicate { duplicate_of }) { "Duplicate transaction: " # Nat.toText(duplicate_of) };
        case (#TemporarilyUnavailable) { "Service temporarily unavailable" };
        case (#GenericError { message; error_code }) { message };
        case (#BadBurn(details)) { "Bad burn amount" };
      };
    };

    // ===== UPGRADE HOOKS =====
    public func preupgrade() {
      paymentLinksStorage := Iter.toArray(paymentLinksStore.entries());
      linkCreationTimesStorage := Iter.toArray(linkCreationTimesStore.entries());
    };

    public func postupgrade() {
      paymentLinksStore := Map.HashMap<Text, Types.PaymentLink>(
        paymentLinksStorage.size(), 
        Text.equal, 
        Text.hash
      );
      for ((key, value) in paymentLinksStorage.vals()) {
        paymentLinksStore.put(key, value);
      };

      linkCreationTimesStore := Map.HashMap<Principal, [Time.Time]>(
        linkCreationTimesStorage.size(), 
        Principal.equal, 
        Principal.hash
      );
      for ((key, value) in linkCreationTimesStorage.vals()) {
        linkCreationTimesStore.put(key, value);
      };
    };

    // ===== HELPER FUNCTIONS =====
    private func generate_link_id(caller: Principal, timestamp: Time.Time) : async Text {
      let entropy = await Random.blob();
      let callerText = Principal.toText(caller);
      let timeText = Int.toText(timestamp);
      
      let combined = callerText # timeText # debug_show(entropy);
      let hash = Nat32.toNat(Text.hash(combined));
      
      let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let charsArray = Iter.toArray(chars.chars());
      var result = "";
      var num = hash;
      
      for (i in Iter.range(0, 15)) {
        let index = num % 62;
        result := result # Text.fromChar(charsArray[index]);
        num := num / 62;
      };
      
      result # "_" # Int.toText(timestamp % 100000);
    };

    private func is_valid_custom_id(id: Text) : Bool {
      let charArray = Iter.toArray(id.chars());
      
      if (charArray.size() < 8 or charArray.size() > 32) {
        return false;
      };
      
      for (c in charArray.vals()) {
        let isValid = (c >= 'a' and c <= 'z') or 
                      (c >= 'A' and c <= 'Z') or 
                      (c >= '0' and c <= '9') or 
                      c == '-' or c == '_';
        if (not isValid) {
          return false;
        };
      };
      
      return true;
    };

    private func check_rate_limit(caller: Principal) : Bool {
      let currentTime = Time.now();
      let oneHourAgo = currentTime - 3_600_000_000_000;
      
      switch (linkCreationTimesStore.get(caller)) {
        case (?times) {
          let recentTimes = Array.filter(times, func(t: Time.Time) : Bool {
            t > oneHourAgo
          });
          
          linkCreationTimesStore.put(caller, recentTimes);
          return recentTimes.size() < MAX_LINKS_PER_HOUR;
        };
        case null {
          return true;
        };
      };
    };

    private func record_link_creation(caller: Principal, timestamp: Time.Time) {
      let existingTimes = switch (linkCreationTimesStore.get(caller)) {
        case (?times) { times };
        case null { [] };
      };
      
      let updatedTimes = Array.append(existingTimes, [timestamp]);
      linkCreationTimesStore.put(caller, updatedTimes);
    };

    // ===== PUBLIC FUNCTIONS =====
    public func create_payment_link(
      caller: Principal,
      params: Types.CreatePaymentLinkParams
    ) : async Result<Text, Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users cannot create payment links.");
      };

      if (params.amount == 0) {
        return #Err("Amount must be greater than 0");
      };

      if (params.duration_nanos < MIN_DURATION or params.duration_nanos > MAX_DURATION) {
        return #Err("Duration must be between 5 minutes and 30 days");
      };

      if (not check_rate_limit(caller)) {
        return #Err("Rate limit exceeded. You can only create " # Nat.toText(MAX_LINKS_PER_HOUR) # " payment links per hour.");
      };

      let now = Time.now();
      
      let linkId = switch (params.custom_id) {
        case (?id) {
          if (not is_valid_custom_id(id)) {
            return #Err("Invalid custom ID. Must be 8-32 characters, alphanumeric with dashes/underscores only.");
          };
          
          switch (paymentLinksStore.get(id)) {
            case (?_) {
              return #Err("This custom ID is already in use. Please choose a different one.");
            };
            case null { id };
          };
        };
        case null {
          await generate_link_id(caller, now);
        };
      };

      // Fetch creator's wallet addresses only for native tokens
      var creatorAddresses : ?Types.CreatorAddresses = null;
      switch (params.token) {
        case (#BTC or #ETH or #SOL) {
          try {
            let addresses = await wallet.wallet_addresses();
            creatorAddresses := ?{
              bitcoin = addresses.bitcoin;
              ethereum = addresses.ethereum;
              solana = addresses.solana;
            };
          } catch (err) {
            return #Err("Failed to fetch wallet addresses");
          };
        };
        case _ { }; // ICRC tokens don't need wallet addresses
      };

      let new_link: Types.PaymentLink = {
        id = linkId;
        creator = caller;
        payer = null;
        amount = params.amount;
        token = params.token;
        status = #Active;
        created_at = now;
        expires_at = now + params.duration_nanos;
        creator_addresses = creatorAddresses;
      };

      paymentLinksStore.put(linkId, new_link);
      record_link_creation(caller, now);

      return #Ok(linkId);
    };

    public func get_my_payment_links(caller: Principal) : Result<[Types.PaymentLink], Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      var userLinks : [Types.PaymentLink] = [];
      let now = Time.now();
      
      for ((id, link) in paymentLinksStore.entries()) {
        if (link.creator == caller) {
          let finalLink = if (link.status == #Active and now > link.expires_at) {
            {
              id = link.id;
              creator = link.creator;
              payer = link.payer;
              amount = link.amount;
              token = link.token;
              status = #Expired;
              created_at = link.created_at;
              expires_at = link.expires_at;
              creator_addresses = link.creator_addresses;
            }
          } else {
            link
          };
          
          userLinks := Array.append(userLinks, [finalLink]);
        };
      };
      
      return #Ok(userLinks);
    };

    public func get_payment_link_details(id: Text) : Result<Types.PaymentLinkPublic, Text> {
      switch (paymentLinksStore.get(id)) {
        case (null) { return #Err("Payment link not found."); };
        case (?link) {
          let now = Time.now();
          let finalStatus = if (link.status == #Active and now > link.expires_at) {
            #Expired
          } else {
            link.status
          };
          
          return #Ok({
            creator = link.creator;
            creator_addresses = link.creator_addresses;
            amount = link.amount;
            token = link.token;
            status = finalStatus;
            created_at = link.created_at;
            expires_at = link.expires_at;
          });
        };
      };
    };

    public func cancel_payment_link(caller: Principal, link_id: Text) : Result<Text, Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      let link = switch(paymentLinksStore.get(link_id)) {
        case (null) { return #Err("Payment link not found."); };
        case (?l) { l };
      };

      if (link.creator != caller) {
        return #Err("Only the creator can cancel this payment link.");
      };

      if (link.status != #Active) {
        return #Err("This link cannot be cancelled. Current status: " # debug_show(link.status));
      };

      let updated_link : Types.PaymentLink = {
        id = link.id;
        creator = link.creator;
        payer = link.payer;
        amount = link.amount;
        token = link.token;
        status = #Cancelled;
        created_at = link.created_at;
        expires_at = link.expires_at;
        creator_addresses = link.creator_addresses;
      };
      
      paymentLinksStore.put(link.id, updated_link);
      return #Ok("Payment link cancelled successfully.");
    };

    public func execute_payment_icrc(caller: Principal, link_id: Text) : async Result<Text, Text> {
      let payer = caller;
      
      if (Principal.isAnonymous(payer)) {
        return #Err("Anonymous users cannot make payments.");
      };
      
      let link = switch(paymentLinksStore.get(link_id)) {
        case (null) { return #Err("Payment link not found."); };
        case (?l) { l };
      };

      if (link.status != #Active) { 
        return #Err("This link is no longer active. Status: " # debug_show(link.status)); 
      };
      
      if (Time.now() > link.expires_at) { 
        let expired_link : Types.PaymentLink = {
          id = link.id;
          creator = link.creator;
          payer = link.payer;
          amount = link.amount;
          token = link.token;
          status = #Expired;
          created_at = link.created_at;
          expires_at = link.expires_at;
          creator_addresses = link.creator_addresses;
        };
        paymentLinksStore.put(link.id, expired_link);
        return #Err("This link has expired."); 
      };
      
      if (payer == link.creator) { 
        return #Err("You cannot pay your own payment link."); 
      };

      let transferArgs = {
        spender_subaccount = null;
        from = { owner = payer; subaccount = null };
        to = { owner = link.creator; subaccount = null };
        amount = link.amount;
        fee = null;
        memo = ?Text.encodeUtf8("Payment: " # link_id);
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
      };

      let transferResult = switch (link.token) {
        case (#ICP) { await icpLedger.icrc2_transfer_from(transferArgs) };
        case (#Fradium) { await fradiumLedger.icrc2_transfer_from(transferArgs) };
        case (#ckBTC) { await ckBTCLedger.icrc2_transfer_from(transferArgs) };
        case (#ckETH) { await ckETHLedger.icrc2_transfer_from(transferArgs) };
        case (#SNS(ledgerPrin)) {
          let ledger = createLedgerActor(ledgerPrin);
          await ledger.icrc2_transfer_from(transferArgs)
        };
        case _ { return #Err("Invalid token type for ICRC payment") };
      };

      switch (transferResult) {
        case (#Ok(blockIndex)) {
          let updated_link : Types.PaymentLink = {
            id = link.id;
            creator = link.creator;
            payer = ?payer;
            amount = link.amount;
            token = link.token;
            status = #Completed;
            created_at = link.created_at;
            expires_at = link.expires_at;
            creator_addresses = link.creator_addresses;
          };
          paymentLinksStore.put(link.id, updated_link);
          return #Ok("Payment successful! Block: " # Nat.toText(blockIndex));
        };
        case (#Err(err)) {
          return #Err("Payment failed: " # transferFromErrorToText(err));
        };
      };
    };

    public func record_native_payment(
      caller: Principal,
      link_id: Text,
      tx_hash: Text
    ) : Result<Text, Text> {
      let payer = caller;
      
      if (Principal.isAnonymous(payer)) {
        return #Err("Anonymous users cannot make payments.");
      };
      
      let link = switch(paymentLinksStore.get(link_id)) {
        case (null) { return #Err("Payment link not found."); };
        case (?l) { l };
      };

      if (link.status != #Active) { 
        return #Err("This link is no longer active."); 
      };
      
      if (Time.now() > link.expires_at) { 
        return #Err("This link has expired."); 
      };
      
      if (payer == link.creator) { 
        return #Err("You cannot pay your own payment link."); 
      };

      if (Text.size(tx_hash) < 10) {
        return #Err("Invalid transaction hash");
      };

      switch (link.token) {
        case (#BTC or #ETH or #SOL) {
          let updated_link : Types.PaymentLink = {
            id = link.id;
            creator = link.creator;
            payer = ?payer;
            amount = link.amount;
            token = link.token;
            status = #Completed;
            created_at = link.created_at;
            expires_at = link.expires_at;
            creator_addresses = link.creator_addresses;
          };
          paymentLinksStore.put(link.id, updated_link);
          return #Ok("Native payment recorded: " # tx_hash);
        };
        case _ {
          return #Err("This function is only for native tokens (BTC, ETH, SOL)");
        };
      };
    };
  };
}
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat64 "mo:base/Nat64";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Int "mo:base/Int";
import Hash "mo:base/Hash";
import Order "mo:base/Order";

import ParentTypes "../../types";
import EscrowTypes "types";

module {
  // ===== TOKEN CANISTER INTERFACE (ICRC-2 for wrapped tokens) =====
  public type TokenCanisterInterface = actor { 
    icrc1_decimals : shared query () -> async Nat8;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
    icrc2_transfer_from : shared (TransferFromArgs) -> async TransferFromResult;
  };

  // FRADIUM specific interface (for fee balance check)
  public type FradiumLedgerInterface = actor {
    icrc1_balance_of : shared query (Account) -> async Nat;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
    icrc2_transfer_from : shared (TransferFromArgs) -> async TransferFromResult;
  };

  type Account = {
    owner : Principal;
    subaccount : ?Blob;
  };

  // ===== WALLET CANISTER INTERFACE (for native coins) =====
  // Minimal interface matching wallet.did (use inline record for SendRequest)
  public type WalletCanisterInterface = actor {
    // Bitcoin
    bitcoin_address : shared () -> async Text;
    bitcoin_send : shared ({ destination_address : Text; amount_in_satoshi : Nat64 }) -> async Text;
    bitcoin_balance : shared () -> async Nat64;
    bitcoin_send_delegated : shared (Principal, { destination_address : Text; amount_in_satoshi : Nat64 }) -> async Text;
    // Ethereum
    ethereum_address : shared () -> async Text;
    ethereum_send : shared (Text, Nat) -> async Text;
    ethereum_send_delegated : shared (Principal, Text, Nat) -> async Text;
    ethereum_balance : shared () -> async Text;
    // Solana
    solana_address : shared () -> async Text;
    solana_send : shared (Text, Nat) -> async Text;
    solana_balance : shared () -> async Nat;
  };

  type TransferArg = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from_subaccount : ?Blob;
    memo : ?Blob;
    to : { owner : Principal; subaccount : ?Blob };
  };

  type TransferFromArgs = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from : { owner : Principal; subaccount : ?Blob };
    memo : ?Blob;
    spender_subaccount : ?Blob;
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

  type TransferFromResult = {
    #Err : {
      #BadBurn : { min_burn_amount : Nat };
      #BadFee : { expected_fee : Nat };
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #GenericError : { error_code : Nat; message : Text };
      #InsufficientAllowance : { allowance : Nat };
      #InsufficientFunds : { balance : Nat };
      #TemporarilyUnavailable;
      #TooOld
    };
    #Ok : Nat;
  };

  // ===== ESCROW MODULE =====
  public class EscrowModule(
    actorPrincipal : Principal,
    fradiumLedger : TokenCanisterInterface,
    fradiumFeeLedger : FradiumLedgerInterface,
    icpLedger : TokenCanisterInterface,
    ckbtcLedger : TokenCanisterInterface,
    ckethLedger : TokenCanisterInterface,
    walletCanister : ?WalletCanisterInterface  // Optional: for native coin support
  ) {
    // Constants
    private let FIXED_DURATION_SECONDS : Nat64 = 900; // 15 minutes default
    private let MAX_DURATION_SECONDS : Nat64 = 7 * 24 * 60 * 60; // 7 days
    private let ESCROW_FEE : Nat = 10_000; // 0.0001 FRADIUM (10,000 e8s)
    
    // Storage
    private var escrowStorage : [(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)] = [];
    
    // Custom hash function for Nat64
    private func nat64Hash(n : Nat64) : Hash.Hash {
      let maxNat32 : Nat = 4294967296; // 2^32
      return Nat32.fromNat(Nat64.toNat(n) % maxNat32);
    };
    
    private var escrowStore = Map.HashMap<EscrowTypes.EscrowId, EscrowTypes.EscrowRecord>(0, Nat64.equal, nat64Hash);
    
    private var next_escrow_id : EscrowTypes.EscrowId = 0;

    // System hooks
    public func preupgrade() {
      escrowStorage := Iter.toArray(escrowStore.entries());
    };

    public func postupgrade() {
      escrowStore := Map.HashMap<EscrowTypes.EscrowId, EscrowTypes.EscrowRecord>(escrowStorage.size(), Nat64.equal, nat64Hash);
      for ((key, value) in escrowStorage.vals()) {
        escrowStore.put(key, value);
      };
    };

    // Helper: Determine if token should use native wallet or wrapped ledger
    private func get_escrow_method(token : EscrowTypes.TokenType) : EscrowTypes.EscrowMethod {
      switch (token) {
        case (#ckBTC or #ckETH or #ICP or #FRADIUM) { #Wrapped }; // Use ICRC-2 ledger
        case (#BTC or #ETH or #SOL) { #Native }; // Use wallet canister
      };
    };

    // Helper: Get ledger canister for wrapped token type
    // Routes token types to their respective ICRC-2 ledger canisters
    private func get_ledger_for_token(token : EscrowTypes.TokenType) : TokenCanisterInterface {
      switch (token) {
        case (#FRADIUM) { fradiumLedger };
        case (#ICP) { icpLedger };
        case (#BTC or #ckBTC) { ckbtcLedger }; // Both map to ckBTC ledger
        case (#ETH or #ckETH) { ckethLedger }; // Both map to ckETH ledger
        case (#SOL) { fradiumLedger }; // Fallback: SOL wrapped version not available yet
      };
    };

    // ===== CREATE ESCROW =====
    public func create_escrow(
      caller : Principal,
      params : EscrowTypes.CreateEscrowParams
    ) : async ParentTypes.Result<EscrowTypes.EscrowId, Text> {
      // Validation: Check if caller is anonymous
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't create escrow");
      };

      // recipient is optional at create time; validate only if provided
      switch (params.recipient) {
        case (?rcp) {
          if (caller == rcp) { return #Err("Cannot create escrow to yourself"); };
          if (Principal.isAnonymous(rcp)) { return #Err("Cannot create escrow to anonymous principal"); };
        };
        case null {};
      };

      // Duration: allow optional override up to MAX_DURATION_SECONDS
      let durationSeconds : Nat64 = switch (params.duration_seconds) {
        case (?d) { if (d > MAX_DURATION_SECONDS) { MAX_DURATION_SECONDS } else { d } };
        case null { FIXED_DURATION_SECONDS };
      };

      // NOTE: Do not collect fee here; will be handled on join/transfer phase

      // Determine escrow method (Wrapped or Native)
      let escrowMethod = get_escrow_method(params.token_from);

      // Step 4: Create escrow record
      let new_escrow_id = next_escrow_id;
      next_escrow_id += 1;

      let escrow_record : EscrowTypes.EscrowRecord = {
        escrow_id = new_escrow_id;
        sender = caller;
        recipient = params.recipient;
        token_from = params.token_from;
        amount_from = params.amount_from;
        token_to = params.token_to;
        amount_to = params.amount_to;
        escrow_method = escrowMethod;
        state = #AwaitingAccept;
        created_at = Time.now();
        expires_at = Time.now() + Int.abs(Nat64.toNat(durationSeconds)) * 1_000_000_000;
        accepted_at = null;
        released_at = null;
        description = params.description;
        metadata = params.metadata;
      };

      escrowStore.put(new_escrow_id, escrow_record);

      return #Ok(new_escrow_id);
    };

    // ===== GET ESCROW =====
    public func get_escrow(escrow_id : EscrowTypes.EscrowId) : ParentTypes.Result<EscrowTypes.EscrowRecord, Text> {
      switch (escrowStore.get(escrow_id)) {
        case (?escrow) {
          return #Ok(escrow);
        };
        case null {
          return #Err("Escrow not found");
        };
      };
    };

    // ===== GET SENT ESCROWS =====
    public func get_sent_escrows(caller : Principal) : ParentTypes.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't view escrows");
      };

      var sentEscrows : [EscrowTypes.GetMyEscrowsParams] = [];
      
      for ((escrow_id, escrow) in escrowStore.entries()) {
        if (escrow.sender == caller) {
          let escrowParam : EscrowTypes.GetMyEscrowsParams = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = escrow.state;
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            description = escrow.description;
          };
          sentEscrows := Array.append(sentEscrows, [escrowParam]);
        };
      };

      return #Ok(sentEscrows);
    };

    // ===== GET RECEIVED ESCROWS =====
    public func get_received_escrows(caller : Principal) : ParentTypes.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't view escrows");
      };

      var receivedEscrows : [EscrowTypes.GetMyEscrowsParams] = [];
      
      for ((escrow_id, escrow) in escrowStore.entries()) {
        switch (escrow.recipient) {
          case (?rcp) {
            if (rcp == caller) {
          let escrowParam : EscrowTypes.GetMyEscrowsParams = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = escrow.state;
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            description = escrow.description;
          };
          receivedEscrows := Array.append(receivedEscrows, [escrowParam]);
            };
          };
          case null { };
        };
      };

      return #Ok(receivedEscrows);
    };

    // ===== GET ESCROW STATS =====
    public func get_escrow_stats() : EscrowTypes.EscrowStats {
      var total : Nat = 0;
      var pending : Nat = 0;
      var completed : Nat = 0;
      var suspended : Nat = 0;
      var volume : Nat = 0;

      for ((_, escrow) in escrowStore.entries()) {
        total += 1;
        volume += escrow.amount_from;
        
        switch (escrow.state) {
          case (#Pending or #AwaitingAccept or #Locked) { pending += 1 };
          case (#Released) { completed += 1 };
          case (#Suspended) { suspended += 1 };
          case _ { };
        };
      };

      {
        total_escrows = total;
        pending_escrows = pending;
        completed_escrows = completed;
        suspended_escrows = suspended;
        total_volume_locked = volume;
        by_state = [];
      }
    };

    // ===== GET ALL ESCROWS (ADMIN) =====
    public func get_all_escrows() : [EscrowTypes.EscrowRecord] {
      var allEscrows : [EscrowTypes.EscrowRecord] = [];
      
      for ((_, escrow) in escrowStore.entries()) {
        allEscrows := Array.append(allEscrows, [escrow]);
      };

      return allEscrows;
    };

    // Get all escrows with pagination (sorted by created_at desc)
    public func get_all_escrows_paginated(offset : Nat, limit : Nat) : { items : [EscrowTypes.EscrowRecord]; total : Nat } {
      var items : [EscrowTypes.EscrowRecord] = [];
      for ((_, escrow) in escrowStore.entries()) {
        items := Array.append(items, [escrow]);
      };

      // Sort by created_at desc
      items := Array.sort(items, func (a : EscrowTypes.EscrowRecord, b : EscrowTypes.EscrowRecord) : Order.Order {
        if (a.created_at < b.created_at) { return #greater } else if (a.created_at > b.created_at) { return #less } else { return #equal };
      });

      let total : Nat = items.size();
      let start : Nat = if (offset > total) { total } else { offset };
      let endOffset : Nat = offset + limit;
      let end : Nat = if (endOffset > total) { total } else { endOffset };
      let count : Nat = if (end > start) { end - start } else { 0 };
      let page : [EscrowTypes.EscrowRecord] = if (count == 0) { [] } else { Array.subArray(items, start, count) };

      { items = page; total = total }
    };

    // Get open escrows (AwaitingAccept) with pagination (sorted by created_at desc)
    public func get_open_escrows_paginated(offset : Nat, limit : Nat) : { items : [EscrowTypes.EscrowRecord]; total : Nat } {
      var items : [EscrowTypes.EscrowRecord] = [];
      for ((_, escrow) in escrowStore.entries()) {
        switch (escrow.state) {
          case (#AwaitingAccept) { items := Array.append(items, [escrow]); };
          case _ {};
        };
      };

      // Sort by created_at desc
      items := Array.sort(items, func (a : EscrowTypes.EscrowRecord, b : EscrowTypes.EscrowRecord) : Order.Order {
        if (a.created_at < b.created_at) { return #greater } else if (a.created_at > b.created_at) { return #less } else { return #equal };
      });

      let total : Nat = items.size();
      let start : Nat = if (offset > total) { total } else { offset };
      let endOffset : Nat = offset + limit;
      let end : Nat = if (endOffset > total) { total } else { endOffset };
      let count : Nat = if (end > start) { end - start } else { 0 };
      let page : [EscrowTypes.EscrowRecord] = if (count == 0) { [] } else { Array.subArray(items, start, count) };

      { items = page; total = total }
    };

    // Getter/setter for storage
    public func set_escrow_storage(storage : [(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)]) {
      escrowStorage := storage;
    };

    public func get_escrow_storage() : [(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)] {
      return escrowStorage;
    };

    public func set_next_escrow_id(id : EscrowTypes.EscrowId) {
      next_escrow_id := id;
    };

    public func get_next_escrow_id() : EscrowTypes.EscrowId {
      return next_escrow_id;
    };

    // ===== SENT ESCROWS PAGINATED =====
    public func get_sent_escrows_paginated(caller : Principal, offset : Nat, limit : Nat) : { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
      // Collect and filter only escrows sent by caller
      let allEntries = Iter.toArray(escrowStore.entries());
      let mine = Array.filter<(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)>(allEntries, func(entry) { entry.1.sender == caller });

      // Sort by created_at desc
      let sorted = Array.sort<(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)>(mine, func(a, b) {
        if (a.1.created_at > b.1.created_at) { #less } else if (a.1.created_at < b.1.created_at) { #greater } else { #equal }
      });

      let total = Array.size(sorted);
      let start = Nat.min(offset, total);
      let end = Nat.min(start + limit, total);
      let page = Array.tabulate<(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)>(end - start, func(i) { sorted[start + i] });

      return {
        items = Array.map<(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord), EscrowTypes.EscrowRecord>(page, func(t) { t.1 });
        total = total;
        offset = offset;
        limit = limit;
      };
    };

    // ===== JOIN ESCROW =====
    public func join_escrow(caller : Principal, params : EscrowTypes.AcceptEscrowParams) : async ParentTypes.Result<EscrowTypes.EscrowId, Text> {
      if (Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't join escrow");
      };

      switch (escrowStore.get(params.escrow_id)) {
        case null { return #Err("Escrow not found"); };
        case (?escrow) {
          if (escrow.state != #AwaitingAccept) {
            return #Err("Escrow is not open for joining");
          };
          // Prevent join after expiration
          if (Time.now() >= escrow.expires_at) {
            return #Err("Escrow has expired");
          };
          if (escrow.sender == caller) {
            return #Err("Creator cannot join their own escrow");
          };
          switch (escrow.recipient) {
            case (?rcp) { if (rcp != caller) { return #Err("This escrow is invite-only"); } };
            case null {};
          };

          // TODO: perform transfers and collect FRADIUM fee here, then set state to Locked
          let updated : EscrowTypes.EscrowRecord = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = #Pending;
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            accepted_at = ?Time.now();
            released_at = escrow.released_at;
            description = escrow.description;
            metadata = escrow.metadata;
          };
          escrowStore.put(params.escrow_id, updated);
          return #Ok(params.escrow_id);
        };
      };
    };
  };
};

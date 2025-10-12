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
import Blob "mo:base/Blob";

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
    private let DEPOSIT_WINDOW_SECONDS : Nat64 = 900; // 15 minutes to deposit after accept
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

    // ===== Subaccount helpers =====
    // Convert Nat64 to 8-byte little-endian array
    private func nat64ToBytesLE(n : Nat64) : [Nat8] {
      var x : Nat64 = n;
      let arr : [var Nat8] = Array.init<Nat8>(8, 0);
      var i : Nat = 0;
      label l loop {
        if (i >= 8) { break l; };
        let byteVal : Nat64 = x % 256;
        arr[i] := Nat8.fromNat(Nat64.toNat(byteVal));
        x := x / 256;
        i += 1;
      };
      Array.freeze<Nat8>(arr)
    };

    // Derive a 32-byte subaccount for a given escrow_id and side (0 = from, 1 = to)
    private func derive_subaccount(escrow_id : EscrowTypes.EscrowId, side : Nat8) : Blob {
      let arr : [var Nat8] = Array.init<Nat8>(32, 0);
      // Prefix magic 'escrow' + side marker
      arr[0] := 0x65; // 'e'
      arr[1] := 0x73; // 's'
      arr[2] := 0x63; // 'c'
      arr[3] := 0x72; // 'r'
      arr[4] := 0x6f; // 'o'
      arr[5] := 0x77; // 'w'
      arr[6] := side; // side marker
      // put 8 bytes of escrow_id at the end (little-endian order)
      let bytes = nat64ToBytesLE(escrow_id);
      var j : Nat = 0;
      label l2 loop {
        if (j >= 8) { break l2; };
        arr[24 + j] := bytes[j];
        j += 1;
      };
      Blob.fromArray(Array.freeze<Nat8>(arr))
    };

    private func get_deposit_account_for_side(escrow : EscrowTypes.EscrowRecord, sideFrom : Bool) : Account {
      let sub : Blob = if (sideFrom) { derive_subaccount(escrow.escrow_id, 0) } else { derive_subaccount(escrow.escrow_id, 1) };
      { owner = actorPrincipal; subaccount = ?sub };
    };

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

    // Helper: Get ledger principal for token (to allow dynamic typed calls)
    private func get_ledger_principal_for_token(token : EscrowTypes.TokenType) : Principal {
      switch (token) {
        case (#FRADIUM) { Principal.fromActor(fradiumLedger) };
        case (#ICP) { Principal.fromActor(icpLedger) };
        case (#BTC or #ckBTC) { Principal.fromActor(ckbtcLedger) };
        case (#ETH or #ckETH) { Principal.fromActor(ckethLedger) };
        case (#SOL) { Principal.fromActor(fradiumLedger) };
      }
    };

    // Helper: Try get balance via Nat then Nat64 variants
    private func get_balance_generic(ledgerPrin : Principal, account : Account) : async Nat {
      // Try Nat first
      do {
        let dyn : actor { icrc1_balance_of : shared query (Account) -> async Nat } = actor (Principal.toText(ledgerPrin));
        try {
          let b = await dyn.icrc1_balance_of(account);
          return b;
        } catch e { };
      };
      // Then try Nat64
      do {
        let dyn64 : actor { icrc1_balance_of : shared query (Account) -> async Nat64 } = actor (Principal.toText(ledgerPrin));
        try {
          let b64 = await dyn64.icrc1_balance_of(account);
          return Nat64.toNat(b64);
        } catch e2 { };
      };
      0
    };

    // Helper: Try get fee (icrc1_fee) via Nat then Nat64 variants
    private func get_fee_generic(ledgerPrin : Principal) : async Nat {
      // Try Nat first
      do {
        let dyn : actor { icrc1_fee : shared query () -> async Nat } = actor (Principal.toText(ledgerPrin));
        try {
          let f = await dyn.icrc1_fee();
          return f;
        } catch e { };
      };
      // Then try Nat64
      do {
        let dyn64 : actor { icrc1_fee : shared query () -> async Nat64 } = actor (Principal.toText(ledgerPrin));
        try {
          let f64 = await dyn64.icrc1_fee();
          return Nat64.toNat(f64);
        } catch e2 { };
      };
      0
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
        deposit_expires_at = null;
        deposit_from_done = false;
        deposit_to_done = false;
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

    // ===== RECEIVED ESCROWS PAGINATED =====
    public func get_received_escrows_paginated(caller : Principal, offset : Nat, limit : Nat) : { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
      // Collect and filter only escrows received by caller
      let allEntries = Iter.toArray(escrowStore.entries());
      let mine = Array.filter<(EscrowTypes.EscrowId, EscrowTypes.EscrowRecord)>(allEntries, func(entry) {
        switch (entry.1.recipient) {
          case (?rcp) { rcp == caller };
          case null { false };
        }
      });

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
          let newRecipient : ?Principal = switch (escrow.recipient) {
            case (?rcp) { if (rcp != caller) { return #Err("This escrow is invite-only"); }; ?rcp };
            case null { ?caller };
          };

          // Mark accepted and start deposit window
          let updated : EscrowTypes.EscrowRecord = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = newRecipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = #Pending; // Pending = awaiting both deposits
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            accepted_at = ?Time.now();
            deposit_expires_at = ?(Time.now() + Int.abs(Nat64.toNat(DEPOSIT_WINDOW_SECONDS)) * 1_000_000_000);
            deposit_from_done = false;
            deposit_to_done = false;
            released_at = escrow.released_at;
            description = escrow.description;
            metadata = escrow.metadata;
          };
          escrowStore.put(params.escrow_id, updated);
          return #Ok(params.escrow_id);
        };
      };
    };

    // ===== MARK DEPOSIT (called by each party after sending funds) =====
    public func mark_deposit(caller : Principal, escrow_id : EscrowTypes.EscrowId) : async ParentTypes.Result<Text, Text> {
      switch (escrowStore.get(escrow_id)) {
        case null { return #Err("Escrow not found"); };
        case (?escrow) {
          if (escrow.state != #Pending) { return #Err("Escrow is not in deposit phase"); };
          switch (escrow.deposit_expires_at) {
            case (?de) { if (Time.now() > de) { return #Err("Deposit window expired"); } };
            case null { return #Err("Deposit window not set"); };
          };

          var fromDone = escrow.deposit_from_done;
          var toDone = escrow.deposit_to_done;

          // Verify deposit by checking ledger balance in escrow subaccount
          if (caller == escrow.sender) {
            let acct = get_deposit_account_for_side(escrow, true);
            let prin = get_ledger_principal_for_token(escrow.token_from);
            let bal = await get_balance_generic(prin, acct);
            if (bal < escrow.amount_from) { return #Err("Deposit not detected for sender side"); };
            fromDone := true;
          } else {
            switch (escrow.recipient) {
              case (?rcp) {
                if (caller != rcp) { return #Err("Only sender or recipient can mark deposit"); };
                let acct = get_deposit_account_for_side(escrow, false);
                let prin = get_ledger_principal_for_token(escrow.token_to);
                let bal = await get_balance_generic(prin, acct);
                if (bal < escrow.amount_to) { return #Err("Deposit not detected for recipient side"); };
                toDone := true;
              };
              case null { return #Err("Escrow is open, no specific recipient to deposit"); };
            };
          };

          // Collect FRADIUM fee from caller when marking deposit
          let feeResult = await fradiumLedger.icrc2_transfer_from({
            from = { owner = caller; subaccount = null };
            to = { owner = actorPrincipal; subaccount = null };
            amount = ESCROW_FEE;
            fee = null;
            memo = null;
            created_at_time = null;
            spender_subaccount = null;
          });
          
          switch (feeResult) {
            case (#Err(e)) { 
              let errorMsg = switch (e) {
                case (#InsufficientFunds(_)) { "Insufficient FRADIUM balance for fee" };
                case (#InsufficientAllowance(_)) { "Insufficient allowance for fee collection" };
                case (#GenericError({ message })) { message };
                case _ { "Unknown fee collection error" };
              };
              return #Err("Failed to collect escrow fee: " # errorMsg);
            };
            case (#Ok(_)) { };
          };

          var newState : EscrowTypes.EscrowState = escrow.state;
          if (fromDone and toDone) {
            // Both deposited -> move to Locked
            newState := #Locked;
          };

          let updated : EscrowTypes.EscrowRecord = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = newState;
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            accepted_at = escrow.accepted_at;
            released_at = escrow.released_at;
            deposit_expires_at = escrow.deposit_expires_at;
            deposit_from_done = fromDone;
            deposit_to_done = toDone;
            description = escrow.description;
            metadata = escrow.metadata;
          };
          escrowStore.put(escrow_id, updated);
          // Auto-release when both deposits are completed
          if (fromDone and toDone) {
            ignore await release_escrow(actorPrincipal, escrow_id);
          };
          return #Ok("Deposit marked and fee collected");
        };
      };
    };

    // ===== RELEASE ESCROW (after both deposits) =====
    public func release_escrow(caller : Principal, escrow_id : EscrowTypes.EscrowId) : async ParentTypes.Result<Text, Text> {
      switch (escrowStore.get(escrow_id)) {
        case null { return #Err("Escrow not found"); };
        case (?escrow) {
          if (escrow.state != #Locked) { return #Err("Escrow not locked"); };

          // Perform transfers from escrow subaccounts to parties, accounting for ledger fees
          let fromSub = derive_subaccount(escrow.escrow_id, 0);
          let toSub = derive_subaccount(escrow.escrow_id, 1);

          // Principals for dynamic queries
          let fromPrin = get_ledger_principal_for_token(escrow.token_from);
          let toPrin = get_ledger_principal_for_token(escrow.token_to);

          // Current balances of escrow subaccounts
          let fromBal = await get_balance_generic(fromPrin, { owner = actorPrincipal; subaccount = ?fromSub });
          let toBal = await get_balance_generic(toPrin, { owner = actorPrincipal; subaccount = ?toSub });

          // Ledger fees
          let fromFee = await get_fee_generic(fromPrin);
          let toFee = await get_fee_generic(toPrin);

          // Compute transferable amounts considering fees
          let desiredFromAmt : Nat = escrow.amount_from;
          let desiredToAmt : Nat = escrow.amount_to;

          let sendFromAmt : Nat = if (fromBal >= desiredFromAmt + fromFee) {
            desiredFromAmt
          } else if (fromBal > fromFee) {
            fromBal - fromFee
          } else { 0 };

          let sendToAmt : Nat = if (toBal >= desiredToAmt + toFee) {
            desiredToAmt
          } else if (toBal > toFee) {
            toBal - toFee
          } else { 0 };

          if (sendFromAmt == 0 or sendToAmt == 0) {
            return #Err("Insufficient escrow balances to cover transfer and fees");
          };

          // token_from -> recipient
          let fromLedger = get_ledger_for_token(escrow.token_from);
          let tx1 = await fromLedger.icrc1_transfer({
            from_subaccount = ?fromSub;
            to = { owner = switch (escrow.recipient) { case (?rcp) rcp; case null escrow.sender }; subaccount = null };
            amount = sendFromAmt;
            fee = ?fromFee;
            memo = null;
            created_at_time = null;
          });

          switch (tx1) {
            case (#Err e1) { return #Err("Release failed on token_from transfer"); };
            case (#Ok _) { };
          };

          // token_to -> sender
          let toLedger = get_ledger_for_token(escrow.token_to);
          let tx2 = await toLedger.icrc1_transfer({
            from_subaccount = ?toSub;
            to = { owner = escrow.sender; subaccount = null };
            amount = sendToAmt;
            fee = ?toFee;
            memo = null;
            created_at_time = null;
          });

          switch (tx2) {
            case (#Err e2) { return #Err("Release failed on token_to transfer"); };
            case (#Ok _) { };
          };

          let updated : EscrowTypes.EscrowRecord = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_from = escrow.token_from;
            amount_from = escrow.amount_from;
            token_to = escrow.token_to;
            amount_to = escrow.amount_to;
            escrow_method = escrow.escrow_method;
            state = #Released;
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            accepted_at = escrow.accepted_at;
            released_at = ?Time.now();
            deposit_expires_at = escrow.deposit_expires_at;
            deposit_from_done = escrow.deposit_from_done;
            deposit_to_done = escrow.deposit_to_done;
            description = escrow.description;
            metadata = escrow.metadata;
          };
          escrowStore.put(escrow_id, updated);
          return #Ok("Escrow released");
        };
      };
    };

    // ===== GET DEPOSIT ACCOUNT (owner + subaccount) =====
    public func get_deposit_account(escrow_id : EscrowTypes.EscrowId, side : Text) : { owner : Principal; sub : ?Blob } {
      switch (escrowStore.get(escrow_id)) {
        case null { return { owner = actorPrincipal; sub = null }; };
        case (?escrow) {
          let isFrom = if (Text.equal(side, "from")) { true } else { false };
          let acct = get_deposit_account_for_side(escrow, isFrom);
          { owner = acct.owner; sub = acct.subaccount };
        };
      };
    };
  };
};

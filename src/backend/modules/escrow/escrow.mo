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

import ParentTypes "../../types";
import EscrowTypes "types";

module {
  // ===== TOKEN CANISTER INTERFACE =====
  public type TokenCanisterInterface = actor { 
    icrc1_decimals : shared query () -> async Nat8;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
    icrc2_transfer_from : shared (TransferFromArgs) -> async TransferFromResult;
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

  // ===== AI ANALYZER INTERFACE =====
  public type AIAnalyzerInterface = actor {
    analyze_address : shared (address : Text, chain : Text) -> async EscrowTypes.AIAnalyzeResponse;
  };

  // ===== ESCROW MODULE =====
  public class EscrowModule(
    actorPrincipal : Principal,
    tokenCanister : TokenCanisterInterface,
    aiAnalyzer : ?AIAnalyzerInterface
  ) {
    // Constants
    private let MIN_DURATION_SECONDS : Nat64 = 3600; // 1 hour
    private let MAX_DURATION_SECONDS : Nat64 = 2592000; // 30 days
    private let HIGH_RISK_SUSPEND_THRESHOLD : Nat = 80; // Risk score > 80 = suspend
    
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

    // Helper: Convert TokenType to chain name
    private func token_to_chain(token : EscrowTypes.TokenType) : Text {
      switch (token) {
        case (#BTC or #ckBTC) { "Bitcoin" };
        case (#ETH or #ckETH) { "Ethereum" };
        case (#SOL) { "Solana" };
        case (#ICP or #FRADIUM) { "ICP" };
      };
    };

    // Helper: Get minimum escrow amount based on token
    private func get_min_escrow_amount(token : EscrowTypes.TokenType) : async Nat {
      let decimals = await tokenCanister.icrc1_decimals();
      let base = 10 ** Nat8.toNat(decimals);
      
      switch (token) {
        case (#FRADIUM) { 10 * base }; // 10 FUM
        case (#ICP) { 1 * base }; // 1 ICP
        case (#ckBTC or #BTC) { base / 1000 }; // 0.001 BTC
        case (#ckETH or #ETH) { base / 100 }; // 0.01 ETH
        case (#SOL) { 1 * base }; // 1 SOL
      };
    };

    // Helper: Perform AI risk analysis
    private func analyze_recipient_risk(
      recipient : Principal, 
      token : EscrowTypes.TokenType
    ) : async ?EscrowTypes.AIRiskAnalysis {
      switch (aiAnalyzer) {
        case null {
          // No AI analyzer available - default to low risk
          return ?{
            risk_level = #Low;
            risk_score = 20;
            analyzed_at = Time.now();
            analysis_details = "{\"status\":\"no_analyzer\",\"default\":\"low_risk\"}";
            is_suspicious = false;
          };
        };
        case (?analyzer) {
          try {
            let recipientText = Principal.toText(recipient);
            let chain = token_to_chain(token);
            
            let response = await analyzer.analyze_address(recipientText, chain);
            
            return ?{
              risk_level = response.risk_level;
              risk_score = response.risk_score;
              analyzed_at = Time.now();
              analysis_details = response.details;
              is_suspicious = not response.is_safe;
            };
          } catch (_) {
            // AI analysis failed - default to medium risk for safety
            return ?{
              risk_level = #Medium;
              risk_score = 50;
              analyzed_at = Time.now();
              analysis_details = "{\"status\":\"analysis_failed\",\"error\":\"AI analyzer error\"}";
              is_suspicious = false;
            };
          };
        };
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

      // Validation: Check if sender and recipient are the same
      if (caller == params.recipient) {
        return #Err("Cannot create escrow to yourself");
      };

      // Validation: Check if recipient is anonymous
      if (Principal.isAnonymous(params.recipient)) {
        return #Err("Cannot create escrow to anonymous principal");
      };

      // Validation: Check duration
      if (params.duration_seconds < MIN_DURATION_SECONDS) {
        return #Err("Duration must be at least 1 hour (3600 seconds)");
      };

      if (params.duration_seconds > MAX_DURATION_SECONDS) {
        return #Err("Duration cannot exceed 30 days (2592000 seconds)");
      };

      // Validation: Check minimum amount
      let minAmount = await get_min_escrow_amount(params.token_type);
      if (params.amount < minAmount) {
        return #Err("Amount is below minimum escrow amount for this token");
      };

      // Step 1: Perform AI Risk Analysis on recipient
      let riskAnalysis = await analyze_recipient_risk(params.recipient, params.token_type);
      
      // Step 2: Check if risk is too high
      let initialState : EscrowTypes.EscrowState = switch (riskAnalysis) {
        case (?analysis) {
          if (analysis.risk_score >= HIGH_RISK_SUSPEND_THRESHOLD) {
            #Suspended // High risk - suspend immediately
          } else {
            #Pending // Normal flow - pending transfer
          };
        };
        case null {
          #Pending // No analysis - proceed with caution
        };
      };

      // If suspended due to high risk, don't proceed with transfer
      if (initialState == #Suspended) {
        let new_escrow_id = next_escrow_id;
        next_escrow_id += 1;

        let suspended_record : EscrowTypes.EscrowRecord = {
          escrow_id = new_escrow_id;
          sender = caller;
          recipient = params.recipient;
          token_type = params.token_type;
          amount = params.amount;
          risk_analysis = riskAnalysis;
          state = #Suspended;
          created_at = Time.now();
          expires_at = Time.now() + Int.abs(Nat64.toNat(params.duration_seconds)) * 1_000_000_000;
          accepted_at = null;
          released_at = null;
          description = params.description;
          metadata = params.metadata;
        };

        escrowStore.put(new_escrow_id, suspended_record);
        
        return #Err("Escrow suspended: Recipient wallet has high risk score. Escrow ID: " # Nat64.toText(new_escrow_id));
      };

      // Step 3: Transfer funds from sender to escrow (this canister)
      let transferArgs : TransferFromArgs = {
        spender_subaccount = null;
        from = {
          owner = caller;
          subaccount = null;
        };
        to = {
          owner = actorPrincipal;
          subaccount = null;
        };
        amount = params.amount;
        fee = null;
        memo = ?Text.encodeUtf8("Escrow Lock");
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
      };

      let transferResult = await tokenCanister.icrc2_transfer_from(transferArgs);
      switch (transferResult) {
        case (#Err(err)) {
          return #Err("Failed to lock funds in escrow: " # debug_show(err));
        };
        case (#Ok(_)) { };
      };

      // Step 4: Create escrow record
      let new_escrow_id = next_escrow_id;
      next_escrow_id += 1;

      let escrow_record : EscrowTypes.EscrowRecord = {
        escrow_id = new_escrow_id;
        sender = caller;
        recipient = params.recipient;
        token_type = params.token_type;
        amount = params.amount;
        risk_analysis = riskAnalysis;
        state = #AwaitingAccept; // Funds locked, waiting for recipient to accept
        created_at = Time.now();
        expires_at = Time.now() + Int.abs(Nat64.toNat(params.duration_seconds)) * 1_000_000_000;
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
            token_type = escrow.token_type;
            amount = escrow.amount;
            state = escrow.state;
            risk_level = switch (escrow.risk_analysis) {
              case (?analysis) { ?analysis.risk_level };
              case null { null };
            };
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
        if (escrow.recipient == caller) {
          let escrowParam : EscrowTypes.GetMyEscrowsParams = {
            escrow_id = escrow.escrow_id;
            sender = escrow.sender;
            recipient = escrow.recipient;
            token_type = escrow.token_type;
            amount = escrow.amount;
            state = escrow.state;
            risk_level = switch (escrow.risk_analysis) {
              case (?analysis) { ?analysis.risk_level };
              case null { null };
            };
            created_at = escrow.created_at;
            expires_at = escrow.expires_at;
            description = escrow.description;
          };
          receivedEscrows := Array.append(receivedEscrows, [escrowParam]);
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
        volume += escrow.amount;
        
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
        by_risk = [];
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
  };
};

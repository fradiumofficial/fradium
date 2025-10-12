// Swap Module
// Integrasi dengan ICPSwap untuk token swapping tanpa membuat canister baru

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
import Float "mo:base/Float";

import ParentTypes "../../types";
import SwapTypes "types";

module {
  // ===== TOKEN MAPPINGS =====
  
  let TOKEN_MAPPINGS = Map.fromIter<Text, Text>(Iter.fromArray([
    ("ICP", "ryjl3-tyaaa-aaaaa-aaaba-cai"),
    ("FRADIUM", "sr4wk-4qaaa-aaaae-qfdta-cai"),
    ("ckBTC", "mc6ru-gyaaa-aaaar-qaaaq-cai"),
    ("ckETH", "ss2fx-dyaaa-aaaar-qacoq-cai")
  ]), 4, Text.equal, Text.hash);

  let TOKEN_DECIMALS = Map.fromIter<Text, Nat8>(Iter.fromArray([
    ("ICP", 8),
    ("FRADIUM", 8),
    ("ckBTC", 8),
    ("ckETH", 18)
  ]), 4, Text.equal, Text.hash);

  // ===== SWAP MODULE CLASS =====
  
  public class SwapModule(
    parentCanister : Principal,
    fradiumLedger : SwapTypes.TokenCanisterInterface,
    icpLedger : SwapTypes.TokenCanisterInterface,
    ckBtcLedger : SwapTypes.TokenCanisterInterface,
    ckEthLedger : SwapTypes.TokenCanisterInterface
  ) {
    
    // ===== STORAGE =====
    
    // Swap history storage
    private var swapHistory = Map.HashMap<Nat, SwapTypes.SwapHistory>(0, Nat.equal, Hash.hash);
    private var nextSwapId : Nat = 1;
    
    // ===== HELPER FUNCTIONS =====
    
    private func getTokenCanister(tokenSymbol : Text) : ?SwapTypes.TokenCanisterInterface {
      switch (tokenSymbol) {
        case "ICP" { ?icpLedger };
        case "FRADIUM" { ?fradiumLedger };
        case "ckBTC" { ?ckBtcLedger };
        case "ckETH" { ?ckEthLedger };
        case _ { null };
      };
    };

    private func getTokenDecimals(tokenSymbol : Text) : Nat8 {
      switch (TOKEN_DECIMALS.get(tokenSymbol)) {
        case (?decimals) { decimals };
        case null { 8 }; // Default to 8 decimals
      };
    };

    private func getTokenCanisterId(tokenSymbol : Text) : ?Text {
      TOKEN_MAPPINGS.get(tokenSymbol);
    };

    // ===== SWAP QUOTE FUNCTIONS =====
    
    public func getSwapQuote(request : SwapTypes.SwapQuoteRequest) : SwapTypes.SwapQuoteResponse {
      // Validate tokens
      let fromCanisterId = getTokenCanisterId(request.from_token);
      let toCanisterId = getTokenCanisterId(request.to_token);
      
      if (fromCanisterId == null or toCanisterId == null) {
        // Return error response
        return {
          rate = 0.0;
          estimated_output = 0;
          fee = 0;
          price_impact = 0.0;
          min_amount_out = 0;
          valid_for = 0;
        };
      };

      // For MVP phase, return mock quote
      // In production, this would call ICPSwap API
      let mockRate = getMockRate(request.from_token, request.to_token);
      let estimatedOutput = Float.toInt(Float.fromInt(request.amount) * mockRate);
      let fee = request.amount / 1000; // 0.1% fee
      let priceImpact = 0.5; // Mock price impact
      let minAmountOut = estimatedOutput * 95 / 100; // 5% slippage tolerance

      return {
        rate = mockRate;
        estimated_output = estimatedOutput;
        fee = fee;
        price_impact = priceImpact;
        min_amount_out = minAmountOut;
        valid_for = 300; // 5 minutes
      };
    };

    private func getMockRate(fromToken : Text, toToken : Text) : Float {
      // Mock exchange rates for MVP
      switch (fromToken, toToken) {
        case ("ICP", "FRADIUM") { 1000.0 };
        case ("FRADIUM", "ICP") { 0.001 };
        case ("ICP", "ckBTC") { 0.000025 };
        case ("ckBTC", "ICP") { 40000.0 };
        case ("ICP", "ckETH") { 0.0004 };
        case ("ckETH", "ICP") { 2500.0 };
        case ("FRADIUM", "ckBTC") { 0.000000025 };
        case ("ckBTC", "FRADIUM") { 40000000.0 };
        case ("FRADIUM", "ckETH") { 0.0000004 };
        case ("ckETH", "FRADIUM") { 2500000.0 };
        case _ { 1.0 }; // Default rate
      };
    };

    // ===== SWAP EXECUTION FUNCTIONS =====
    
    public func executeSwap(user : Principal, request : SwapTypes.SwapExecuteRequest) : SwapTypes.SwapExecuteResponse {
      // Validate tokens
      let fromCanisterId = getTokenCanisterId(request.from_token);
      let toCanisterId = getTokenCanisterId(request.to_token);
      
      if (fromCanisterId == null or toCanisterId == null) {
        return {
          success = false;
          transaction_id = null;
          error = ?"Unsupported token pair";
          redirect_url = null;
        };
      };

      // For MVP phase, redirect to ICPSwap frontend
      // In production, this would execute the swap directly
      let redirectUrl = generateSwapUrl(request.from_token, request.to_token, request.amount);
      
      // Create swap history record
      let swapId = nextSwapId;
      nextSwapId += 1;
      
      let swapRecord : SwapTypes.SwapHistory = {
        id = swapId;
        user = user;
        from_token = request.from_token;
        to_token = request.to_token;
        from_amount = request.amount;
        to_amount = 0; // Will be updated when swap completes
        fee = 0; // Will be updated when swap completes
        transaction_id = null;
        status = #Pending;
        created_at = Time.now();
        completed_at = null;
      };
      
      swapHistory.put(swapId, swapRecord);

      return {
        success = true;
        transaction_id = ?swapId;
        error = null;
        redirect_url = ?redirectUrl;
      };
    };

    private func generateSwapUrl(fromToken : Text, toToken : Text, amount : Nat) : Text {
      let fromCanisterId = switch (getTokenCanisterId(fromToken)) {
        case (?id) { id };
        case null { "" };
      };
      
      let toCanisterId = switch (getTokenCanisterId(toToken)) {
        case (?id) { id };
        case null { "" };
      };

      let baseUrl = "https://icpswap.com/swap";
      let params = "?inputCurrency=" # fromCanisterId # "&outputCurrency=" # toCanisterId # "&amount=" # Nat.toText(amount);
      
      baseUrl # params;
    };

    // ===== SWAP HISTORY FUNCTIONS =====
    
    public func getSwapHistory(user : Principal, offset : Nat, limit : Nat) : { items : [SwapTypes.SwapHistory]; total : Nat; offset : Nat; limit : Nat } {
      let userSwaps = Array.filter<SwapTypes.SwapHistory>(
        Iter.toArray(swapHistory.vals()),
        func(swap) { swap.user == user }
      );
      
      let total = userSwaps.size();
      let start = Nat.min(offset, total);
      let end = Nat.min(offset + limit, total);
      
      let items = Array.slice(userSwaps, start, end);
      
      return {
        items = items;
        total = total;
        offset = offset;
        limit = limit;
      };
    };

    public func getSwapById(swapId : Nat) : ?SwapTypes.SwapHistory {
      swapHistory.get(swapId);
    };

    // ===== TOKEN INFO FUNCTIONS =====
    
    public func getSupportedTokens() : [SwapTypes.TokenInfo] {
      let tokens = Array.map<(Text, Text), SwapTypes.TokenInfo>(
        Iter.toArray(TOKEN_MAPPINGS.entries()),
        func((symbol, canisterId)) {
          {
            symbol = symbol;
            canister_id = canisterId;
            decimals = getTokenDecimals(symbol);
            name = symbol;
          };
        }
      );
      
      tokens;
    };

    public func getSupportedPairs() : [SwapTypes.SupportedPair] {
      let tokens = Iter.toArray(TOKEN_MAPPINGS.entries());
      let pairs = Array.flatten<SwapTypes.SupportedPair>(
        Array.map<(Text, Text), [SwapTypes.SupportedPair]>(
          tokens,
          func((fromSymbol, fromCanisterId)) {
            Array.map<(Text, Text), SwapTypes.SupportedPair>(
              Array.filter<(Text, Text)>(
                tokens,
                func((toSymbol, _)) { toSymbol != fromSymbol }
              ),
              func((toSymbol, toCanisterId)) {
                {
                  from_token = fromSymbol;
                  to_token = toSymbol;
                  from_canister_id = fromCanisterId;
                  to_canister_id = toCanisterId;
                  active = true;
                };
              }
            );
          }
        )
      );
      
      pairs;
    };

    // ===== SYSTEM FUNCTIONS =====
    
    public func preupgrade() {
      // Save state before upgrade
    };

    public func postupgrade() {
      // Restore state after upgrade
    };
  };
};

import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== ESCROW ID =====
  public type EscrowId = Nat64;

  // ===== TOKEN TYPES =====
  // Token mapping for escrow:
  // 
  // WRAPPED TOKENS (Recommended - Proper escrow with locked funds):
  // - ckBTC -> ckbtc_ledger (wrapped Bitcoin, funds locked in canister)
  // - ckETH -> cketh_ledger (wrapped Ethereum, funds locked in canister)
  // - ICP -> icp_ledger (native ICP token, funds locked in canister)
  // - FRADIUM -> fradium_ledger (custom token, funds locked in canister)
  //
  // NATIVE COINS (Via Wallet Canister - Trust-based):
  // - BTC -> wallet canister (native Bitcoin via threshold ECDSA)
  // - ETH -> wallet canister (native Ethereum via threshold ECDSA)
  // - SOL -> wallet canister (native Solana via Ed25519)
  //
  // WARNING: Native coin escrow is trust-based. Funds are controlled by
  // wallet canister (per-user), not locked in escrow canister.
  // Recommended to use wrapped versions (ckBTC, ckETH) for proper escrow.
  public type TokenType = {
    #BTC;      // Native Bitcoin (via wallet) OR wrapped ckBTC (via ledger)
    #SOL;      // Native Solana (via wallet)
    #ETH;      // Native Ethereum (via wallet) OR wrapped ckETH (via ledger)
    #ckETH;    // Chain key Ethereum (recommended for escrow)
    #ICP;      // Native ICP (via ledger)
    #ckBTC;    // Chain key Bitcoin (recommended for escrow)
    #FRADIUM;  // Fradium token (via ledger)
  };

  // ===== ESCROW STATES =====
  public type EscrowState = {
    #Pending;           // Just created, waiting for processing
    #AwaitingAccept;    // Funds locked (wrapped) or reserved (native), waiting for recipient to accept
    #Locked;            // Funds locked in escrow (wrapped tokens only)
    #Released;          // Funds released to recipient
    #Rejected;          // Rejected by recipient
    #Cancelled;         // Cancelled by sender
    #Expired;           // Time expired, auto-refunded
    #Suspended;         // Suspended due to high risk
  };

  // ===== ESCROW METHOD =====
  public type EscrowMethod = {
    #Wrapped;  // Uses ICRC-2 ledger (ckBTC, ckETH, ICP, FRADIUM) - funds locked in canister
    #Native;   // Uses wallet canister (BTC, ETH, SOL) - funds controlled by wallet
  };

  // ===== ESCROW RECORD =====
  public type EscrowRecord = {
    escrow_id: EscrowId;
    sender: Principal;
    recipient: ?Principal;
    // Offer side (what sender gives)
    token_from: TokenType;
    amount_from: Nat;
    // Request side (what sender requests in return)
    token_to: TokenType;
    amount_to: Nat;
    escrow_method: EscrowMethod; // Wrapped (locked) or Native (wallet-based)
    
    // State & Timing
    state: EscrowState;
    created_at: Time.Time;
    expires_at: Time.Time;
    accepted_at: ?Time.Time;
    released_at: ?Time.Time;
    
    // Optional fields
    description: ?Text;
    metadata: ?Text;
  };

  // ===== CREATE ESCROW PARAMS =====
  public type CreateEscrowParams = {
    recipient: ?Principal;
    token_from: TokenType;
    amount_from: Nat;
    token_to: TokenType;
    amount_to: Nat;
    // Optional custom expiration duration in seconds (max 7 days). If null, backend default applies
    duration_seconds: ?Nat64;
    description: ?Text;
    metadata: ?Text;
  };

  // ===== ACCEPT ESCROW PARAMS =====
  public type AcceptEscrowParams = {
    escrow_id: EscrowId;
  };

  // ===== REJECT ESCROW PARAMS =====
  public type RejectEscrowParams = {
    escrow_id: EscrowId;
    reason: ?Text;
  };

  // ===== CANCEL ESCROW PARAMS =====
  public type CancelEscrowParams = {
    escrow_id: EscrowId;
    reason: ?Text;
  };

  // ===== GET MY ESCROWS PARAMS =====
  public type GetMyEscrowsParams = {
    escrow_id: EscrowId;
    sender: Principal;
    recipient: ?Principal;
    token_from: TokenType;
    amount_from: Nat;
    token_to: TokenType;
    amount_to: Nat;
    escrow_method: EscrowMethod;
    state: EscrowState;
    created_at: Time.Time;
    expires_at: Time.Time;
    description: ?Text;
  };

  // ===== ESCROW STATISTICS =====
  public type EscrowStats = {
    total_escrows: Nat;
    pending_escrows: Nat;
    completed_escrows: Nat;
    suspended_escrows: Nat;
    total_volume_locked: Nat;
    by_state: [(EscrowState, Nat)];
  };
};

import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  // ===== ESCROW ID =====
  public type EscrowId = Nat64;

  // ===== TOKEN TYPES =====
  public type TokenType = {
    #BTC;
    #SOL;
    #ETH;
    #ckETH;
    #ICP;
    #ckBTC;
    #FRADIUM;
  };

  // ===== RISK LEVELS =====
  public type RiskLevel = {
    #Low;
    #Medium;
    #High;
  };

  // ===== ESCROW STATES =====
  public type EscrowState = {
    #Pending;           // Just created, waiting for AI analysis
    #AwaitingAccept;    // AI passed, waiting for recipient to accept
    #Locked;            // Funds locked in escrow
    #Released;          // Funds released to recipient
    #Rejected;          // Rejected by recipient
    #Cancelled;         // Cancelled by sender
    #Expired;           // Time expired, auto-refunded
    #Suspended;         // Suspended due to high risk
  };

  // ===== AI RISK ANALYSIS =====
  public type AIRiskAnalysis = {
    risk_level: RiskLevel;
    risk_score: Nat; // 0-100
    analyzed_at: Time.Time;
    analysis_details: Text; // JSON string with detailed analysis
    is_suspicious: Bool;
  };

  // ===== ESCROW RECORD =====
  public type EscrowRecord = {
    escrow_id: EscrowId;
    sender: Principal;
    recipient: Principal;
    token_type: TokenType;
    amount: Nat;
    
    // Risk & Security
    risk_analysis: ?AIRiskAnalysis;
    
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
    recipient: Principal;
    token_type: TokenType;
    amount: Nat;
    duration_seconds: Nat64; // Time lock duration
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
    recipient: Principal;
    token_type: TokenType;
    amount: Nat;
    state: EscrowState;
    risk_level: ?RiskLevel;
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
    by_risk: [(RiskLevel, Nat)];
  };

  // ===== AI ANALYZER REQUEST =====
  public type AIAnalyzeRequest = {
    address: Text;
    chain: Text;
    token_type: TokenType;
  };

  // ===== AI ANALYZER RESPONSE =====
  public type AIAnalyzeResponse = {
    is_safe: Bool;
    risk_score: Nat;
    risk_level: RiskLevel;
    details: Text;
  };
};

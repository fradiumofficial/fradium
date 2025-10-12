// Swap Types
// Types untuk swap functionality dengan ICPSwap integration

module {
  // ===== SWAP REQUEST TYPES =====
  
  public type SwapQuoteRequest = {
    from_token : Text;           // Token symbol (ICP, FRADIUM, ckBTC, ckETH)
    to_token : Text;             // Token symbol (ICP, FRADIUM, ckBTC, ckETH)
    amount : Nat;                // Amount in smallest unit (e8s, e18s, etc)
  };

  public type SwapQuoteResponse = {
    rate : Float;                // Exchange rate
    estimated_output : Nat;     // Estimated output amount
    fee : Nat;                   // Swap fee
    price_impact : Float;        // Price impact percentage
    min_amount_out : Nat;        // Minimum amount out (slippage protection)
    valid_for : Nat;             // Quote validity in seconds
  };

  public type SwapExecuteRequest = {
    from_token : Text;           // Token symbol
    to_token : Text;             // Token symbol
    amount : Nat;                // Amount in smallest unit
    min_amount_out : Nat;        // Minimum amount out
    recipient : ?Principal;      // Recipient (null for self)
    deadline : ?Nat64;           // Transaction deadline
  };

  public type SwapExecuteResponse = {
    success : Bool;              // Success status
    transaction_id : ?Nat;       // Transaction ID (if successful)
    error : ?Text;               // Error message (if failed)
    redirect_url : ?Text;       // ICPSwap redirect URL
  };

  // ===== TOKEN INFO TYPES =====
  
  public type TokenInfo = {
    symbol : Text;               // Token symbol
    canister_id : Text;          // Canister ID
    decimals : Nat8;             // Token decimals
    name : Text;                 // Token name
  };

  public type SupportedPair = {
    from_token : Text;           // From token symbol
    to_token : Text;             // To token symbol
    from_canister_id : Text;    // From token canister ID
    to_canister_id : Text;      // To token canister ID
    active : Bool;               // Whether pair is active
  };

  // ===== SWAP HISTORY TYPES =====
  
  public type SwapHistory = {
    id : Nat;                    // Swap ID
    user : Principal;            // User principal
    from_token : Text;           // From token
    to_token : Text;             // To token
    from_amount : Nat;           // From amount
    to_amount : Nat;             // To amount
    fee : Nat;                   // Fee paid
    transaction_id : ?Nat;       // Transaction ID
    status : SwapStatus;         // Swap status
    created_at : Int;            // Creation timestamp
    completed_at : ?Int;          // Completion timestamp
  };

  public type SwapStatus = {
    #Pending;                    // Swap pending
    #Completed;                   // Swap completed
    #Failed;                     // Swap failed
    #Cancelled;                  // Swap cancelled
  };

  // ===== SWAP MODULE PARAMETERS =====
  
  public type SwapModuleParams = {
    // Token canister interfaces
    fradium_ledger : TokenCanisterInterface;
    icp_ledger : TokenCanisterInterface;
    ckbtc_ledger : TokenCanisterInterface;
    cketh_ledger : TokenCanisterInterface;
  };

  // ===== TOKEN CANISTER INTERFACE =====
  
  public type TokenCanisterInterface = actor { 
    icrc1_decimals : shared query () -> async Nat8;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
    icrc2_transfer_from : shared (TransferFromArgs) -> async TransferFromResult;
    icrc2_approve : shared (ApproveArgs) -> async ApproveResult;
  };

  // ===== ICRC TYPES =====
  
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

  type TransferFromArgs = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from : { owner : Principal; subaccount : ?Blob };
    memo : ?Blob;
    spender : { owner : Principal; subaccount : ?Blob };
    to : { owner : Principal; subaccount : ?Blob };
  };

  type TransferFromResult = {
    #Err : {
      #BadBurn : { min_burn_amount : Nat };
      #BadFee : { expected_fee : Nat };
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #GenericError : { error_code : Nat; message : Text };
      #InsufficientFunds : { balance : Nat };
      #InsufficientAllowance : { allowance : Nat };
      #TemporarilyUnavailable;
      #TooOld
    };
    #Ok : Nat;
  };

  type ApproveArgs = {
    amount : Nat;
    created_at_time : ?Nat64;
    expires_at : ?Nat64;
    fee : ?Nat;
    from_subaccount : ?Blob;
    spender : { owner : Principal; subaccount : ?Blob };
  };

  type ApproveResult = {
    #Err : {
      #BadFee : { expected_fee : Nat };
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #GenericError : { error_code : Nat; message : Text };
      #TemporarilyUnavailable;
      #TooOld
    };
    #Ok : Nat;
  };
};

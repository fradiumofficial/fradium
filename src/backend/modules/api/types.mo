import Principal "mo:base/Principal";
import Time "mo:base/Time";

module {
    // API Token Status
    public type TokenStatus = {
        #active;
        #revoked;
        #expired;
    };

    // API Token Structure
    public type ApiToken = {
        id: Text;
        name: Text;
        token: Text;
        principal: Principal;
        created: Time.Time;
        status: TokenStatus;
    };

    // Request to create new token
    public type CreateTokenRequest = {
        name: Text;
    };

    // Response for token creation
    public type CreateTokenResponse = {
        #ok: ApiToken;
        #err: Text;
    };

    // Response for getting tokens
    public type GetTokensResponse = {
        #ok: [ApiToken];
        #err: Text;
    };

    // Response for token operations
    public type TokenOperationResponse = {
        #ok: Text;
        #err: Text;
    };

    // Request to regenerate token
    public type RegenerateTokenRequest = {
        tokenId: Text;
    };

    // Request to revoke token
    public type RevokeTokenRequest = {
        tokenId: Text;
    };

  // ===== API USAGE TYPES =====
  public type ApiUsageRecord = {
    route : Text;
    cost : Nat;
    model : Text;
    status : Text; // "success" or "failed"
    reason : ?Text; // null for success, error message for failure
    at : Time.Time;
  };

  public type ApiCreditsStats = {
    remaining_e8s : Nat;
    used_e8s : Nat;
  };

  public type ApiApprovalRecord = {
    amount_e8s : Nat;
    metadata : Text;
    at : Time.Time;
  };

  public type ApiCreditsOverview = {
    total_approved_e8s : Nat;
    used_e8s : Nat;
    remaining_e8s : Nat;
  };
};

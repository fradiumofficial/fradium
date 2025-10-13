import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
  public type TokenType = {
    #ICP;
    #Fradium;
    #ckBTC;
    #ckETH;
    #BTC;
    #ETH;
    #SOL;
  };

  public type PaymentStatus = {
    #Active;
    #Completed;
    #Expired;
    #Cancelled;
  };

  public type CreatorAddresses = {
    bitcoin: Text;
    ethereum: Text;
    solana: Text;
  };

  public type PaymentLink = {
    id: Text;
    creator: Principal;
    payer: ?Principal;
    amount: Nat;
    token: TokenType;
    status: PaymentStatus;
    created_at: Time.Time;
    expires_at: Time.Time;
    creator_addresses: ?CreatorAddresses;
  };

  public type PaymentLinkPublic = {
    creator: Principal;
    creator_addresses: ?CreatorAddresses;
    amount: Nat;
    token: TokenType;
    status: PaymentStatus;
    created_at: Time.Time;
    expires_at: Time.Time;
  };

  public type CreatePaymentLinkParams = {
    amount: Nat;
    duration_nanos: Nat;
    token: TokenType;
    custom_id: ?Text;
  };
}
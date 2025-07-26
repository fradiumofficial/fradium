import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";

module {
  public type Result<T, E> = { #Ok : T; #Err : E };

  public type Voter = {
    voter: Principal;
    vote: Bool;
    vote_weight: Nat; // Bobot vote = stake amount
  };

  public type ReportRole = {
    #Reporter;
    #Voter: Bool; // true = vote yes, false = vote no
  };

  public type Report = {
    report_id: ReportId;
    reporter: Principal;
    chain: Text;
    address: Text;
    category: Text;
    description: Text;
    evidence: [Text];
    url: ?Text;
    votes_yes: Nat;
    votes_no: Nat;
    voted_by: [Voter];
    vote_deadline: Time.Time;
    created_at: Time.Time;
  };

  public type StakeRecord = {
    staker: Principal;
    amount: Nat;
    staked_at: Time.Time;
    role: ReportRole;
    report_id: ReportId;
    unstaked_at: ?Time.Time;
  };

  public type Network = {
    #Ethereum;
    #Solana;
    #Bitcoin;
    #ICP;
  };

  public type TokenType = {
    #Bitcoin;
    #Ethereum;
    #Solana;
    #Fradium;
    #Unknown;
  };

  public type WalletAddress = {
    network: Network;
    token_type: TokenType;
    address: Text;
  };

  public type UserWallet = {
    principal: Principal;
    addresses: [WalletAddress];
    created_at: Time.Time;
  };

  public type AnalyzeHistoryType = {
    #CommunityVote;
    #AIAnalysis;
  };

  public type AnalyzeHistory = {
    address: Text;
    is_safe: Bool;
    analyzed_type: AnalyzeHistoryType;
    token_type: TokenType;
    created_at: Time.Time;
    metadata: Text;
  };

  public type ChainType = {
    #Bitcoin;
    #Ethereum;
    #Solana;
  };

  public type ChainDetails = {
    #Bitcoin : {
      txid : Text;
      from_address : ?Text;
      to_address : Text;
      fee_satoshi : ?Nat;
      block_height : ?Nat;
    };
    #Ethereum : {
      tx_hash : Text;
      from : Text;
      to : Text;
      gas_fee_wei : Nat;
      nonce : Nat;
      block_number : ?Nat;
    };
    #Solana : {
      signature : Text;
      slot : ?Nat;
      sender : Text;
      recipient : Text;
      lamports : Nat;
    };
  };

  public type TransactionType = {
    #Send;
    #Receive;
  };

  public type TransactionStatus = {
    #Pending;
    #Success;
    #Failed;
  };

  public type TransactionEntry = {
    chain : ChainType;
    direction : TransactionType;
    amount : Nat;
    timestamp : Nat64;
    details : ChainDetails;
    note : ?Text;
    status : TransactionStatus;
  };

  public type ReportId = Nat32;

  public type GetMyReportsParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    unstaked_at : ?Time.Time;
  };

  public type GetMyVotesParams = Report and {
    stake_amount : Nat;
    reward : Nat;
    vote_type : Bool;
    unstaked_at : ?Time.Time;
  };

  public type CreateReportParams = {
    chain : Text;
    address : Text;
    category : Text;
    description : Text;
    url : ?Text;
    evidence : [Text];
    stake_amount : Nat;
  };

  public type VoteReportParams = {
    stake_amount : Nat;
    vote_type : Bool;
    report_id : ReportId;
  };

  public type GetAnalyzeAddressResult = {
    is_safe: Bool;
    report: ?Report;
  };

  public type CreateAnalyzeHistoryParams = {
    address: Text;
    is_safe: Bool;
    analyzed_type: AnalyzeHistoryType;
    metadata: Text;
    token_type: TokenType;
  };

  public type CreateWalletParams = {
    addresses: [WalletAddress];
  };

  public type CreateTransactionHistoryParams = {
    chain : ChainType;
    direction : TransactionType;
    amount : Nat;
    timestamp : Nat64;
    details : ChainDetails;
    note : ?Text;
  };
};
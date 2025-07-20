import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat32 "mo:base/Nat32";
import Nat8 "mo:base/Nat8";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Text "mo:base/Text";
import Bool "mo:base/Bool";
import Blob "mo:base/Blob";
import Nat64 "mo:base/Nat64";

import TokenCanister "canister:token";
import BitcoinCanister "canister:bitcoin";

actor Fradium {
  // Vote deadline in nanoseconds (1 week = 7 * 24 * 60 * 60 * 1_000_000_000)
  private let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;
  
  // Faucet claim cooldown in nanoseconds (48 hours = 48 * 60 * 60 * 1_000_000_000)
  private let FAUCET_COOLDOWN_DURATION : Time.Time = 172_800_000_000_000;
  
  // Unstake voter reward percentage (10% = 1/10)
  private let UNSTAKE_VOTER_REWARD_PERCENTAGE : Nat = 10;
  
  // Unstake created report reward percentage (25% = 1/4)
  private let UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE : Nat = 4;

  // Minimum quorum for vote validation (minimum number of voters required)
  private let MINIMUM_QUORUM : Nat = 1;

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
  // ===== END REPORT =====

  // ===== STAKE =====
  public type StakeRecord = {
    staker: Principal;
    amount: Nat;
    staked_at: Time.Time;
    role: ReportRole;
    report_id: ReportId;
    unstaked_at: ?Time.Time;
  };
  // ===== END STAKE =====

  // ===== WALLET APP =====
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
  // ===== END WALLET APP =====

  // ===== ANALYZE ADDRESS =====
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
  // ===== END ANALYZE ADDRESS =====

  // ===== TRANSACTION HISTORY =====
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
  // ===== END TRANSACTION HISTORY =====

  public type ReportId = Nat32;
  
  stable var reportsStorage : [(Principal, [Report])] = [];
  stable var faucetClaimsStorage : [(Principal, Time.Time)] = [];
  stable var stakeRecordsStorage : [(Principal, StakeRecord)] = [];
  stable var userWalletsStorage : [(Principal, UserWallet)] = [];
  stable var analyzeAddressStorage : [(Principal, [AnalyzeHistory])] = [];
  stable var transactionHistoryStorage : [(Principal, [TransactionEntry])] = [];
  stable var analyzeHistoryStorage : [(Principal, [AnalyzeHistory])] = [];

  var reportStore = Map.HashMap<Principal, [Report]>(0, Principal.equal, Principal.hash);
  var faucetClaimsStore = Map.HashMap<Principal, Time.Time>(0, Principal.equal, Principal.hash);
  var stakeRecordsStore = Map.HashMap<Principal, StakeRecord>(0, Principal.equal, Principal.hash);
  var userWalletsStore = Map.HashMap<Principal, UserWallet>(0, Principal.equal, Principal.hash);
  var analyzeAddressStore = Map.HashMap<Principal, [AnalyzeHistory]>(0, Principal.equal, Principal.hash);
  var transactionHistoryStore = Map.HashMap<Principal, [TransactionEntry]>(0, Principal.equal, Principal.hash);
  var analyzeHistoryStore = Map.HashMap<Principal, [AnalyzeHistory]>(0, Principal.equal, Principal.hash);

  private stable var next_report_id : ReportId = 0;

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    // Save all data to stable storage
    reportsStorage := Iter.toArray(reportStore.entries());
    faucetClaimsStorage := Iter.toArray(faucetClaimsStore.entries());
    stakeRecordsStorage := Iter.toArray(stakeRecordsStore.entries());
    userWalletsStorage := Iter.toArray(userWalletsStore.entries());
    analyzeAddressStorage := Iter.toArray(analyzeAddressStore.entries());
    transactionHistoryStorage := Iter.toArray(transactionHistoryStore.entries());
    analyzeHistoryStorage := Iter.toArray(analyzeHistoryStore.entries());
  };

  system func postupgrade() {
    // Restore data from stable storage
    reportStore := Map.HashMap<Principal, [Report]>(reportsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in reportsStorage.vals()) {
        reportStore.put(key, value);
    };

    faucetClaimsStore := Map.HashMap<Principal, Time.Time>(faucetClaimsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in faucetClaimsStorage.vals()) {
        faucetClaimsStore.put(key, value);
    };

    stakeRecordsStore := Map.HashMap<Principal, StakeRecord>(stakeRecordsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in stakeRecordsStorage.vals()) {
        stakeRecordsStore.put(key, value);
    };

    userWalletsStore := Map.HashMap<Principal, UserWallet>(userWalletsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in userWalletsStorage.vals()) {
        userWalletsStore.put(key, value);
    };

    analyzeAddressStore := Map.HashMap<Principal, [AnalyzeHistory]>(analyzeAddressStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeAddressStorage.vals()) {
        analyzeAddressStore.put(key, value);
    };

    transactionHistoryStore := Map.HashMap<Principal, [TransactionEntry]>(transactionHistoryStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in transactionHistoryStorage.vals()) {
        transactionHistoryStore.put(key, value);
    };

    analyzeHistoryStore := Map.HashMap<Principal, [AnalyzeHistory]>(analyzeHistoryStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeHistoryStorage.vals()) {
        analyzeHistoryStore.put(key, value);
    };
  };

  // ... rest of the functions remain the same ...
} 
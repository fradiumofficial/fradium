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
import Types "types";
import FaucetModule "modules/faucet";
import CommunityModule "modules/community";
import WalletModule "modules/wallet";
import AnalyzeModule "modules/analyze";
import TransactionModule "modules/transaction";

actor Fradium {
  // ===== TYPE DEFINITIONS =====
  type Result<T, E> = { #Ok : T; #Err : E };

  // ===== STABLE STORAGE =====
  stable var reportsStorage : [(Principal, [Types.Report])] = [];
  stable var faucetClaimsStorage : [(Principal, Time.Time)] = [];
  stable var stakeRecordsStorage : [(Principal, Types.StakeRecord)] = [];
  stable var userWalletsStorage : [(Principal, Types.UserWallet)] = [];
  stable var analyzeAddressStorage : [(Principal, [Types.AnalyzeHistory])] = [];
  stable var transactionHistoryStorage : [(Principal, [Types.TransactionEntry])] = [];
  stable var analyzeHistoryStorage : [(Principal, [Types.AnalyzeHistory])] = [];

  // ===== MUTABLE STORAGE =====
  var reportStore = Map.HashMap<Principal, [Types.Report]>(0, Principal.equal, Principal.hash);
  var faucetClaimsStore = Map.HashMap<Principal, Time.Time>(0, Principal.equal, Principal.hash);
  var stakeRecordsStore = Map.HashMap<Principal, Types.StakeRecord>(0, Principal.equal, Principal.hash);
  var userWalletsStore = Map.HashMap<Principal, Types.UserWallet>(0, Principal.equal, Principal.hash);
  var analyzeAddressStore = Map.HashMap<Principal, [Types.AnalyzeHistory]>(0, Principal.equal, Principal.hash);
  var transactionHistoryStore = Map.HashMap<Principal, [Types.TransactionEntry]>(0, Principal.equal, Principal.hash);
  var analyzeHistoryStore = Map.HashMap<Principal, [Types.AnalyzeHistory]>(0, Principal.equal, Principal.hash);

  private stable var next_report_id : Types.ReportId = 0;

  // ===== MODULE INSTANCES =====
  private var faucetModule = FaucetModule.FaucetModule(faucetClaimsStore);
  private var communityModule = CommunityModule.CommunityModule(reportStore, stakeRecordsStore, next_report_id, Principal.fromActor(Fradium));
  private var walletModule = WalletModule.WalletModule(userWalletsStore);
  private var analyzeModule = AnalyzeModule.AnalyzeModule(analyzeAddressStore, reportStore);
  private var transactionModule = TransactionModule.TransactionModule(transactionHistoryStore, userWalletsStore);

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
    reportStore := Map.HashMap<Principal, [Types.Report]>(reportsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in reportsStorage.vals()) {
        reportStore.put(key, value);
    };

    faucetClaimsStore := Map.HashMap<Principal, Time.Time>(faucetClaimsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in faucetClaimsStorage.vals()) {
        faucetClaimsStore.put(key, value);
    };

    stakeRecordsStore := Map.HashMap<Principal, Types.StakeRecord>(stakeRecordsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in stakeRecordsStorage.vals()) {
        stakeRecordsStore.put(key, value);
    };

    userWalletsStore := Map.HashMap<Principal, Types.UserWallet>(userWalletsStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in userWalletsStorage.vals()) {
        userWalletsStore.put(key, value);
    };

    analyzeAddressStore := Map.HashMap<Principal, [Types.AnalyzeHistory]>(analyzeAddressStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeAddressStorage.vals()) {
        analyzeAddressStore.put(key, value);
    };

    transactionHistoryStore := Map.HashMap<Principal, [Types.TransactionEntry]>(transactionHistoryStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in transactionHistoryStorage.vals()) {
        transactionHistoryStore.put(key, value);
    };

    analyzeHistoryStore := Map.HashMap<Principal, [Types.AnalyzeHistory]>(analyzeHistoryStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeHistoryStorage.vals()) {
        analyzeHistoryStore.put(key, value);
    };

    // Reinitialize modules with restored data
    faucetModule := FaucetModule.FaucetModule(faucetClaimsStore);
    communityModule := CommunityModule.CommunityModule(reportStore, stakeRecordsStore, next_report_id, Principal.fromActor(Fradium));
    walletModule := WalletModule.WalletModule(userWalletsStore);
    analyzeModule := AnalyzeModule.AnalyzeModule(analyzeAddressStore, reportStore);
    transactionModule := TransactionModule.TransactionModule(transactionHistoryStore, userWalletsStore);
  };

  // ===== FAUCET FUNCTIONS =====
  public shared({ caller }) func claim_faucet() : async Result<Text, Text> {
    await faucetModule.claimFaucet(caller);
  };

  public shared({ caller }) func check_faucet_claim() : async Result<Text, Text> {
    await faucetModule.checkFaucetClaim(caller);
  };

  // ===== COMMUNITY REPORT & STAKE FUNCTIONS =====
  public query func get_reports() : async Types.Result<[Types.Report], Text> {
    communityModule.getReports();
  };

  public query func get_report(report_id : Types.ReportId) : async Types.Result<Types.Report, Text> {
    communityModule.getReport(report_id);
  };

  public shared({ caller }) func get_my_reports() : async Types.Result<[Types.GetMyReportsParams], Text> {
    communityModule.getMyReports(caller);
  };

  public shared({ caller }) func get_my_votes() : async Types.Result<[Types.GetMyVotesParams], Text> {
    communityModule.getMyVotes(caller);
  };

  public shared({ caller }) func create_report(params : Types.CreateReportParams) : async Types.Result<Text, Text> {
    await communityModule.createReport(caller, params);
  };

  public shared({ caller }) func vote_report(params : Types.VoteReportParams) : async Types.Result<Text, Text> {
    await communityModule.voteReport(caller, params);
  };

  public shared({ caller }) func unstake_voted_report(report_id : Types.ReportId) : async Result<Text, Text> {
    await communityModule.unstakeVotedReport(caller, report_id);
  };

  public shared({ caller }) func unstake_created_report(report_id : Types.ReportId) : async Result<Text, Text> {
    await communityModule.unstakeCreatedReport(caller, report_id);
  };

  // ===== WALLET APP =====
  public shared({ caller }) func create_wallet(params : Types.CreateWalletParams) : async Types.Result<Text, Text> {
    walletModule.createWallet(caller, params);
  };

  public shared({ caller }) func get_wallet() : async Types.Result<Types.UserWallet, Text> {
    walletModule.getWallet(caller);
  };

  // ===== ANALYZE ADDRESS =====
  public shared({ caller }) func analyze_address(address : Text) : async Types.Result<Types.GetAnalyzeAddressResult, Text> {
    analyzeModule.analyzeAddress(caller, address);
  };

  public shared({ caller }) func create_analyze_history(params : Types.CreateAnalyzeHistoryParams) : async Types.Result<[Types.AnalyzeHistory], Text> {
    analyzeModule.createAnalyzeHistory(caller, params);
  };

  public shared({ caller }) func get_analyze_history() : async Types.Result<[Types.AnalyzeHistory], Text> {
    analyzeModule.getAnalyzeHistory(caller);
  };

  // ===== TRANSACTION HISTORY =====
  public shared({ caller }) func create_transaction_history(params : Types.CreateTransactionHistoryParams) : async Types.Result<Text, Text> {
    transactionModule.createTransactionHistory(caller, params);
  };

  public shared({ caller }) func get_transaction_history() : async Types.Result<[Types.TransactionEntry], Text> {
    await transactionModule.getTransactionHistory(caller);
  };

  // ===== ADMIN - DEBUG ONLY - DELETE LATER =====
  public func admin_change_report_deadline(report_id : Types.ReportId, new_deadline : Time.Time) : async Result<Text, Text> {
    // Find the report
    var targetReport : ?Types.Report = null;
    var reportOwner : ?Principal = null;
    
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.report_id == report_id) {
          targetReport := ?report;
          reportOwner := ?principal;
        };
      };
    };

    switch (targetReport) {
      case null {
        return #Err("Report not found");
      };
      case (?report) {
        // Update the report with new deadline
        let updatedReport : Types.Report = {
          report_id = report.report_id;
          reporter = report.reporter;
          chain = report.chain;
          address = report.address;
          category = report.category;
          description = report.description;
          evidence = report.evidence;
          url = report.url;
          votes_yes = report.votes_yes;
          votes_no = report.votes_no;
          voted_by = report.voted_by;
          vote_deadline = new_deadline;
          created_at = report.created_at;
        };

        // Update the report in storage
        switch (reportOwner) {
          case (?owner) {
            let existingReports = switch (reportStore.get(owner)) {
              case (?reports) { reports };
              case null { [] };
            };

            let updatedReports = Array.map(existingReports, func (r : Types.Report) : Types.Report {
              if (r.report_id == report.report_id) {
                updatedReport
              } else {
                r
              }
            });

            reportStore.put(owner, updatedReports);
            return #Ok("Report deadline updated successfully");
          };
          case null {
            return #Err("Report owner not found");
          };
        };
      };
    };
  };

  public func admin_delete_report(report_id : Types.ReportId) : async Result<Text, Text> {
    // Find the report
    var targetReport : ?Types.Report = null;
    var reportOwner : ?Principal = null;
    
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.report_id == report_id) {
          targetReport := ?report;
          reportOwner := ?principal;
        };
      };
    };

    switch (targetReport) {
      case null {
        return #Err("Report not found");
      };
      case (?report) {
        // Delete the report from storage
        switch (reportOwner) {
          case (?owner) {
            let existingReports = switch (reportStore.get(owner)) {
              case (?reports) { reports };
              case null { [] };
            };

            let filteredReports = Array.filter(existingReports, func (r : Types.Report) : Bool {
              r.report_id != report.report_id
            });

            if (filteredReports.size() == 0) {
              reportStore.delete(owner);
            } else {
              reportStore.put(owner, filteredReports);
            };

            // Also delete associated stake records for this report
            var stakeRecordsToDelete : [Principal] = [];
            
            for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
              if (stakeRecord.report_id == report_id) {
                stakeRecordsToDelete := Array.append(stakeRecordsToDelete, [staker]);
              };
            };

            // Delete stake records
            for (staker in stakeRecordsToDelete.vals()) {
              stakeRecordsStore.delete(staker);
            };

            return #Ok("Report and associated stake records deleted successfully");
          };
          case null {
            return #Err("Report owner not found");
          };
        };
      };
    };
  };

  public func admin_delete_wallet(principal : Principal) : async Result<Text, Text> {
    switch (userWalletsStore.get(principal)) {
      case (?_) {
        userWalletsStore.delete(principal);
        return #Ok("Wallet deleted successfully");
      };
      case null {
        return #Err("Wallet not found");
      };
    };
  };
};

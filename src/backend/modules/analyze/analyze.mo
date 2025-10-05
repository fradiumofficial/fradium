import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

import ParentTypes "../../types";
import CommunityTypes "../community/types";
import AnalyzeTypes "types";

module {
  public class AnalyzeModule() {
    // Storage variables
    private var analyzeAddressStorage : [(Principal, [AnalyzeTypes.AnalyzeHistory])] = [];
    private var analyzeHistoryStorage : [(Principal, [AnalyzeTypes.AnalyzeHistory])] = [];
    
    private var analyzeAddressStore = Map.HashMap<Principal, [AnalyzeTypes.AnalyzeHistory]>(0, Principal.equal, Principal.hash);
    private var analyzeHistoryStore = Map.HashMap<Principal, [AnalyzeTypes.AnalyzeHistory]>(0, Principal.equal, Principal.hash);

    // Minimum quorum constant
    private let MINIMUM_QUORUM : Nat = 1;

    // System hooks for upgrade
    public func preupgrade() {
      analyzeAddressStorage := Iter.toArray(analyzeAddressStore.entries());
      analyzeHistoryStorage := Iter.toArray(analyzeHistoryStore.entries());
    };

    public func postupgrade() {
      analyzeAddressStore := Map.HashMap<Principal, [AnalyzeTypes.AnalyzeHistory]>(analyzeAddressStorage.size(), Principal.equal, Principal.hash);
      for ((key, value) in analyzeAddressStorage.vals()) {
        analyzeAddressStore.put(key, value);
      };

      analyzeHistoryStore := Map.HashMap<Principal, [AnalyzeTypes.AnalyzeHistory]>(analyzeHistoryStorage.size(), Principal.equal, Principal.hash);
      for ((key, value) in analyzeHistoryStorage.vals()) {
        analyzeHistoryStore.put(key, value);
      };
    };

    // Helper function to check if vote is correct
    private func is_vote_correct(report : CommunityTypes.Report, vote_type : Bool) : Bool {
      let totalVoters = report.voted_by.size();
      if (totalVoters < MINIMUM_QUORUM) {
        return false;
      };

      var totalYesWeight : Nat = 0;
      var totalNoWeight : Nat = 0;
      
      for (voter in report.voted_by.vals()) {
        if (voter.vote == true) {
          totalYesWeight += voter.vote_weight;
        } else {
          totalNoWeight += voter.vote_weight;
        };
      };
      
      let isYesMajority = totalYesWeight > totalNoWeight;
      
      let isVoteCorrect = if (isYesMajority) {
        vote_type == true
      } else {
        vote_type == false
      };
      
      return isVoteCorrect;
    };

    // Public functions
    public func analyze_address(
      caller : Principal, 
      address : Text, 
      reportStore : Map.HashMap<Principal, [CommunityTypes.Report]>
    ) : ParentTypes.Result<AnalyzeTypes.GetAnalyzeAddressResult, Text> {
      var found : Bool = false;
      var isUnsafe : Bool = false;
      var foundReport : ?CommunityTypes.Report = null;
      
      for ((_, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (report.address == address) {
            found := true;
            foundReport := ?report;
            
            let currentTime = Time.now();
            if (currentTime > report.vote_deadline) {
              isUnsafe := is_vote_correct(report, true);
            } else {
              isUnsafe := false;
            };
          };
        };
      };
      
      if (not found) {
        return #Ok({
          is_safe = true;
          report = null;
        });
      } else {
        let isSafe = not isUnsafe;
        
        let historyEntry : AnalyzeTypes.AnalyzeHistory = {
          address = address;
          is_safe = isSafe;
          analyzed_type = #CommunityVote;
          created_at = Time.now();
          metadata = debug_show(foundReport);
          token_type = "Bitcoin";
        };
          
        let existingHistory = switch (analyzeAddressStore.get(caller)) {
          case (?history) { history };
          case null { [] };
        };
          
        let updatedHistory = Array.append(existingHistory, [historyEntry]);
        analyzeAddressStore.put(caller, updatedHistory);

        return #Ok({
          is_safe = isSafe;
          report = foundReport;
        });
      };
    };

    public func create_analyze_history(
      caller : Principal, 
      params : AnalyzeTypes.CreateAnalyzeHistoryParams
    ) : ParentTypes.Result<[AnalyzeTypes.AnalyzeHistory], Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };
      
      let historyEntry : AnalyzeTypes.AnalyzeHistory = {
        address = params.address;
        is_safe = params.is_safe;
        analyzed_type = params.analyzed_type;
        created_at = Time.now();
        metadata = params.metadata;
        token_type = params.token_type;
      };
      
      let existingHistory = switch (analyzeAddressStore.get(caller)) {
        case (?history) { history };
        case null { [] };
      };
      
      let updatedHistory = Array.append(existingHistory, [historyEntry]);
      analyzeAddressStore.put(caller, updatedHistory);
      
      return #Ok(updatedHistory);
    };

    public func get_analyze_history(
      caller : Principal, 
      offset : Nat, 
      limit : Nat
    ) : ParentTypes.Result<[AnalyzeTypes.AnalyzeHistory], Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      switch (analyzeAddressStore.get(caller)) {
        case (?history) {
          let totalCount = history.size();
          let startIndex = offset;
          let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
          
          let paginatedHistory = Array.tabulate<AnalyzeTypes.AnalyzeHistory>(
            endIndex - startIndex,
            func(i) = history[startIndex + i]
          );
          
          return #Ok(paginatedHistory);
        };
        case null {
          return #Ok([]);
        };
      };
    };

    public func get_analyze_history_count(caller : Principal) : ParentTypes.Result<Nat, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      switch (analyzeAddressStore.get(caller)) {
        case (?history) {
          return #Ok(history.size());
        };
        case null {
          return #Ok(0);
        };
      };
    };

    // Getter for report store (for system hooks)
    public func get_analyze_address_storage() : [(Principal, [AnalyzeTypes.AnalyzeHistory])] {
      return analyzeAddressStorage;
    };

    public func get_analyze_history_storage() : [(Principal, [AnalyzeTypes.AnalyzeHistory])] {
      return analyzeHistoryStorage;
    };

    public func set_analyze_address_storage(storage : [(Principal, [AnalyzeTypes.AnalyzeHistory])]) {
      analyzeAddressStorage := storage;
    };

    public func set_analyze_history_storage(storage : [(Principal, [AnalyzeTypes.AnalyzeHistory])]) {
      analyzeHistoryStorage := storage;
    };
  };
};

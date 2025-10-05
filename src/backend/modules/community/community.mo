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
import Nat64 "mo:base/Nat64";

import ParentTypes "../../types";
import CommunityTypes "types";

module {
  public type TokenCanisterInterface = actor { 
    icrc1_decimals : shared query () -> async Nat8;
    icrc1_transfer : shared (TransferArg) -> async TransferResult;
    icrc2_transfer_from : shared (TransferFromArgs) -> async TransferFromResult;
  };

  type TransferArg = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from_subaccount : ?Blob;
    memo : ?Blob;
    to : { owner : Principal; subaccount : ?Blob };
  };

  type TransferFromArgs = {
    amount : Nat;
    created_at_time : ?Nat64;
    fee : ?Nat;
    from : { owner : Principal; subaccount : ?Blob };
    memo : ?Blob;
    spender_subaccount : ?Blob;
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

  type TransferFromResult = {
    #Err : {
      #BadBurn : { min_burn_amount : Nat };
      #BadFee : { expected_fee : Nat };
      #CreatedInFuture : { ledger_time : Nat64 };
      #Duplicate : { duplicate_of : Nat };
      #GenericError : { error_code : Nat; message : Text };
      #InsufficientAllowance : { allowance : Nat };
      #InsufficientFunds : { balance : Nat };
      #TemporarilyUnavailable;
      #TooOld
    };
    #Ok : Nat;
  };

  public class CommunityModule(
    actorPrincipal : Principal,
    tokenCanister : TokenCanisterInterface
  ) {
    // Constants
    private let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;
    private let UNSTAKE_VOTER_REWARD_PERCENTAGE : Nat = 10;
    private let UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE : Nat = 4;
    private let MINIMUM_QUORUM : Nat = 1;

    // Storage
    private var reportsStorage : [(Principal, [CommunityTypes.Report])] = [];
    private var stakeRecordsStorage : [(Principal, CommunityTypes.StakeRecord)] = [];
    
    private var reportStore = Map.HashMap<Principal, [CommunityTypes.Report]>(0, Principal.equal, Principal.hash);
    private var stakeRecordsStore = Map.HashMap<Principal, CommunityTypes.StakeRecord>(0, Principal.equal, Principal.hash);
    
    private var next_report_id : CommunityTypes.ReportId = 0;

    // System hooks
    public func preupgrade() {
      reportsStorage := Iter.toArray(reportStore.entries());
      stakeRecordsStorage := Iter.toArray(stakeRecordsStore.entries());
    };

    public func postupgrade() {
      reportStore := Map.HashMap<Principal, [CommunityTypes.Report]>(reportsStorage.size(), Principal.equal, Principal.hash);
      for ((key, value) in reportsStorage.vals()) {
        reportStore.put(key, value);
      };

      stakeRecordsStore := Map.HashMap<Principal, CommunityTypes.StakeRecord>(stakeRecordsStorage.size(), Principal.equal, Principal.hash);
      for ((key, value) in stakeRecordsStorage.vals()) {
        stakeRecordsStore.put(key, value);
      };
    };

    // Helper functions
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

    private func calculate_reporter_reward(report : CommunityTypes.Report, stakeAmount : Nat) : Nat {
      let isReportValidated = is_vote_correct(report, true);
      let rewardAmount = if (isReportValidated) {
        stakeAmount / UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE;
      } else {
        0;
      };
      return rewardAmount;
    };

    private func calculate_voter_reward(report : CommunityTypes.Report, voteType : Bool, stakeAmount : Nat) : Nat {
      let isVoteCorrect = is_vote_correct(report, voteType);
      let rewardAmount = if (isVoteCorrect) {
        stakeAmount / UNSTAKE_VOTER_REWARD_PERCENTAGE;
      } else {
        0;
      };
      return rewardAmount;
    };

    private func calculate_activity_score(caller : Principal) : Nat {
      var valid_votes : Nat = 0;
      var valid_reports : Nat = 0;
      
      for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
        if (staker == caller) {
          switch (stakeRecord.role) {
            case (#Voter(vote_type)) {
              for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                  if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                    let currentTime = Time.now();
                    if (currentTime > report.vote_deadline) {
                      let totalVotes = report.votes_yes + report.votes_no;
                      let yesPercentage = if (totalVotes > 0) {
                        (report.votes_yes * 100) / totalVotes
                      } else {
                        0
                      };
                      
                      let isVoteCorrect = if (yesPercentage >= 75) {
                        vote_type == true
                      } else {
                        vote_type == false
                      };
                      
                      if (isVoteCorrect) {
                        valid_votes += 1;
                      };
                    };
                  };
                };
              };
            };
            case (#Reporter) {
              for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                  if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                    let currentTime = Time.now();
                    if (currentTime > report.vote_deadline) {
                      let totalVotes = report.votes_yes + report.votes_no;
                      let yesPercentage = if (totalVotes > 0) {
                        (report.votes_yes * 100) / totalVotes
                      } else {
                        0
                      };
                      
                      if (yesPercentage >= 75) {
                        valid_reports += 1;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
      
      let base : Nat = 1000;
      let vote_weight : Nat = valid_votes * 20;
      let report_weight : Nat = valid_reports * 50;
      let activity_factor : Nat = base + vote_weight + report_weight;
      
      return activity_factor;
    };

    // Public functions
    public func get_reports() : ParentTypes.Result<[CommunityTypes.Report], Text> {
      var allReports : [CommunityTypes.Report] = [];
      
      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          allReports := Array.append(allReports, [report]);
        };
      };
      
      return #Ok(allReports);
    };

    public func get_report(report_id : CommunityTypes.ReportId) : ParentTypes.Result<CommunityTypes.Report, Text> {
      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (report.report_id == report_id) {
            return #Ok(report);
          };
        };
      };
      return #Err("Report not found");
    };

    public func get_my_reports(caller : Principal) : ParentTypes.Result<[CommunityTypes.GetMyReportsParams], Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      switch (reportStore.get(caller)) {
        case (?reports) {
          let reportsWithStakeInfo = Array.map(reports, func (report : CommunityTypes.Report) : CommunityTypes.GetMyReportsParams {
            var stakeAmount : Nat = 0;
            var reward : Nat = 0;
            var unstakedAt : ?Time.Time = null;
            
            switch (stakeRecordsStore.get(caller)) {
              case (?stakeRecord) {
                if (stakeRecord.report_id == report.report_id) {
                  stakeAmount := stakeRecord.amount;
                  reward := calculate_reporter_reward(report, stakeRecord.amount);
                  unstakedAt := stakeRecord.unstaked_at;
                };
              };
              case null { };
            };
            
            {
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
              vote_deadline = report.vote_deadline;
              created_at = report.created_at;
              stake_amount = stakeAmount;
              reward = reward;
              unstaked_at = unstakedAt;
            }
          });
          
          return #Ok(reportsWithStakeInfo);
        };
        case null {
          return #Ok([]);
        };
      };
    };

    public func get_my_votes(caller : Principal) : ParentTypes.Result<[CommunityTypes.GetMyVotesParams], Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      var votedReports : [CommunityTypes.GetMyVotesParams] = [];
      
      for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
        if (staker == caller) {
          switch (stakeRecord.role) {
            case (#Voter(vote_type)) {
              for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                  if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                    let reward = calculate_voter_reward(report, vote_type, stakeRecord.amount);
                    
                    let voteReport : CommunityTypes.GetMyVotesParams = {
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
                      vote_deadline = report.vote_deadline;
                      created_at = report.created_at;
                      stake_amount = stakeRecord.amount;
                      reward = reward;
                      vote_type = vote_type;
                      unstaked_at = stakeRecord.unstaked_at;
                    };
                    
                    votedReports := Array.append(votedReports, [voteReport]);
                  };
                };
              };
            };
            case (#Reporter) { };
          };
        };
      };
      
      return #Ok(votedReports);
    };

    public func create_report(caller : Principal, params : CommunityTypes.CreateReportParams) : async ParentTypes.Result<Text, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (report.address == params.address and report.chain == params.chain) {
            return #Err("Address " # params.address # " has already been reported. Please check existing reports.");
          };
        };
      };

      let minimum_stake_amount = 5 * (10 ** Nat8.toNat(await tokenCanister.icrc1_decimals()));

      if (params.stake_amount < minimum_stake_amount) {
        return #Err("Minimum stake is 5 FUM tokens");
      };

      let transferArgs : TransferFromArgs = {
        spender_subaccount = null;
        from = {
          owner = caller;
          subaccount = null;
        };
        to = {
          owner = actorPrincipal;
          subaccount = null;
        };
        amount = params.stake_amount;
        fee = null;
        memo = ?Text.encodeUtf8("Report Stake");
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
      };

      let transferResult = await tokenCanister.icrc2_transfer_from(transferArgs);
      switch (transferResult) {
        case (#Err(err)) {
          return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) { };  
      };

      let new_report_id = next_report_id;
      next_report_id += 1;

      let stakeRecord : CommunityTypes.StakeRecord = {
        staker = caller;
        amount = params.stake_amount;
        staked_at = Time.now();
        role = #Reporter;
        report_id = new_report_id;
        unstaked_at = null;
      };
      stakeRecordsStore.put(caller, stakeRecord);

      let new_report : CommunityTypes.Report = {
        report_id = new_report_id;
        reporter = caller;
        chain = params.chain;
        address = params.address;
        category = params.category;
        description = params.description;
        evidence = params.evidence;
        url = params.url;
        votes_yes = 0;
        votes_no = 0;
        voted_by = [];
        vote_deadline = Time.now() + VOTE_DEADLINE_DURATION;
        created_at = Time.now();
      };
      
      let existing_reports = switch (reportStore.get(caller)) {
        case (?reports) { reports };
        case null { [] };
      };
      
      let updated_reports = Array.append(existing_reports, [new_report]);
      reportStore.put(caller, updated_reports);
      
      return #Ok("Report created successfully with ID: " # Nat32.toText(new_report_id));
    };

    public func vote_report(caller : Principal, params : CommunityTypes.VoteReportParams) : async ParentTypes.Result<Text, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      var targetReport : ?CommunityTypes.Report = null;
      var reportOwner : ?Principal = null;
      
      for ((principal, reports) in reportStore.entries()) {
        for (report in reports.vals()) {
          if (Nat32.toNat(report.report_id) == Nat32.toNat(params.report_id)) {
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
          let currentTime = Time.now();
          if (currentTime > report.vote_deadline) {
            return #Err("Voting period has ended for this report");
          };

          if (report.reporter == caller) {
            return #Err("You cannot vote on your own report");
          };

          for (voter in report.voted_by.vals()) {
            if (voter.voter == caller) {
              return #Err("You have already voted on this report");
            };
          };

          let minimum_stake_amount = 1 * (10 ** Nat8.toNat(await tokenCanister.icrc1_decimals()));
          if (params.stake_amount < minimum_stake_amount) {
            return #Err("Minimum stake is 1 FUM token");
          };

          let transferArgs : TransferFromArgs = {
            spender_subaccount = null;
            from = {
              owner = caller;
              subaccount = null;
            };
            to = {
              owner = actorPrincipal;
              subaccount = null;
            };
            amount = params.stake_amount;
            fee = null;
            memo = ?Text.encodeUtf8("Vote Stake");
            created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
          };

          let transferResult = await tokenCanister.icrc2_transfer_from(transferArgs);
          switch (transferResult) {
            case (#Err(err)) {
              return #Err("Failed to transfer tokens: " # debug_show(err));
            };
            case (#Ok(_)) { };
          };

          let stakeRecord : CommunityTypes.StakeRecord = {
            staker = caller;
            amount = params.stake_amount;
            staked_at = Time.now();
            role = #Voter(params.vote_type);
            report_id = params.report_id;
            unstaked_at = null;
          };
          stakeRecordsStore.put(caller, stakeRecord);

          let newVoter : CommunityTypes.Voter = {
            voter = caller;
            vote = params.vote_type;
            vote_weight = (1 * calculate_activity_score(caller)) / 1000;
          };

          let updatedVotedBy = Array.append(report.voted_by, [newVoter]);
          
          let updatedVotesYes = if (params.vote_type) {
            report.votes_yes + 1
          } else {
            report.votes_yes
          };

          let updatedVotesNo = if (params.vote_type) {
            report.votes_no
          } else {
            report.votes_no + 1
          };

          let updatedReport : CommunityTypes.Report = {
            report_id = report.report_id;
            reporter = report.reporter;
            chain = report.chain;
            address = report.address;
            category = report.category;
            description = report.description;
            evidence = report.evidence;
            url = report.url;
            votes_yes = updatedVotesYes;
            votes_no = updatedVotesNo;
            voted_by = updatedVotedBy;
            vote_deadline = report.vote_deadline;
            created_at = report.created_at;
          };

          switch (reportOwner) {
            case (?owner) {
              let existingReports = switch (reportStore.get(owner)) {
                case (?reports) { reports };
                case null { [] };
              };

              let updatedReports = Array.map(existingReports, func (r : CommunityTypes.Report) : CommunityTypes.Report {
                if (r.report_id == report.report_id) {
                  updatedReport
                } else {
                  r
                }
              });

              reportStore.put(owner, updatedReports);
            };
            case null {
              return #Err("Report owner not found");
            };
          };

          let voteTypeText = if (params.vote_type) { "unsafe" } else { "safe" };
          return #Ok("Vote submitted successfully. You voted " # voteTypeText # " with " # Nat.toText(params.stake_amount) # " tokens staked");
        };
      };
    };

    public func unstake_voted_report(caller : Principal, report_id : CommunityTypes.ReportId) : async ParentTypes.Result<Text, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      switch (stakeRecordsStore.get(caller)) {
        case (?stakeRecord) {
          if (stakeRecord.report_id != report_id) {
            return #Err("You don't have a stake for this report");
          };

          switch (stakeRecord.unstaked_at) {
            case (?_) {
              return #Err("You have already unstaked this report");
            };
            case null { };
          };

          var targetReport : ?CommunityTypes.Report = null;
          var reportOwner : ?Principal = null;
          
          for ((principal, reports) in reportStore.entries()) {
            for (report in reports.vals()) {
              if (Nat32.toNat(report.report_id) == Nat32.toNat(report_id)) {
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
              let currentTime = Time.now();
              if (currentTime <= report.vote_deadline) {
                return #Err("Cannot unstake before voting deadline has passed");
              };

              var shouldGiveReward = false;
              var rewardAmount : Nat = 0;
              switch (stakeRecord.role) {
                case (#Voter(vote_type)) {
                  rewardAmount := calculate_voter_reward(report, vote_type, stakeRecord.amount);
                  shouldGiveReward := rewardAmount > 0;
                };
                case (#Reporter) {
                  shouldGiveReward := false;
                };
              };

              let stakeTransferArgs : TransferArg = {
                from_subaccount = null;
                to = { owner = caller; subaccount = null };
                amount = stakeRecord.amount;
                fee = null;
                memo = ?Text.encodeUtf8("Unstake Return");
                created_at_time = null;
              };

              let stakeTransferResult = await tokenCanister.icrc1_transfer(stakeTransferArgs);
              switch (stakeTransferResult) {
                case (#Err(err)) {
                  return #Err("Failed to transfer stake tokens: " # debug_show(err));
                };
                case (#Ok(_)) { };
              };

              if (shouldGiveReward) {
                let rewardTransferArgs : TransferArg = {
                  from_subaccount = null;
                  to = { owner = caller; subaccount = null };
                  amount = rewardAmount;
                  fee = null;
                  memo = ?Text.encodeUtf8("Unstake Reward");
                  created_at_time = null;
                };

                let rewardTransferResult = await tokenCanister.icrc1_transfer(rewardTransferArgs);
                switch (rewardTransferResult) {
                  case (#Err(err)) {
                    return #Err("Failed to transfer reward tokens: " # debug_show(err));
                  };
                  case (#Ok(_)) { };
                };
              };

              let updatedStakeRecord : CommunityTypes.StakeRecord = {
                staker = stakeRecord.staker;
                amount = stakeRecord.amount;
                staked_at = stakeRecord.staked_at;
                role = stakeRecord.role;
                report_id = stakeRecord.report_id;
                unstaked_at = ?Time.now();
              };
              stakeRecordsStore.put(caller, updatedStakeRecord);

              return #Ok("Successfully unstaked. Returned " # Nat.toText(stakeRecord.amount) # " tokens + " # Nat.toText(rewardAmount) # " reward = " # Nat.toText(stakeRecord.amount + rewardAmount) # " total");
            };
          };
        };
        case null {
          return #Err("You don't have any stake records");
        };
      };
    };

    public func unstake_created_report(caller : Principal, report_id : CommunityTypes.ReportId) : async ParentTypes.Result<Text, Text> {
      if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
      };

      switch (stakeRecordsStore.get(caller)) {
        case (?stakeRecord) {
          if (stakeRecord.report_id != report_id) {
            return #Err("You don't have a stake for this report");
          };

          switch (stakeRecord.role) {
            case (#Reporter) { };
            case (#Voter(_)) {
              return #Err("This function is only for report creators. Use unstake_voted_report for voters");
            };
          };

          switch (stakeRecord.unstaked_at) {
            case (?_) {
              return #Err("You have already unstaked this report");
            };
            case null { };
          };

          var targetReport : ?CommunityTypes.Report = null;
          var reportOwner : ?Principal = null;
          
          for ((principal, reports) in reportStore.entries()) {
            for (report in reports.vals()) {
              if (Nat32.toNat(report.report_id) == Nat32.toNat(report_id)) {
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
              let currentTime = Time.now();
              if (currentTime <= report.vote_deadline) {
                return #Err("Cannot unstake before voting deadline has passed");
              };

              let rewardAmount = calculate_reporter_reward(report, stakeRecord.amount);

              let stakeTransferArgs : TransferArg = {
                from_subaccount = null;
                to = { owner = caller; subaccount = null };
                amount = stakeRecord.amount;
                fee = null;
                memo = ?Text.encodeUtf8("Unstake Return");
                created_at_time = null;
              };

              let stakeTransferResult = await tokenCanister.icrc1_transfer(stakeTransferArgs);
              switch (stakeTransferResult) {
                case (#Err(err)) {
                  return #Err("Failed to transfer stake tokens: " # debug_show(err));
                };
                case (#Ok(_)) { };
              };

              if (rewardAmount > 0) {
                let rewardTransferArgs : TransferArg = {
                  from_subaccount = null;
                  to = { owner = caller; subaccount = null };
                  amount = rewardAmount;
                  fee = null;
                  memo = ?Text.encodeUtf8("Report Validation Reward");
                  created_at_time = null;
                };

                let rewardTransferResult = await tokenCanister.icrc1_transfer(rewardTransferArgs);
                switch (rewardTransferResult) {
                  case (#Err(err)) {
                    return #Err("Failed to transfer reward tokens: " # debug_show(err));
                  };
                  case (#Ok(_)) { };
                };
              };

              let updatedStakeRecord : CommunityTypes.StakeRecord = {
                staker = stakeRecord.staker;
                amount = stakeRecord.amount;
                staked_at = stakeRecord.staked_at;
                role = stakeRecord.role;
                report_id = stakeRecord.report_id;
                unstaked_at = ?Time.now();
              };
              stakeRecordsStore.put(caller, updatedStakeRecord);

              let rewardText = if (rewardAmount > 0) {
                " + " # Nat.toText(rewardAmount) # " reward = " # Nat.toText(stakeRecord.amount + rewardAmount) # " total"
              } else {
                " (no reward - report not validated by community)"
              };

              return #Ok("Successfully unstaked created report. Returned " # Nat.toText(stakeRecord.amount) # " tokens" # rewardText);
            };
          };
        };
        case null {
          return #Err("You don't have any stake records");
        };
      };
    };

    // Getter/setter for storage
    public func set_reports_storage(storage : [(Principal, [CommunityTypes.Report])]) {
      reportsStorage := storage;
    };

    public func set_stake_records_storage(storage : [(Principal, CommunityTypes.StakeRecord)]) {
      stakeRecordsStorage := storage;
    };

    public func get_reports_storage() : [(Principal, [CommunityTypes.Report])] {
      return reportsStorage;
    };

    public func get_stake_records_storage() : [(Principal, CommunityTypes.StakeRecord)] {
      return stakeRecordsStorage;
    };

    public func set_next_report_id(id : CommunityTypes.ReportId) {
      next_report_id := id;
    };

    public func get_next_report_id() : CommunityTypes.ReportId {
      return next_report_id;
    };

    // Expose reportStore for analyze module
    public func get_report_store() : Map.HashMap<Principal, [CommunityTypes.Report]> {
      return reportStore;
    };

    // Expose stakeRecordsStore for admin module
    public func get_stake_records_store() : Map.HashMap<Principal, CommunityTypes.StakeRecord> {
      return stakeRecordsStore;
    };
  };
};

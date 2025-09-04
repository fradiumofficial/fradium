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

import Nat64 "mo:base/Nat64";

import TokenCanister "canister:fradium_token";
import Types "types";

persistent actor Fradium {
  // Vote deadline in nanoseconds (1 week = 7 * 24 * 60 * 60 * 1_000_000_000)
  private transient let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;
  
  // Faucet claim cooldown in nanoseconds (48 hours = 48 * 60 * 60 * 1_000_000_000)
  private transient let FAUCET_COOLDOWN_DURATION : Time.Time = 172_800_000_000_000;
  
  // Unstake voter reward percentage (10% = 1/10)
  private transient let UNSTAKE_VOTER_REWARD_PERCENTAGE : Nat = 10;
  
  // Unstake created report reward percentage (25% = 1/4)
  private transient let UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE : Nat = 4;

  // Minimum quorum for vote validation (minimum number of voters required)
  private transient let MINIMUM_QUORUM : Nat = 1;

  var reportsStorage : [(Principal, [Types.Report])] = [];
  var faucetClaimsStorage : [(Principal, Time.Time)] = [];
  var stakeRecordsStorage : [(Principal, Types.StakeRecord)] = [];
  var analyzeAddressStorage : [(Principal, [Types.AnalyzeHistory])] = [];
  var analyzeHistoryStorage : [(Principal, [Types.AnalyzeHistory])] = [];

  transient var reportStore = Map.HashMap<Principal, [Types.Report]>(0, Principal.equal, Principal.hash);
  transient var faucetClaimsStore = Map.HashMap<Principal, Time.Time>(0, Principal.equal, Principal.hash);
  transient var stakeRecordsStore = Map.HashMap<Principal, Types.StakeRecord>(0, Principal.equal, Principal.hash);
  transient var analyzeAddressStore = Map.HashMap<Principal, [Types.AnalyzeHistory]>(0, Principal.equal, Principal.hash);
  transient var analyzeHistoryStore = Map.HashMap<Principal, [Types.AnalyzeHistory]>(0, Principal.equal, Principal.hash);

  private var next_report_id : Types.ReportId = 0;

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    // Save all data to stable storage
    reportsStorage := Iter.toArray(reportStore.entries());
    faucetClaimsStorage := Iter.toArray(faucetClaimsStore.entries());
    stakeRecordsStorage := Iter.toArray(stakeRecordsStore.entries());

    analyzeAddressStorage := Iter.toArray(analyzeAddressStore.entries());

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



    analyzeAddressStore := Map.HashMap<Principal, [Types.AnalyzeHistory]>(analyzeAddressStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeAddressStorage.vals()) {
        analyzeAddressStore.put(key, value);
    };



    analyzeHistoryStore := Map.HashMap<Principal, [Types.AnalyzeHistory]>(analyzeHistoryStorage.size(), Principal.equal, Principal.hash);
    for ((key, value) in analyzeHistoryStorage.vals()) {
        analyzeHistoryStore.put(key, value);
    };
  };

  public query func get_reports() : async Types.Result<[Types.Report], Text> {
    var allReports : [Types.Report] = [];
    
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        allReports := Array.append(allReports, [report]);
      };
    };
    
    return #Ok(allReports);
  };

  public query func get_report(report_id : Types.ReportId) : async Types.Result<Types.Report, Text> {
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.report_id == report_id) {
          return #Ok(report);
          
        };
      };
    };
    return #Err("Report not found");
  };

  // ===== FAUCET FUNCTIONS =====
  public shared({ caller }) func claim_faucet() : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    // Check if user has claimed recently
    let currentTime = Time.now();
    switch (faucetClaimsStore.get(caller)) {
      case (?lastClaimTime) {
        let timeSinceLastClaim = currentTime - lastClaimTime;
        if (timeSinceLastClaim < FAUCET_COOLDOWN_DURATION) {
          return #Err("You can only claim faucet once every 48 hours. Please try again later.");
        };
      };
      case null { /* First time claiming, proceed */ };
    };

    let transferArgs = {
      from_subaccount = null;
      to = { owner = caller; subaccount = null };
      amount = 10 * (10 ** Nat8.toNat(await TokenCanister.icrc1_decimals()));
      fee = null;
      memo = ?Text.encodeUtf8("Faucet Claim");
      created_at_time = null;
    };

    let transferResult = await TokenCanister.icrc1_transfer(transferArgs);
    switch (transferResult) {
        case (#Err(err)) {
            return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) {
            // Record the claim time
            faucetClaimsStore.put(caller, currentTime);
            return #Ok("Tokens transferred successfully");
        };
    };
  };

  public shared({ caller }) func check_faucet_claim() : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    switch (faucetClaimsStore.get(caller)) {
      case (?lastClaimTime) {
        let currentTime = Time.now();
        let timeSinceLastClaim = currentTime - lastClaimTime;
        let canClaim = timeSinceLastClaim >= FAUCET_COOLDOWN_DURATION;
        
        if (canClaim) {
          return #Ok("You can claim faucet now");
        } else {
          let remainingTime = FAUCET_COOLDOWN_DURATION - timeSinceLastClaim;
          let remainingHours = remainingTime / 3_600_000_000_000; // Convert to hours
          let remainingMinutes = (remainingTime % 3_600_000_000_000) / 60_000_000_000; // Convert to minutes
          
          if (remainingHours > 0 and remainingMinutes > 0) {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
          } else if (remainingHours > 0) {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingHours)) # " hours");
          } else {
            return #Err("You can't claim faucet yet. Remaining time: " # Nat.toText(Int.abs(remainingMinutes)) # " minutes");
          };
        };
      };
      case null {
        return #Ok("You can claim faucet now");
      };
    };
  };

  // ===== COMMUNITY REPORT & STAKE FUNCTIONS =====

  // Reusable function to calculate reward for reporter
  private func calculate_reporter_reward(report : Types.Report, stakeAmount : Nat) : Nat {
    // Check if report was validated by community (YES majority)
    let isReportValidated = is_vote_correct(report, true); // Check if YES majority
    
    // Calculate reward (0.25% of stake amount) only if report was validated
    let rewardAmount = if (isReportValidated) {
      stakeAmount / UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE;
    } else {
      0;
    };
    
    return rewardAmount;
  };

  // Reusable function to calculate reward for voter
  private func calculate_voter_reward(report : Types.Report, voteType : Bool, stakeAmount : Nat) : Nat {
    // Check if vote was correct
    let isVoteCorrect = is_vote_correct(report, voteType);
    
    // Calculate reward (0.1% of stake amount) only if vote was correct
    let rewardAmount = if (isVoteCorrect) {
      stakeAmount / UNSTAKE_VOTER_REWARD_PERCENTAGE;
    } else {
      0;
    };
    
    return rewardAmount;
  };

  public shared({ caller }) func get_my_reports() : async Types.Result<[Types.GetMyReportsParams], Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    switch (reportStore.get(caller)) {
      case (?reports) {
        // Convert reports to GetMyReportsParams format
        let reportsWithStakeInfo = Array.map(reports, func (report : Types.Report) : Types.GetMyReportsParams {
          // Get stake record for this report
          var stakeAmount : Nat = 0;
          var reward : Nat = 0;
          var unstakedAt : ?Time.Time = null;
          
          switch (stakeRecordsStore.get(caller)) {
            case (?stakeRecord) {
              if (stakeRecord.report_id == report.report_id) {
                stakeAmount := stakeRecord.amount;
                // Calculate reward for reporter
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

  public shared({ caller }) func get_my_votes() : async Types.Result<[Types.GetMyVotesParams], Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    var votedReports : [Types.GetMyVotesParams] = [];
    
    // Get all stake records for this caller with role Voter
    for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
      if (staker == caller) {
        switch (stakeRecord.role) {
          case (#Voter(vote_type)) {
            // Find the report with this report_id
            for ((principal, reports) in reportStore.entries()) {
              for (report in reports.vals()) {
                if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                  // Calculate reward for voter
                  let reward = calculate_voter_reward(report, vote_type, stakeRecord.amount);
                  
                  let voteReport : Types.GetMyVotesParams = {
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

  public shared({ caller }) func create_report(params : Types.CreateReportParams) : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
        return #Err("Anonymous users can't perform this action.");
    };

    // Check if address already exists in any report
    for ((principal, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.address == params.address and report.chain == params.chain) {
          return #Err("Address " # params.address # " has already been reported. Please check existing reports.");
        };
      };
    };

    let minimum_stake_amount = 5 * (10 ** Nat8.toNat(await TokenCanister.icrc1_decimals()));

    if (params.stake_amount < minimum_stake_amount) {
      return #Err("Minimum stake is 5 FUM tokens");
    };

    let transferArgs = {
        spender_subaccount = null;
        from = {
            owner = caller;
            subaccount = null;
        };
        to = {
            owner = Principal.fromActor(Fradium);
            subaccount = null;
        };
        amount = params.stake_amount;
        fee = null;
        memo = ?Text.encodeUtf8("Report Stake");
        created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
    };

    let transferResult = await TokenCanister.icrc2_transfer_from(transferArgs);
    switch (transferResult) {
        case (#Err(err)) {
            return #Err("Failed to transfer tokens: " # debug_show(err));
        };
        case (#Ok(_)) { };  
    };

    let new_report_id = next_report_id;
    next_report_id += 1;

    // Record the stake
    let stakeRecord : Types.StakeRecord = {
      staker = caller;
      amount = params.stake_amount;
      staked_at = Time.now();
      role = #Reporter;
      report_id = new_report_id;
      unstaked_at = null;
    };
    stakeRecordsStore.put(caller, stakeRecord);

    let new_report : Types.Report = {
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

  public shared({ caller }) func vote_report(params : Types.VoteReportParams) : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
      return #Err("Anonymous users can't perform this action.");
    };

    // Find the report
    var targetReport : ?Types.Report = null;
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
        // Check if voting deadline has passed
        let currentTime = Time.now();
        if (currentTime > report.vote_deadline) {
          return #Err("Voting period has ended for this report");
        };

        // Check if user is the reporter (reporter cannot vote on their own report)
        if (report.reporter == caller) {
          return #Err("You cannot vote on your own report");
        };

        // Check if user has already voted
        for (voter in report.voted_by.vals()) {
          if (voter.voter == caller) {
            return #Err("You have already voted on this report");
          };
        };

        // Validate minimum stake amount
        let minimum_stake_amount = 1 * (10 ** Nat8.toNat(await TokenCanister.icrc1_decimals()));
        if (params.stake_amount < minimum_stake_amount) {
          return #Err("Minimum stake is 1 FUM token");
        };

        // Transfer tokens from user to canister
        let transferArgs = {
          spender_subaccount = null;
          from = {
            owner = caller;
            subaccount = null;
          };
          to = {
            owner = Principal.fromActor(Fradium);
            subaccount = null;
          };
          amount = params.stake_amount;
          fee = null;
          memo = ?Text.encodeUtf8("Vote Stake");
          created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
        };

        let transferResult = await TokenCanister.icrc2_transfer_from(transferArgs);
        switch (transferResult) {
          case (#Err(err)) {
            return #Err("Failed to transfer tokens: " # debug_show(err));
          };
          case (#Ok(_)) { };
        };

        // Record the stake
        let stakeRecord : Types.StakeRecord = {
          staker = caller;
          amount = params.stake_amount;
          staked_at = Time.now();
          role = #Voter(params.vote_type);
          report_id = params.report_id;
          unstaked_at = null;
        };
        stakeRecordsStore.put(caller, stakeRecord);

        // Update the report with new vote
        let newVoter : Types.Voter = {
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

        let updatedReport : Types.Report = {
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

  // Reusable function to check if a vote is correct based on majority and quorum
  private func is_vote_correct(report : Types.Report, vote_type : Bool) : Bool {
    // Check if minimum quorum is met
    let totalVoters = report.voted_by.size();
    if (totalVoters < MINIMUM_QUORUM) {
      return false; // Not enough voters to determine result
    };

    // Calculate total weight for yes and no votes
    var totalYesWeight : Nat = 0;
    var totalNoWeight : Nat = 0;
    
    for (voter in report.voted_by.vals()) {
      if (voter.vote == true) {
        totalYesWeight += voter.vote_weight;
      } else {
        totalNoWeight += voter.vote_weight;
      };
    };
    
    // Check if YES votes > NO votes (majority rule)
    let isYesMajority = totalYesWeight > totalNoWeight;
    
    // Vote is correct if:
    // - vote_type = true (unsafe) and YES is majority (report marked as unsafe)
    // - vote_type = false (safe) and NO is majority (report marked as safe)
    let isVoteCorrect = if (isYesMajority) {
      vote_type == true // Voted unsafe and report is unsafe
    } else {
      vote_type == false // Voted safe and report is safe
    };
    
    return isVoteCorrect;
  };

  public shared({ caller }) func unstake_voted_report(report_id : Types.ReportId) : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
      return #Err("Anonymous users can't perform this action.");
    };

    // Check if user has stake record for this report
    switch (stakeRecordsStore.get(caller)) {
      case (?stakeRecord) {
        if (stakeRecord.report_id != report_id) {
          return #Err("You don't have a stake for this report");
        };

        // Check if already unstaked
        switch (stakeRecord.unstaked_at) {
          case (?_) {
            return #Err("You have already unstaked this report");
          };
          case null { };
        };

        // Find the report to check if voting deadline has passed
        var targetReport : ?Types.Report = null;
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
            // Check if voting deadline has passed
            let currentTime = Time.now();
            if (currentTime <= report.vote_deadline) {
              return #Err("Cannot unstake before voting deadline has passed");
            };

            // Check if vote was correct (only for voters, not reporters)
            var shouldGiveReward = false;
            var rewardAmount : Nat = 0;
            switch (stakeRecord.role) {
              case (#Voter(vote_type)) {
                rewardAmount := calculate_voter_reward(report, vote_type, stakeRecord.amount);
                shouldGiveReward := rewardAmount > 0;
              };
              case (#Reporter) {
                // Reporters don't get reward for unstaking
                shouldGiveReward := false;
              };
            };

            // Transfer stake amount back to user
            let stakeTransferArgs = {
              from_subaccount = null;
              to = { owner = caller; subaccount = null };
              amount = stakeRecord.amount;
              fee = null;
              memo = ?Text.encodeUtf8("Unstake Return");
              created_at_time = null;
            };

            let stakeTransferResult = await TokenCanister.icrc1_transfer(stakeTransferArgs);
            switch (stakeTransferResult) {
              case (#Err(err)) {
                return #Err("Failed to transfer stake tokens: " # debug_show(err));
              };
              case (#Ok(_)) { };
            };

            // Transfer reward to user only if vote was correct
            if (shouldGiveReward) {
              let rewardTransferArgs = {
                from_subaccount = null;
                to = { owner = caller; subaccount = null };
                amount = rewardAmount;
                fee = null;
                memo = ?Text.encodeUtf8("Unstake Reward");
                created_at_time = null;
              };

              let rewardTransferResult = await TokenCanister.icrc1_transfer(rewardTransferArgs);
              switch (rewardTransferResult) {
                case (#Err(err)) {
                  return #Err("Failed to transfer reward tokens: " # debug_show(err));
                };
                case (#Ok(_)) { };
              };
            };

            // Update stake record to mark as unstaked
            let updatedStakeRecord : Types.StakeRecord = {
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

  public shared({ caller }) func unstake_created_report(report_id : Types.ReportId) : async Types.Result<Text, Text> {
    if(Principal.isAnonymous(caller)) {
      return #Err("Anonymous users can't perform this action.");
    };

    // Check if user has stake record for this report as reporter
    switch (stakeRecordsStore.get(caller)) {
      case (?stakeRecord) {
        if (stakeRecord.report_id != report_id) {
          return #Err("You don't have a stake for this report");
        };

        // Check if user is the reporter
        switch (stakeRecord.role) {
          case (#Reporter) { };
          case (#Voter(_)) {
            return #Err("This function is only for report creators. Use unstake_voted_report for voters");
          };
        };

        // Check if already unstaked
        switch (stakeRecord.unstaked_at) {
          case (?_) {
            return #Err("You have already unstaked this report");
          };
          case null { };
        };

        // Find the report to check if voting deadline has passed
        var targetReport : ?Types.Report = null;
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
            // Check if voting deadline has passed
            let currentTime = Time.now();
            if (currentTime <= report.vote_deadline) {
              return #Err("Cannot unstake before voting deadline has passed");
            };

            // Calculate reward using reusable function
            let rewardAmount = calculate_reporter_reward(report, stakeRecord.amount);

            // Transfer stake amount back to user
            let stakeTransferArgs = {
              from_subaccount = null;
              to = { owner = caller; subaccount = null };
              amount = stakeRecord.amount;
              fee = null;
              memo = ?Text.encodeUtf8("Unstake Return");
              created_at_time = null;
            };

            let stakeTransferResult = await TokenCanister.icrc1_transfer(stakeTransferArgs);
            switch (stakeTransferResult) {
              case (#Err(err)) {
                return #Err("Failed to transfer stake tokens: " # debug_show(err));
              };
              case (#Ok(_)) { };
            };

            // Transfer reward to user only if report was validated
            if (rewardAmount > 0) {
              let rewardTransferArgs = {
                from_subaccount = null;
                to = { owner = caller; subaccount = null };
                amount = rewardAmount;
                fee = null;
                memo = ?Text.encodeUtf8("Report Validation Reward");
                created_at_time = null;
              };

              let rewardTransferResult = await TokenCanister.icrc1_transfer(rewardTransferArgs);
              switch (rewardTransferResult) {
                case (#Err(err)) {
                  return #Err("Failed to transfer reward tokens: " # debug_show(err));
                };
                case (#Ok(_)) { };
              };
            };

            // Update stake record to mark as unstaked
            let updatedStakeRecord : Types.StakeRecord = {
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

  private func calculate_activity_score(caller : Principal) : Nat {
    // Calculate activity factor based on valid votes and valid reports
    // activity_factor = 1000 + (valid_votes × 20) + (valid_reports × 50)
    // Using scaling factor of 1000 to avoid floating point
    
    var valid_votes : Nat = 0;
    var valid_reports : Nat = 0;
    
    // Count valid votes (votes that were correct)
    for ((staker, stakeRecord) in stakeRecordsStore.entries()) {
      if (staker == caller) {
        switch (stakeRecord.role) {
          case (#Voter(vote_type)) {
            // Find the report to check if vote was correct
            for ((principal, reports) in reportStore.entries()) {
              for (report in reports.vals()) {
                if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                  // Check if voting deadline has passed
                  let currentTime = Time.now();
                  if (currentTime > report.vote_deadline) {
                    // Calculate if vote was correct
                    let totalVotes = report.votes_yes + report.votes_no;
                    let yesPercentage = if (totalVotes > 0) {
                      (report.votes_yes * 100) / totalVotes
                    } else {
                      0
                    };
                    
                    // Vote is correct if:
                    // - vote_type = true (unsafe) and yesPercentage >= 75% (report marked as unsafe)
                    // - vote_type = false (safe) and yesPercentage < 75% (report marked as safe)
                    let isVoteCorrect = if (yesPercentage >= 75) {
                      vote_type == true // Voted unsafe and report is unsafe
                    } else {
                      vote_type == false // Voted safe and report is safe
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
            // Count valid reports (reports that were validated by community)
            for ((principal, reports) in reportStore.entries()) {
              for (report in reports.vals()) {
                if (Nat32.toNat(report.report_id) == Nat32.toNat(stakeRecord.report_id)) {
                  // Check if voting deadline has passed
                  let currentTime = Time.now();
                  if (currentTime > report.vote_deadline) {
                    let totalVotes = report.votes_yes + report.votes_no;
                    let yesPercentage = if (totalVotes > 0) {
                      (report.votes_yes * 100) / totalVotes
                    } else {
                      0
                    };
                    
                    // Report is valid if yesPercentage >= 75% (marked as unsafe)
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
    
    // Calculate activity factor using Nat with scaling factor 1000
    let base : Nat = 1000;
    let vote_weight : Nat = valid_votes * 20;
    let report_weight : Nat = valid_reports * 50;
    let activity_factor : Nat = base + vote_weight + report_weight;
    
    return activity_factor;
  };



  // ===== ANALYZE ADDRESS =====
  public shared({ caller }) func analyze_address(address : Text) : async Types.Result<Types.GetAnalyzeAddressResult, Text> {
    // Cari report yang memiliki address tersebut
    var found : Bool = false;
    var isUnsafe : Bool = false;
    var foundReport : ?Types.Report = null;
    
    for ((_, reports) in reportStore.entries()) {
      for (report in reports.vals()) {
        if (report.address == address) {
          found := true;
          foundReport := ?report;
          
          // Check if voting deadline has passed
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
      
      // If address is not safe, save to history
      let historyEntry : Types.AnalyzeHistory = {
        address = address;
        is_safe = isSafe;
        analyzed_type = #CommunityVote;
        created_at = Time.now();
        metadata = debug_show(foundReport);
        token_type = #Bitcoin;
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

  public shared({ caller }) func create_analyze_history(params : Types.CreateAnalyzeHistoryParams) : async Types.Result<[Types.AnalyzeHistory], Text> {
    if(Principal.isAnonymous(caller)) {
      return #Err("Anonymous users can't perform this action.");
    };
    
    let historyEntry : Types.AnalyzeHistory = {
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

  public shared({ caller }) func get_analyze_history() : async Types.Result<[Types.AnalyzeHistory], Text> {
    if(Principal.isAnonymous(caller)) {
      return #Err("Anonymous users can't perform this action.");
    };

    switch (analyzeAddressStore.get(caller)) {
      case (?history) {
        return #Ok(history);
      };
      case null {
        return #Ok([]);
      };
    };
  };



  // ADMIN - DEBUG ONLY - DELETE LATER
  public func admin_change_report_deadline(report_id : Types.ReportId, new_deadline : Time.Time) : async Types.Result<Text, Text> {
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

  public func admin_delete_report(report_id : Types.ReportId) : async Types.Result<Text, Text> {
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
  
}

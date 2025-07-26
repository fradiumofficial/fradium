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
import Types "../types";
import Debug "mo:base/Debug";

module {
    public class CommunityModule(
        reportStore: Map.HashMap<Principal, [Types.Report]>,
        stakeRecordsStore: Map.HashMap<Principal, Types.StakeRecord>,
        nextReportId: Nat32,
        actorPrincipal: Principal
    ) {
        // Vote deadline in nanoseconds (1 week = 7 * 24 * 60 * 60 * 1_000_000_000)
        private let VOTE_DEADLINE_DURATION : Time.Time = 604_800_000_000_000;
        
        // Unstake voter reward percentage (10% = 1/10)
        private let UNSTAKE_VOTER_REWARD_PERCENTAGE : Nat = 10;
        
        // Unstake created report reward percentage (25% = 1/4)
        private let UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE : Nat = 4;

        // Minimum quorum for vote validation (minimum number of voters required)
        private let MINIMUM_QUORUM : Nat = 1;

        private var currentNextReportId = nextReportId;

        public func getReports() : Types.Result<[Types.Report], Text> {
            var allReports : [Types.Report] = [];
            
            for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                    allReports := Array.append(allReports, [report]);
                };
            };
            
            return #Ok(allReports);
        };

        public func getReport(reportId: Types.ReportId) : Types.Result<Types.Report, Text> {
            for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                    if (report.report_id == reportId) {
                        return #Ok(report);
                    };
                };
            };
            return #Err("Report not found");
        };

        // Reusable function to check if a vote is correct based on majority and quorum
        private func isVoteCorrect(report: Types.Report, vote_type: Bool) : Bool {
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

        // Reusable function to calculate reward for reporter
        private func calculateReporterReward(report: Types.Report, stakeAmount: Nat) : Nat {
            // Check if report was validated by community (YES majority)
            let isReportValidated = isVoteCorrect(report, true); // Check if YES majority
            
            // Calculate reward (0.25% of stake amount) only if report was validated
            let rewardAmount = if (isReportValidated) {
                stakeAmount / UNSTAKE_CREATED_REPORT_REWARD_PERCENTAGE;
            } else {
                0;
            };
            
            return rewardAmount;
        };

        // Reusable function to calculate reward for voter
        private func calculateVoterReward(report: Types.Report, voteType: Bool, stakeAmount: Nat) : Nat {
            // Check if vote was correct
            let voteCorrect = isVoteCorrect(report, voteType);
            
            // Calculate reward (0.1% of stake amount) only if vote was correct
            let rewardAmount = if (voteCorrect) {
                stakeAmount / UNSTAKE_VOTER_REWARD_PERCENTAGE;
            } else {
                0;
            };
            
            return rewardAmount;
        };

        public func getMyReports(caller: Principal) : Types.Result<[Types.GetMyReportsParams], Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            switch (reportStore.get(caller)) {
                case (?reports) {
                    // Convert reports to GetMyReportsParams format
                    let reportsWithStakeInfo = Array.map(reports, func (report: Types.Report) : Types.GetMyReportsParams {
                        // Get stake record for this report
                        var stakeAmount : Nat = 0;
                        var reward : Nat = 0;
                        var unstakedAt : ?Time.Time = null;
                        
                        switch (stakeRecordsStore.get(caller)) {
                            case (?stakeRecord) {
                                if (stakeRecord.report_id == report.report_id) {
                                    stakeAmount := stakeRecord.amount;
                                    // Calculate reward for reporter
                                    reward := calculateReporterReward(report, stakeRecord.amount);
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

        public func getMyVotes(caller: Principal) : Types.Result<[Types.GetMyVotesParams], Text> {
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
                                    if (report.report_id == Nat32.toNat(stakeRecord.report_id)) {
                                        // Calculate reward for voter
                                        let reward = calculateVoterReward(report, vote_type, stakeRecord.amount);
                                        
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

        public func createReport(caller: Principal, params: Types.CreateReportParams) : async Types.Result<Text, Text> {
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

            let minimum_stake_amount = 5 * (10 ** Nat8.toNat(await TokenCanister.get_decimals()));

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
                    owner = actorPrincipal; 
                    subaccount = null;
                };
                amount = params.stake_amount;
                fee = null;
                memo = ?Blob.toArray(Text.encodeUtf8("Report Stake"));
                created_at_time = ?Nat64.fromNat(Int.abs(Time.now()));
            };

            let transferResult = await TokenCanister.icrc2_transfer_from(transferArgs);
            switch (transferResult) {
                case (#Err(err)) {
                    return #Err("Failed to transfer tokens: " # debug_show(err));
                };
                case (#Ok(_)) { };  
            };

            let new_report_id = currentNextReportId;
            currentNextReportId += 1;

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

        public func voteReport(caller: Principal, params: Types.VoteReportParams) : async Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Find the report
            var targetReport : ?Types.Report = null;
            var reportOwner : ?Principal = null;
            
            for ((principal, reports) in reportStore.entries()) {
                for (report in reports.vals()) {
                    if (report.report_id == Nat32.toNat(params.report_id)) {
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
                    let minimum_stake_amount = 1 * (10 ** Nat8.toNat(await TokenCanister.get_decimals()));
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
                    owner = actorPrincipal; 
                    subaccount = null;
                };
                        amount = params.stake_amount;
                        fee = null;
                        memo = ?Blob.toArray(Text.encodeUtf8("Vote Stake"));
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
                        vote_weight = (1 * calculateActivityScore(caller)) / 1000;
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

                            let updatedReports = Array.map(existingReports, func (r: Types.Report) : Types.Report {
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



        public func unstakeVotedReport(caller: Principal, reportId: Types.ReportId) : async Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Check if user has stake record for this report
            switch (stakeRecordsStore.get(caller)) {
                case (?stakeRecord) {
                    if (stakeRecord.report_id != reportId) {
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
                            if (report.report_id == Nat32.toNat(reportId)) {
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
                                    rewardAmount := calculateVoterReward(report, vote_type, stakeRecord.amount);
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

        public func unstakeCreatedReport(caller: Principal, reportId: Types.ReportId) : async Types.Result<Text, Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            // Check if user has stake record for this report as reporter
            switch (stakeRecordsStore.get(caller)) {
                case (?stakeRecord) {
                    if (stakeRecord.report_id != reportId) {
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
                            if (report.report_id == Nat32.toNat(reportId)) {
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
                            let rewardAmount = calculateReporterReward(report, stakeRecord.amount);

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

        private func calculateActivityScore(caller: Principal) : Nat {
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
                                    if (report.report_id == Nat32.toNat(stakeRecord.report_id)) {
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
                                    if (report.report_id == Nat32.toNat(stakeRecord.report_id)) {
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

        public func getCurrentNextReportId() : Nat32 {
            currentNextReportId
        };

        public func getReportStore() : Map.HashMap<Principal, [Types.Report]> {
            reportStore
        };

        public func getStakeRecordsStore() : Map.HashMap<Principal, Types.StakeRecord> {
            stakeRecordsStore
        };
    };
}; 
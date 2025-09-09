import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Map "mo:base/HashMap";
import Array "mo:base/Array";
import Types "../types";

module {
    public class AnalyzeModule(
        analyzeAddressStore: Map.HashMap<Principal, [Types.AnalyzeHistory]>,
        reportStore: Map.HashMap<Principal, [Types.Report]>
    ) {
        public func analyzeAddress(caller: Principal, address: Text) : Types.Result<Types.GetAnalyzeAddressResult, Text> {
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
                            isUnsafe := isVoteCorrect(report, true);
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

        public func createAnalyzeHistory(caller: Principal, params: Types.CreateAnalyzeHistoryParams) : Types.Result<[Types.AnalyzeHistory], Text> {
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

        public func getAnalyzeHistory(caller: Principal, offset: Nat, limit: Nat) : Types.Result<[Types.AnalyzeHistory], Text> {
            if(Principal.isAnonymous(caller)) {
                return #Err("Anonymous users can't perform this action.");
            };

            switch (analyzeAddressStore.get(caller)) {
                case (?history) {
                    // Apply pagination
                    let totalCount = history.size();
                    let startIndex = offset;
                    let endIndex = if (offset + limit > totalCount) { totalCount } else { offset + limit };
                    
                    // Get paginated slice
                    let paginatedHistory = Array.tabulate<Types.AnalyzeHistory>(
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

        // Reusable function to check if a vote is correct based on majority and quorum
        private func isVoteCorrect(report: Types.Report, vote_type: Bool) : Bool {
            // Check if minimum quorum is met
            let totalVoters = report.voted_by.size();
            if (totalVoters < 1) {
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

        public func getAnalyzeHistoryCount(caller: Principal) : Types.Result<Nat, Text> {
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

        public func getAnalyzeAddressStore() : Map.HashMap<Principal, [Types.AnalyzeHistory]> {
            analyzeAddressStore
        };
    };
}; 
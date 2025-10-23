import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import TimeBase "mo:base/Time";

import Types "./types";

module {
    public class ApiManager() {
        // Storage for API tokens
        private var tokens: HashMap.HashMap<Text, Types.ApiToken> = HashMap.HashMap<Text, Types.ApiToken>(10, Text.equal, Text.hash);
        private var tokenCounter: Nat = 0;

        // ===== API USAGE STORAGE =====
        private var usageStorage : [(Principal, [Types.ApiUsageRecord])] = [];
        private var usageStore = HashMap.HashMap<Principal, [Types.ApiUsageRecord]>(0, Principal.equal, Principal.hash);
        private var usedAmountCounter : HashMap.HashMap<Principal, Nat> = HashMap.HashMap<Principal, Nat>(10, Principal.equal, Principal.hash);
        private var approvalsStorage : [(Principal, [Types.ApiApprovalRecord])] = [];
        private var approvalsStore = HashMap.HashMap<Principal, [Types.ApiApprovalRecord]>(0, Principal.equal, Principal.hash);
        
        // ===== UPGRADE STORAGE =====
        private var tokensStorage : [(Text, Types.ApiToken)] = [];
        private var usedAmountCounterStorage : [(Principal, Nat)] = [];
        private var tokenCounterStorage : Nat = 0; // Stable storage for counter

        // Generate a random token string
        private func generateTokenString(): Text {
            let timestamp = Time.now();
            let randomPart = Nat.toText(Int.abs(timestamp) % 1000000000);
            "fradium_api_sk_" # randomPart # "_" # Nat.toText(Int.abs(timestamp) % 1000000)
        };

        // Generate unique token ID
        private func generateTokenId(): Text {
            tokenCounter += 1;
            "token_" # Nat.toText(tokenCounter)
        };

        // Create a new API token
        public func createToken(caller: Principal, request: Types.CreateTokenRequest): async Types.CreateTokenResponse {
            // Validate request
            if (Text.size(request.name) == 0) {
                return #err("Token name cannot be empty");
            };
            
            if (Text.size(request.name) > 50) {
                return #err("Token name too long (max 50 characters)");
            };

            // Generate new token
            let tokenId = generateTokenId();
            let tokenString = generateTokenString();
            let now = Time.now();

            let newToken: Types.ApiToken = {
                id = tokenId;
                name = request.name;
                token = tokenString;
                principal = caller;
                created = now;
                status = #active;
            };

            // Store the token
            tokens.put(tokenId, newToken);

            #ok(newToken)
        };

        // Get all tokens for the caller
        public func getTokens(caller: Principal): async Types.GetTokensResponse {
            let callerTokens = Buffer.Buffer<Types.ApiToken>(0);
            
            for ((_, token) in tokens.entries()) {
                if (token.principal == caller) {
                    callerTokens.add(token);
                };
            };

            #ok(Buffer.toArray(callerTokens))
        };

        // Regenerate a token
        public func regenerateToken(caller: Principal, request: Types.RegenerateTokenRequest): async Types.TokenOperationResponse {
            // Debug logging
            // Note: In production, remove debug prints
            
            switch (tokens.get(request.tokenId)) {
                case (?token) {
                    // Check if caller owns this token
                    if (token.principal != caller) {
                        return #err("Unauthorized: You don't own this token");
                    };
                    
                    // Check if token is active
                    switch (token.status) {
                        case (#active) {
                            // Generate new token string
                            let newTokenString = generateTokenString();
                            
                            let updatedToken: Types.ApiToken = {
                                id = token.id;
                                name = token.name;
                                token = newTokenString;
                                principal = token.principal;
                                created = token.created;
                                status = #active;
                            };
                            
                            tokens.put(request.tokenId, updatedToken);
                            #ok("Token regenerated successfully")
                        };
                        case (_) {
                            #err("Cannot regenerate inactive token")
                        };
                    };
                };
                case null {
                    #err("Token not found")
                };
            };
        };

        // Revoke a token
        public func revokeToken(caller: Principal, request: Types.RevokeTokenRequest): async Types.TokenOperationResponse {
            switch (tokens.get(request.tokenId)) {
                case (?token) {
                    // Check if caller owns this token
                    if (token.principal != caller) {
                        return #err("Unauthorized: You don't own this token");
                    };
                    
                    // Check if token is active
                    switch (token.status) {
                        case (#active) {
                            let updatedToken: Types.ApiToken = {
                                id = token.id;
                                name = token.name;
                                token = token.token;
                                principal = token.principal;
                                created = token.created;
                                status = #revoked;
                            };
                            
                            tokens.put(request.tokenId, updatedToken);
                            #ok("Token revoked successfully")
                        };
                        case (_) {
                            #err("Token is already inactive")
                        };
                    };
                };
                case null {
                    #err("Token not found")
                };
            };
        };

        // Delete a token (permanently remove)
        public func deleteToken(caller: Principal, request: Types.RevokeTokenRequest): async Types.TokenOperationResponse {
            switch (tokens.get(request.tokenId)) {
                case (?token) {
                    // Check if caller owns this token
                    if (token.principal != caller) {
                        return #err("Unauthorized: You don't own this token");
                    };
                    
                    // Remove token from storage
                    tokens.delete(request.tokenId);
                    #ok("Token deleted successfully")
                };
                case null {
                    #err("Token not found")
                };
            };
        };

        // Validate API token (for internal use)
        public func validateToken(tokenString: Text): ?Principal {
            for ((_, token) in tokens.entries()) {
                if (token.token == tokenString) {
                    switch (token.status) {
                        case (#active) {
                            return ?token.principal;
                        };
                        case (_) {
                            return null;
                        };
                    };
                };
            };
            null
        };

        // Get token info by token string
        public func getTokenInfo(tokenString: Text): ?Types.ApiToken {
            for ((_, token) in tokens.entries()) {
                if (token.token == tokenString) {
                    return ?token;
                };
            };
            null
        };

        // Admin function to get all tokens (for debugging)
        public func getAllTokens(): async [Types.ApiToken] {
            // In production, you might want to add admin checks here
            let tokenBuffer = Buffer.Buffer<Types.ApiToken>(0);
            for (token in tokens.vals()) {
                tokenBuffer.add(token);
            };
            Buffer.toArray(tokenBuffer)
        };

        // ===== API USAGE PUBLIC METHODS =====
        public func recordApiUsage(owner : Principal, route : Text, cost : Nat, model : Text, status : Text, reason : ?Text) {
            let now = TimeBase.now();
            let prev = switch (usageStore.get(owner)) { case (?arr) arr; case null [] };
            let updated = Buffer.fromArray<Types.ApiUsageRecord>(prev);
            updated.add({ route = route; cost = cost; model = model; status = status; reason = reason; at = now });
            usageStore.put(owner, Buffer.toArray(updated));
            // increment used counter only for successful calls
            if (status == "success") {
                let prevUsed = switch (usedAmountCounter.get(owner)) { case (?n) n; case null 0 };
                usedAmountCounter.put(owner, prevUsed + cost);
            };
        };

        // Record approval with metadata = "API_CREDITS"
        public func recordApiApproval(owner : Principal, amount_e8s : Nat, metadata : Text) {
            let now = TimeBase.now();
            let prev = switch (approvalsStore.get(owner)) { case (?arr) arr; case null [] };
            let updated = Buffer.fromArray<Types.ApiApprovalRecord>(prev);
            updated.add({ amount_e8s = amount_e8s; metadata = metadata; at = now });
            approvalsStore.put(owner, Buffer.toArray(updated));
        };

        public func getApiCreditsStats(caller : Principal, ledgerCanisterId : Principal, spender : Principal) : async Types.ApiCreditsStats {
            // query allowance from FRADIUM ledger dynamically
            let dyn : actor { icrc2_allowance : shared query ({ account : { owner : Principal; subaccount : ?Blob }; spender : { owner : Principal; subaccount : ?Blob } }) -> async { allowance : Nat; expires_at : ?Nat } } = actor (Principal.toText(ledgerCanisterId));
            let allowanceRes = await dyn.icrc2_allowance({ account = { owner = caller; subaccount = null }; spender = { owner = spender; subaccount = null } });
            let remaining = allowanceRes.allowance;
            let usedSum = switch (usedAmountCounter.get(caller)) { case (?n) n; case null 0 };
            { remaining_e8s = remaining; used_e8s = usedSum };
        };

        public func getApiCreditsHistory(caller : Principal, offset : Nat, limit : Nat) : { items : [Types.ApiUsageRecord]; total : Nat; offset : Nat; limit : Nat } {
            let arr = switch (usageStore.get(caller)) { case (?a) a; case null [] };
            let total = arr.size();
            let start = if (offset > total) { total } else { offset };
            let end = if (start + limit > total) { total } else { start + limit };
            let count = if (end > start) { end - start } else { 0 };
            let page = if (count == 0) { [] } else { Array.subArray<Types.ApiUsageRecord>(arr, start, count) };
            { items = page; total = total; offset = offset; limit = limit };
        };

        public func getApiCreditsOverview(caller : Principal, ledgerCanisterId : Principal, spender : Principal) : async Types.ApiCreditsOverview {
            let stats = await getApiCreditsStats(caller, ledgerCanisterId, spender);
            let approvals = switch (approvalsStore.get(caller)) { case (?a) a; case null [] };
            var totalApproved : Nat = 0;
            for (a in approvals.vals()) {
                if (a.metadata == "API_CREDITS") { totalApproved += a.amount_e8s; };
            };
            { total_approved_e8s = totalApproved; used_e8s = stats.used_e8s; remaining_e8s = if (totalApproved > stats.used_e8s) { totalApproved - stats.used_e8s } else { 0 } };
        };

        public func getApiApprovalsHistory(caller : Principal, offset : Nat, limit : Nat) : { items : [Types.ApiApprovalRecord]; total : Nat; offset : Nat; limit : Nat } {
            let arrAll = switch (approvalsStore.get(caller)) { case (?a) a; case null [] };
            // filter by API_CREDITS metadata
            let filtered = Array.filter<Types.ApiApprovalRecord>(arrAll, func (r) { r.metadata == "API_CREDITS" });
            let total = filtered.size();
            let start = if (offset > total) { total } else { offset };
            let end = if (start + limit > total) { total } else { start + limit };
            let count = if (end > start) { end - start } else { 0 };
            let page = if (count == 0) { [] } else { Array.subArray<Types.ApiApprovalRecord>(filtered, start, count) };
            { items = page; total = total; offset = offset; limit = limit };
        };

        // Get analyze history from API usage records
        public func getAnalyzeHistory(caller : Principal, offset : Nat, limit : Nat) : { items : [Types.ApiUsageRecord]; total : Nat; offset : Nat; limit : Nat } {
            let arrAll = switch (usageStore.get(caller)) { case (?a) a; case null [] };
            // filter by analyze-address route
            let filtered = Array.filter<Types.ApiUsageRecord>(arrAll, func (r) { r.route == "/analyze-address" });
            let total = filtered.size();
            let start = if (offset > total) { total } else { offset };
            let end = if (start + limit > total) { total } else { start + limit };
            let count = if (end > start) { end - start } else { 0 };
            let page = if (count == 0) { [] } else { Array.subArray<Types.ApiUsageRecord>(filtered, start, count) };
            { items = page; total = total; offset = offset; limit = limit };
        };

        public func preupgrade() {
            // Save all HashMap data to persistent storage
            tokensStorage := Iter.toArray(tokens.entries());
            usageStorage := Iter.toArray(usageStore.entries());
            usedAmountCounterStorage := Iter.toArray(usedAmountCounter.entries());
            approvalsStorage := Iter.toArray(approvalsStore.entries());
            tokenCounterStorage := tokenCounter; // Save counter
        };

        public func postupgrade() {
            // Restore all HashMap data from persistent storage
            tokens := HashMap.HashMap<Text, Types.ApiToken>(tokensStorage.size(), Text.equal, Text.hash);
            for ((k, v) in tokensStorage.vals()) { tokens.put(k, v); };
            
            usageStore := HashMap.HashMap<Principal, [Types.ApiUsageRecord]>(usageStorage.size(), Principal.equal, Principal.hash);
            for ((k, v) in usageStorage.vals()) { usageStore.put(k, v); };
            
            usedAmountCounter := HashMap.HashMap<Principal, Nat>(usedAmountCounterStorage.size(), Principal.equal, Principal.hash);
            for ((k, v) in usedAmountCounterStorage.vals()) { usedAmountCounter.put(k, v); };
            
            approvalsStore := HashMap.HashMap<Principal, [Types.ApiApprovalRecord]>(approvalsStorage.size(), Principal.equal, Principal.hash);
            for ((k2, v2) in approvalsStorage.vals()) { approvalsStore.put(k2, v2); };
            
            tokenCounter := tokenCounterStorage; // Restore counter
        };
    };
};

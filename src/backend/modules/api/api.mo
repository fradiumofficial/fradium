import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";

import Types "./types";

module {
    public class ApiManager() {
        // Storage for API tokens
        private var tokens: HashMap.HashMap<Text, Types.ApiToken> = HashMap.HashMap<Text, Types.ApiToken>(10, Text.equal, Text.hash);
        private var tokenCounter: Nat = 0;

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
    };
};

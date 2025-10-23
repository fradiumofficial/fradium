import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Blob "mo:base/Blob";
import Nat16 "mo:base/Nat16";
import Nat "mo:base/Nat";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";

import FradiumLedgerOriginal "canister:fradium_ledger";
import IcpLedgerOriginal "canister:icp_ledger";
import CkbtcLedgerOriginal "canister:ckbtc_ledger";
import CkethLedgerOriginal "canister:cketh_ledger";
import WalletCanisterOriginal "canister:wallet";

import Types "types";
import CommunityTypes "./modules/community/types";
import AnalyzeTypes "./modules/analyze/types";
import EscrowTypes "./modules/escrow/types";
import PaylinkTypes "./modules/paylink/types";
import ApiTypes "./modules/api/types";

import AnalyzeModule "./modules/analyze/analyze";
import FaucetModule "./modules/faucet/faucet";
import CommunityModule "./modules/community/community";
import AdminModule "./modules/admin/admin";
import EscrowModule "./modules/escrow/escrow";
import PaylinkModule "./modules/paylink/paylink";
import ApiModule "./modules/api/api";

persistent actor Fradium {
  // ===== HTTP REQUEST TYPES =====
  type HeaderField = (Text, Text);

  type HttpRequest = {
    method : Text;
    url : Text;
    headers : [HeaderField];
    body : Blob;
    certificate_version : ?Nat16;
  };

  type HttpResponse = {
    status_code : Nat16;
    headers : [HeaderField];
    body : Blob;
    streaming_strategy : ?Null;
    upgrade : ?Bool;
  };

  // ===== LEDGER CANISTERS SETUP =====
  // Cast ledger canisters to compatible interfaces for different modules

  // Faucet & Community modules (only use FRADIUM ledger)
  transient let FradiumLedger : FaucetModule.TokenCanisterInterface = FradiumLedgerOriginal;
  transient let FradiumLedgerForCommunity : CommunityModule.TokenCanisterInterface = FradiumLedgerOriginal;

  // Escrow module (supports multiple token types via ICRC-2 standard + native coins)
  //
  // WRAPPED TOKENS (Proper escrow - funds locked in canister):
  // - FRADIUM -> fradium_ledger
  // - ICP -> icp_ledger
  // - ckBTC -> ckbtc_ledger (wrapped Bitcoin)
  // - ckETH -> cketh_ledger (wrapped Ethereum)
  //
  // NATIVE COINS (Trust-based escrow - funds in user wallet):
  // - BTC -> wallet canister (native Bitcoin via threshold ECDSA)
  // - ETH -> wallet canister (native Ethereum via threshold ECDSA)
  // - SOL -> wallet canister (native Solana via Ed25519)
  transient let FradiumLedgerForEscrow : EscrowModule.TokenCanisterInterface = actor (Principal.toText(Principal.fromActor(FradiumLedgerOriginal)));
  transient let FradiumFeeLedgerForEscrow : EscrowModule.FradiumLedgerInterface = actor (Principal.toText(Principal.fromActor(FradiumLedgerOriginal)));
  transient let IcpLedgerForEscrow : EscrowModule.TokenCanisterInterface = actor (Principal.toText(Principal.fromActor(IcpLedgerOriginal)));
  transient let CkbtcLedgerForEscrow : EscrowModule.TokenCanisterInterface = actor (Principal.toText(Principal.fromActor(CkbtcLedgerOriginal)));
  transient let CkethLedgerForEscrow : EscrowModule.TokenCanisterInterface = actor (Principal.toText(Principal.fromActor(CkethLedgerOriginal)));
  // Note: Wallet canister is optional for native coin support
  // If not provided, only wrapped tokens (ckBTC, ckETH) will work
  // Cast wallet canister to compatible interface
  transient let WalletCasted : EscrowModule.WalletCanisterInterface = WalletCanisterOriginal;
  transient let WalletForEscrow : ?EscrowModule.WalletCanisterInterface = ?WalletCasted;

  // ===== MODULE INITIALIZATION =====
  transient let faucetModule = FaucetModule.FaucetModule(FradiumLedger);
  transient let communityModule = CommunityModule.CommunityModule(Principal.fromActor(Fradium), FradiumLedgerForCommunity);
  transient let analyzeModule = AnalyzeModule.AnalyzeModule();
  transient let adminModule = AdminModule.AdminModule();

  // Escrow module with both wrapped token ledgers and wallet canister
  transient let escrowModule = EscrowModule.EscrowModule(
    Principal.fromActor(Fradium),
    FradiumLedgerForEscrow,
    FradiumFeeLedgerForEscrow,
    IcpLedgerForEscrow,
    CkbtcLedgerForEscrow,
    CkethLedgerForEscrow,
    WalletForEscrow  // Optional wallet for native coins (BTC, ETH, SOL)
  );

  // Paylink module initialization
  // Factory to create a dynamic ICRC/SNS ledger actor by principal for paylink payments
  transient let createPaylinkLedgerActor = func (p: Principal) : PaylinkModule.TokenCanisterInterface {
    actor (Principal.toText(p))
  };

  transient let paylinkModule = PaylinkModule.PaylinkModule(
    Principal.fromActor(Fradium),
    IcpLedgerOriginal,
    FradiumLedgerOriginal,
    CkbtcLedgerOriginal,
    CkethLedgerOriginal,
    WalletCanisterOriginal,
    createPaylinkLedgerActor
  );

  // API module initialization
  transient let apiModule = ApiModule.ApiManager();

  // ===== API BILLING CONFIG =====
  // Fee per analyze-address API call (in FRADIUM e8s)
  let API_ANALYZE_FEE : Nat = 300_000; // 0.003 FRADIUM

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    faucetModule.preupgrade();
    communityModule.preupgrade();
    analyzeModule.preupgrade();
    escrowModule.preupgrade();
    paylinkModule.preupgrade();
    apiModule.preupgrade();
  };

  system func postupgrade() {
    faucetModule.postupgrade();
    communityModule.postupgrade();
    analyzeModule.postupgrade();
    escrowModule.postupgrade();
    paylinkModule.postupgrade();
    apiModule.postupgrade();
  };

  // ===== REPORT FUNCTIONS (COMMUNITY MODULE) =====
  public query func get_reports(offset : Nat, limit : Nat) : async Types.Result<CommunityTypes.GetReportsResponse, Text> {
    return communityModule.get_reports(offset, limit);
  };

  public query func get_report(report_id : CommunityTypes.ReportId) : async Types.Result<CommunityTypes.ReportWithStatus, Text> {
    return communityModule.get_report(report_id);
  };

  public shared({ caller }) func get_my_reports() : async Types.Result<[CommunityTypes.GetMyReportsParams], Text> {
    return communityModule.get_my_reports(caller);
  };

  public shared({ caller }) func get_my_votes() : async Types.Result<[CommunityTypes.GetMyVotesParams], Text> {
    return communityModule.get_my_votes(caller);
  };

  public shared({ caller }) func create_report(params : CommunityTypes.CreateReportParams) : async Types.Result<Text, Text> {
    return await communityModule.create_report(caller, params);
  };

  public shared({ caller }) func vote_report(params : CommunityTypes.VoteReportParams) : async Types.Result<Text, Text> {
    return await communityModule.vote_report(caller, params);
  };

  public shared({ caller }) func unstake_voted_report(report_id : CommunityTypes.ReportId) : async Types.Result<Text, Text> {
    return await communityModule.unstake_voted_report(caller, report_id);
  };

  public shared({ caller }) func unstake_created_report(report_id : CommunityTypes.ReportId) : async Types.Result<Text, Text> {
    return await communityModule.unstake_created_report(caller, report_id);
  };

  // ===== FAUCET FUNCTIONS (FAUCET MODULE) =====
  public shared({ caller }) func claim_faucet() : async Types.Result<Text, Text> {
    return await faucetModule.claim_faucet(caller);
  };

  public shared({ caller }) func check_faucet_claim() : async Types.Result<Text, Text> {
    return faucetModule.check_faucet_claim(caller);
  };

  // ===== ANALYZE ADDRESS FUNCTIONS (ANALYZE MODULE) =====
  public shared({ caller }) func analyze_address(address : Text) : async Types.Result<AnalyzeTypes.GetAnalyzeAddressResult, Text> {
    return analyzeModule.analyze_address(caller, address, communityModule.get_report_store());
  };

  public shared({ caller }) func create_analyze_history(params : AnalyzeTypes.CreateAnalyzeHistoryParams) : async Types.Result<[AnalyzeTypes.AnalyzeHistory], Text> {
    return analyzeModule.create_analyze_history(caller, params);
  };

  public shared({ caller }) func get_analyze_history(offset: Nat, limit: Nat) : async Types.Result<[AnalyzeTypes.AnalyzeHistory], Text> {
    return analyzeModule.get_analyze_history(caller, offset, limit);
  };

  public shared({ caller }) func get_analyze_history_count() : async Types.Result<Nat, Text> {
    return analyzeModule.get_analyze_history_count(caller);
  };

  // ===== ESCROW FUNCTIONS (ESCROW MODULE - TrustPay) =====
  public shared({ caller }) func create_escrow(params : EscrowTypes.CreateEscrowParams) : async Types.Result<EscrowTypes.EscrowId, Text> {
    return await escrowModule.create_escrow(caller, params);
  };

  public query func get_escrow(escrow_id : EscrowTypes.EscrowId) : async Types.Result<EscrowTypes.EscrowRecord, Text> {
    return escrowModule.get_escrow(escrow_id);
  };

  public shared({ caller }) func get_sent_escrows() : async Types.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
    return escrowModule.get_sent_escrows(caller);
  };

  public shared({ caller }) func get_sent_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
    return escrowModule.get_sent_escrows_paginated(caller, offset, limit);
  };

  public shared({ caller }) func get_received_escrows() : async Types.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
    return escrowModule.get_received_escrows(caller);
  };

  public shared({ caller }) func get_received_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
    return escrowModule.get_received_escrows_paginated(caller, offset, limit);
  };

  public query func get_escrow_stats() : async EscrowTypes.EscrowStats {
    return escrowModule.get_escrow_stats();
  };

  public query func get_all_escrows() : async [EscrowTypes.EscrowRecord] {
    return escrowModule.get_all_escrows();
  };

  public query func get_all_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat } {
    return escrowModule.get_all_escrows_paginated(offset, limit);
  };

  public query func get_open_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat } {
    return escrowModule.get_open_escrows_paginated(offset, limit);
  };

  public shared({ caller }) func join_escrow(params : EscrowTypes.AcceptEscrowParams) : async Types.Result<EscrowTypes.EscrowId, Text> {
    return await escrowModule.join_escrow(caller, params);
  };

  public shared({ caller }) func mark_deposit(escrow_id : EscrowTypes.EscrowId) : async Types.Result<Text, Text> {
    return await escrowModule.mark_deposit(caller, escrow_id);
  };

  public shared({ caller }) func release_escrow(escrow_id : EscrowTypes.EscrowId) : async Types.Result<Text, Text> {
    return await escrowModule.release_escrow(caller, escrow_id);
  };

  public query func get_deposit_account(escrow_id : EscrowTypes.EscrowId, side : Text) : async { owner : Principal; sub : ?Blob } {
    return escrowModule.get_deposit_account(escrow_id, side);
  };

  // ===== PAYMENT LINK FUNCTIONS (PAYLINK MODULE) =====
  public shared({ caller }) func create_payment_link(params : PaylinkTypes.CreatePaymentLinkParams) : async Types.Result<Text, Text> {
    return await paylinkModule.create_payment_link(caller, params);
  };

  public shared({ caller }) func get_my_payment_links() : async Types.Result<[PaylinkTypes.PaymentLink], Text> {
    return paylinkModule.get_my_payment_links(caller);
  };

  public query func get_payment_link_details(id: Text) : async Types.Result<PaylinkTypes.PaymentLinkPublic, Text> {
    return paylinkModule.get_payment_link_details(id);
  };

  public shared({ caller }) func cancel_payment_link(link_id: Text) : async Types.Result<Text, Text> {
    return paylinkModule.cancel_payment_link(caller, link_id);
  };

  public shared({ caller }) func execute_payment_icrc(link_id: Text) : async Types.Result<Text, Text> {
    return await paylinkModule.execute_payment_icrc(caller, link_id);
  };

  public shared({ caller }) func record_native_payment(link_id: Text, tx_hash: Text) : async Types.Result<Text, Text> {
    return paylinkModule.record_native_payment(caller, link_id, tx_hash);
  };

  // ===== API TOKEN FUNCTIONS (API MODULE) =====
  public shared({ caller }) func create_api_token(request: ApiTypes.CreateTokenRequest) : async ApiTypes.CreateTokenResponse {
    return await apiModule.createToken(caller, request);
  };

  public shared({ caller }) func get_api_tokens() : async ApiTypes.GetTokensResponse {
    return await apiModule.getTokens(caller);
  };

  public shared({ caller }) func regenerate_api_token(request: ApiTypes.RegenerateTokenRequest) : async ApiTypes.TokenOperationResponse {
    return await apiModule.regenerateToken(caller, request);
  };

  public shared({ caller }) func revoke_api_token(request: ApiTypes.RevokeTokenRequest) : async ApiTypes.TokenOperationResponse {
    return await apiModule.revokeToken(caller, request);
  };

  public shared({ caller }) func delete_api_token(request: ApiTypes.RevokeTokenRequest) : async ApiTypes.TokenOperationResponse {
    return await apiModule.deleteToken(caller, request);
  };

  public shared query func validate_api_token(token_string: Text) : async ?Principal {
    return apiModule.validateToken(token_string);
  };

  public shared query func get_api_token_info(token_string: Text) : async ?ApiTypes.ApiToken {
    return apiModule.getTokenInfo(token_string);
  };

  // ===== ADMIN DEBUG (THIS IS FOR TESTING ONLY) =====
  public func admin_change_report_deadline(report_id : CommunityTypes.ReportId, new_deadline : Time.Time) : async Types.Result<Text, Text> {
    return adminModule.admin_change_report_deadline(report_id, new_deadline, communityModule.get_report_store());
  };

  public func admin_delete_report(report_id : CommunityTypes.ReportId) : async Types.Result<Text, Text> {
    return adminModule.admin_delete_report(report_id, communityModule.get_report_store(), communityModule.get_stake_records_store());
  };

  // ===== HTTP REQUEST FUNCTIONS =====
  
  // Helper function to extract address from HTTP request body
  private func extractAddressFromBody(body : Blob) : Text {
    // Simple extraction - in production, you'd want proper JSON parsing
    let bodyText = Text.decodeUtf8(body);
    switch (bodyText) {
      case null { "" };
      case (?text) { text };
    };
  };

  // Helper function to construct JSON HTTP response
  private func makeJsonResponse(statusCode : Nat16, jsonContent : Text) : HttpResponse {
    {
      status_code = statusCode;
      headers = [("content-type", "application/json"), ("access-control-allow-origin", "*")];
      body = Text.encodeUtf8(jsonContent);
      streaming_strategy = null;
      upgrade = ?true;
    };
  };

  // Helper to fetch a header value (case-insensitive)
  private func getHeader(headers : [HeaderField], name : Text) : ?Text {
    var found : ?Text = null;
    for ((k, v) in headers.vals()) {
      if (Text.toLowercase(k) == Text.toLowercase(name)) {
        found := ?v;
      };
    };
    found;
  };

  // Extract API token from headers: supports X-API-Token: <token> or Authorization: Bearer <token>
  private func extractApiToken(headers : [HeaderField]) : ?Text {
    // Prefer explicit X-API-Token header
    switch (getHeader(headers, "x-api-token")) {
      case (?tok) { return ?tok; };
      case null {}
    };

    // Fallback to Authorization header
    switch (getHeader(headers, "authorization")) {
      case (?auth) {
        let parts = Buffer.Buffer<Text>(0);
        for (p in Text.split(auth, #text " ")) {
          parts.add(p);
        };
        if (parts.size() >= 2) {
          let scheme = Text.toLowercase(parts.get(0));
          if (scheme == "bearer") {
            return ?parts.get(1);
          };
        };
      };
      case null {}
    };
    null
  };

  // Helper function to handle HTTP routes
  private func handleHttpRoute(method : Text, url : Text, _body : Blob, _headers : [HeaderField]) : HttpResponse {
    let normalizedUrl = Text.trimEnd(url, #text "/");

    switch (method, normalizedUrl) {
      case ("GET", "" or "/") {
        makeJsonResponse(200, "{\"message\": \"Welcome to Fradium API\", \"version\": \"1.0.0\"}");
      };
      case ("OPTIONS", _) {
        {
          status_code = 200;
          headers = [("access-control-allow-origin", "*"), ("access-control-allow-methods", "GET, POST, OPTIONS"), ("access-control-allow-headers", "Content-Type, Authorization, X-API-Token")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = null;
        };
      };
      case ("POST", "/analyze-address") {
        {
          status_code = 200;
          headers = [("content-type", "application/json")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = ?true;
        };
      };
      case _ {
        {
          status_code = 404;
          headers = [("content-type", "application/json")];
          body = Text.encodeUtf8("{\"error\": \"Not found: " # url # "\"}");
          streaming_strategy = null;
          upgrade = null;
        };
      };
    };
  };

  // Helper function to handle POST routes requiring async calls
  private func handleHttpRouteUpdate(method : Text, url : Text, body : Blob, headers : [HeaderField]) : async HttpResponse {
    let normalizedUrl = Text.trimEnd(url, #text "/");

    switch (method, normalizedUrl) {
      case ("POST", "/analyze-address") {
        // Require API token
        let maybeToken = extractApiToken(headers);
        switch (maybeToken) {
          case null {
            return makeJsonResponse(401, "{\"success\": false, \"error\": \"Missing API token\"}");
          };
          case (?tokenString) {
            // Validate token via API module
            switch (apiModule.validateToken(tokenString)) {
              case null {
                // Note: Cannot record API usage for invalid tokens since we don't have the token owner
                return makeJsonResponse(401, "{\"success\": false, \"error\": \"Invalid or inactive API token\"}");
              };
              case (?tokenOwner) {
                // Attempt to collect API fee via ICRC-2 transfer_from using prior allowance
                let feeResult = await FradiumFeeLedgerForEscrow.icrc2_transfer_from({
                  from = { owner = tokenOwner; subaccount = null };
                  to = { owner = Principal.fromActor(Fradium); subaccount = null };
                  amount = API_ANALYZE_FEE;
                  fee = null;
                  memo = null;
                  created_at_time = null;
                  spender_subaccount = null;
                });

                switch (feeResult) {
                  case (#Err e) {
                    let errMsg = switch (e) {
                      case (#InsufficientAllowance(_)) { "Insufficient allowance for API fee. Please approve more FRADIUM." };
                      case (#InsufficientFunds(_)) { "Insufficient FRADIUM balance for API fee." };
                      case (#BadFee { expected_fee }) { "Bad fee. Expected: " # Nat.toText(expected_fee) };
                      case (#GenericError { message; error_code }) { "Ledger error (" # Nat.toText(error_code) # "): " # message };
                      case _ { "Unable to collect API fee." };
                    };
                    // Record failed API usage
                    apiModule.recordApiUsage(tokenOwner, "/analyze-address", API_ANALYZE_FEE, "community", "failed", ?errMsg);
                    return makeJsonResponse(402, "{\"success\": false, \"error\": \"" # errMsg # "\"}");
                  };
                  case (#Ok _) {
                    // Record successful API usage
                    apiModule.recordApiUsage(tokenOwner, "/analyze-address", API_ANALYZE_FEE, "community", "success", null);
                  };
                };
              };
            };
          }
        };
        let address = extractAddressFromBody(body);
        if (address == "") {
          // Note: Cannot record API usage here since we're outside token validation scope
          return makeJsonResponse(400, "{\"error\": \"Address parameter is required\"}");
        };
        
        // Call the analyze_address function
        let result = await analyze_address(address);
        
        switch (result) {
          case (#Ok(analysisResult)) {
            // Convert the analysis result to JSON: expose only available fields
            let baseParts = [
              "{\"success\": true, \"data\": {",
              "\"is_safe\": ", if (analysisResult.is_safe) { "true" } else { "false" }
            ];
            // Optionally include whether a report exists
            let reportFlag = switch (analysisResult.report) {
              case null { [""] };
              case (?_) { [", ", "\"has_report\": true"] };
            };
            let endParts = ["}}"];
            let jsonResponse = Text.join("", Array.flatten<Text>([baseParts, reportFlag, endParts]).vals());
            makeJsonResponse(200, jsonResponse);
          };
          case (#Err(errorMsg)) {
            // Note: Cannot record API usage here since we're outside token validation scope
            let errorParts = [
              "{\"success\": false, \"error\": \"",
              errorMsg,
              "\"}"
            ];
            let errorResponse = Text.join("", errorParts.vals());
            makeJsonResponse(400, errorResponse);
          };
        };
      };
      case ("OPTIONS", _) {
        {
          status_code = 200;
          headers = [("access-control-allow-origin", "*"), ("access-control-allow-methods", "GET, POST, OPTIONS"), ("access-control-allow-headers", "Content-Type, Authorization, X-API-Token")];
          body = Text.encodeUtf8("");
          streaming_strategy = null;
          upgrade = null;
        };
      };
      case _ {
        return handleHttpRoute(method, url, body, headers);
      };
    };
  };

  // HTTP query interface for GET/OPTIONS and static responses
  public query func http_request(req : HttpRequest) : async HttpResponse {
    return handleHttpRoute(req.method, req.url, req.body, req.headers);
  };

  // HTTP update interface for POST routes requiring async calls
  public func http_request_update(req : HttpRequest) : async HttpResponse {
    return await handleHttpRouteUpdate(req.method, req.url, req.body, req.headers);
  };

  // ===== API CREDITS QUERIES =====
  public shared({ caller }) func get_api_credits_stats() : async { remaining_e8s : Nat; used_e8s : Nat } {
    let ledgerPrin = Principal.fromActor(FradiumLedgerOriginal);
    let dyn : actor { icrc2_allowance : shared query ({ account : { owner : Principal; subaccount : ?Blob }; spender : { owner : Principal; subaccount : ?Blob } }) -> async { allowance : Nat; expires_at : ?Nat } } = actor (Principal.toText(ledgerPrin));
    let allowanceRes = await dyn.icrc2_allowance({ account = { owner = caller; subaccount = null }; spender = { owner = Principal.fromActor(Fradium); subaccount = null } });
    let remaining = allowanceRes.allowance;
    // get used from counter
    let stats = await apiModule.getApiCreditsStats(caller, Principal.fromActor(FradiumLedgerOriginal), Principal.fromActor(Fradium));
    { remaining_e8s = remaining; used_e8s = stats.used_e8s };
  };

  public shared({ caller }) func get_api_approvals_history(offset : Nat, limit : Nat) : async { items : [ApiTypes.ApiApprovalRecord]; total : Nat; offset : Nat; limit : Nat } {
    return apiModule.getApiApprovalsHistory(caller, offset, limit);
  };

  // Record an approval entry into API module store (invoked by frontend after successful approve)
  public shared({ caller }) func record_api_approval(amount_e8s : Nat, metadata : Text) : async () {
    apiModule.recordApiApproval(caller, amount_e8s, metadata);
  };

  // Get analyze history from API usage records
  public shared({ caller }) func get_api_analyze_history(offset : Nat, limit : Nat) : async { items : [ApiTypes.ApiUsageRecord]; total : Nat; offset : Nat; limit : Nat } {
    return apiModule.getAnalyzeHistory(caller, offset, limit);
  };
};
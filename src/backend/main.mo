import Principal "mo:base/Principal";
import Time "mo:base/Time";

import TokenCanisterOriginal "canister:fradium_ledger";
import Types "types";
import CommunityTypes "./modules/community/types";
import AnalyzeTypes "./modules/analyze/types";
import EscrowTypes "./modules/escrow/types";
import AnalyzeModule "./modules/analyze/analyze";
import FaucetModule "./modules/faucet/faucet";
import CommunityModule "./modules/community/community";
import AdminModule "./modules/admin/admin";
import EscrowModule "./modules/escrow/escrow";

persistent actor Fradium {
  // Cast TokenCanister to compatible interface
  transient let TokenCanister : FaucetModule.TokenCanisterInterface = TokenCanisterOriginal;
  transient let TokenCanisterForCommunity : CommunityModule.TokenCanisterInterface = TokenCanisterOriginal;
  transient let TokenCanisterForEscrow : EscrowModule.TokenCanisterInterface = TokenCanisterOriginal;

  // AI Analyzer - Optional for now (can be set later)
  // For production, replace null with actual AI canister reference
  transient let aiAnalyzer : ?EscrowModule.AIAnalyzerInterface = null;

  // Initialize modules
  transient let faucetModule = FaucetModule.FaucetModule(TokenCanister);
  transient let communityModule = CommunityModule.CommunityModule(Principal.fromActor(Fradium), TokenCanisterForCommunity);
  transient let analyzeModule = AnalyzeModule.AnalyzeModule();
  transient let adminModule = AdminModule.AdminModule();
  transient let escrowModule = EscrowModule.EscrowModule(Principal.fromActor(Fradium), TokenCanisterForEscrow, aiAnalyzer);

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    faucetModule.preupgrade();
    communityModule.preupgrade();
    analyzeModule.preupgrade();
    escrowModule.preupgrade();
  };

  system func postupgrade() {
    faucetModule.postupgrade();
    communityModule.postupgrade();
    analyzeModule.postupgrade();
    escrowModule.postupgrade();
  };

  // ===== REPORT FUNCTIONS (COMMUNITY MODULE) =====
  public query func get_reports() : async Types.Result<[CommunityTypes.Report], Text> {
    return communityModule.get_reports();
  };

  public query func get_report(report_id : CommunityTypes.ReportId) : async Types.Result<CommunityTypes.Report, Text> {
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
  
  // Create new escrow payment with AI risk analysis
  public shared({ caller }) func create_escrow(params : EscrowTypes.CreateEscrowParams) : async Types.Result<EscrowTypes.EscrowId, Text> {
    return await escrowModule.create_escrow(caller, params);
  };

  // Get escrow details
  public query func get_escrow(escrow_id : EscrowTypes.EscrowId) : async Types.Result<EscrowTypes.EscrowRecord, Text> {
    return escrowModule.get_escrow(escrow_id);
  };

  // Get escrows sent by user
  public shared({ caller }) func get_sent_escrows() : async Types.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
    return escrowModule.get_sent_escrows(caller);
  };

  // Get escrows received by user
  public shared({ caller }) func get_received_escrows() : async Types.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
    return escrowModule.get_received_escrows(caller);
  };

  // Get escrow statistics
  public query func get_escrow_stats() : async EscrowTypes.EscrowStats {
    return escrowModule.get_escrow_stats();
  };

  // Get all escrows (admin)
  public query func get_all_escrows() : async [EscrowTypes.EscrowRecord] {
    return escrowModule.get_all_escrows();
  };

  // ===== ADMIN FUNCTIONS (ADMIN MODULE) =====
  public func admin_change_report_deadline(report_id : CommunityTypes.ReportId, new_deadline : Time.Time) : async Types.Result<Text, Text> {
    return adminModule.admin_change_report_deadline(report_id, new_deadline, communityModule.get_report_store());
  };

  public func admin_delete_report(report_id : CommunityTypes.ReportId) : async Types.Result<Text, Text> {
    return adminModule.admin_delete_report(report_id, communityModule.get_report_store(), communityModule.get_stake_records_store());
  };
};
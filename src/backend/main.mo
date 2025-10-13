import Principal "mo:base/Principal";
import Time "mo:base/Time";

import FradiumLedgerOriginal "canister:fradium_ledger";
import IcpLedgerOriginal "canister:icp_ledger";
import CkbtcLedgerOriginal "canister:ckbtc_ledger";
import CkethLedgerOriginal "canister:cketh_ledger";
import WalletCanisterOriginal "canister:wallet";
import Types "types";
import CommunityTypes "./modules/community/types";
import AnalyzeTypes "./modules/analyze/types";
import EscrowTypes "./modules/escrow/types";
import SwapTypes "./modules/swap/types";
import AnalyzeModule "./modules/analyze/analyze";
import FaucetModule "./modules/faucet/faucet";
import CommunityModule "./modules/community/community";
import AdminModule "./modules/admin/admin";
import EscrowModule "./modules/escrow/escrow";
import SwapModule "./modules/swap/swap";

persistent actor Fradium {
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

  // Swap module for ICPSwap integration
  transient let swapModule = SwapModule.SwapModule(
    Principal.fromActor(Fradium)
  );

  // ===== SYSTEM FUNCTIONS =====
  system func preupgrade() {
    faucetModule.preupgrade();
    communityModule.preupgrade();
    analyzeModule.preupgrade();
    escrowModule.preupgrade();
    swapModule.preupgrade();
  };

  system func postupgrade() {
    faucetModule.postupgrade();
    communityModule.postupgrade();
    analyzeModule.postupgrade();
    escrowModule.postupgrade();
    swapModule.postupgrade();
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
  
  // Create new escrow payment
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

  // Get escrows sent by user with pagination
  public shared({ caller }) func get_sent_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
    return escrowModule.get_sent_escrows_paginated(caller, offset, limit);
  };

  // Get escrows received by user
  public shared({ caller }) func get_received_escrows() : async Types.Result<[EscrowTypes.GetMyEscrowsParams], Text> {
    return escrowModule.get_received_escrows(caller);
  };

  // Get escrows received by user with pagination
  public shared({ caller }) func get_received_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat; offset : Nat; limit : Nat } {
    return escrowModule.get_received_escrows_paginated(caller, offset, limit);
  };

  // Get escrow statistics
  public query func get_escrow_stats() : async EscrowTypes.EscrowStats {
    return escrowModule.get_escrow_stats();
  };

  // Get all escrows (admin)
  public query func get_all_escrows() : async [EscrowTypes.EscrowRecord] {
    return escrowModule.get_all_escrows();
  };

  // Get all escrows with pagination
  public query func get_all_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat } {
    return escrowModule.get_all_escrows_paginated(offset, limit);
  };

  // Get open escrows with pagination
  public query func get_open_escrows_paginated(offset : Nat, limit : Nat) : async { items : [EscrowTypes.EscrowRecord]; total : Nat } {
    return escrowModule.get_open_escrows_paginated(offset, limit);
  };

  // Join escrow (counterparty)
  public shared({ caller }) func join_escrow(params : EscrowTypes.AcceptEscrowParams) : async Types.Result<EscrowTypes.EscrowId, Text> {
    return await escrowModule.join_escrow(caller, params);
  };

  // ===== SWAP FUNCTIONS (SWAP MODULE - ICPSwap Integration) =====
  
  // Get swap quote
  public query func get_swap_quote(request : SwapTypes.SwapQuoteRequest) : async SwapTypes.SwapQuoteResponse {
    return swapModule.getSwapQuote(request);
  };

  // Execute swap (redirects to ICPSwap)
  public shared({ caller }) func execute_swap(request : SwapTypes.SwapExecuteRequest) : async SwapTypes.SwapExecuteResponse {
    return swapModule.executeSwap(caller, request);
  };

  // Get swap history
  public shared({ caller }) func get_swap_history(offset : Nat, limit : Nat) : async { items : [SwapTypes.SwapHistory]; total : Nat; offset : Nat; limit : Nat } {
    return swapModule.getSwapHistory(caller, offset, limit);
  };

  // Get swap by ID
  public query func get_swap_by_id(swap_id : Nat) : async ?SwapTypes.SwapHistory {
    return swapModule.getSwapById(swap_id);
  };

  // Get supported tokens
  public query func get_supported_tokens() : async [SwapTypes.TokenInfo] {
    return swapModule.getSupportedTokens();
  };

  // Get supported pairs
  public query func get_supported_pairs() : async [SwapTypes.SupportedPair] {
    return swapModule.getSupportedPairs();
  };

  // Mark deposit after sending funds to escrow subaccount
  public shared({ caller }) func mark_deposit(escrow_id : EscrowTypes.EscrowId) : async Types.Result<Text, Text> {
    return await escrowModule.mark_deposit(caller, escrow_id);
  };

  // Release escrow after both deposits are done
  public shared({ caller }) func release_escrow(escrow_id : EscrowTypes.EscrowId) : async Types.Result<Text, Text> {
    return await escrowModule.release_escrow(caller, escrow_id);
  };

  // Get deposit account (owner + subaccount) for either side ("from" or "to")
  public query func get_deposit_account(escrow_id : EscrowTypes.EscrowId, side : Text) : async { owner : Principal; sub : ?Blob } {
    return escrowModule.get_deposit_account(escrow_id, side);
  };

  // ===== ADMIN FUNCTIONS (ADMIN MODULE) =====
  public func admin_change_report_deadline(report_id : CommunityTypes.ReportId, new_deadline : Time.Time) : async Types.Result<Text, Text> {
    return adminModule.admin_change_report_deadline(report_id, new_deadline, communityModule.get_report_store());
  };

  public func admin_delete_report(report_id : CommunityTypes.ReportId) : async Types.Result<Text, Text> {
    return adminModule.admin_delete_report(report_id, communityModule.get_report_store(), communityModule.get_stake_records_store());
  };
};
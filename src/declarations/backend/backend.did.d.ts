import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AcceptEscrowParams { 'escrow_id' : EscrowId }
export interface AnalyzeHistory {
  'is_safe' : boolean,
  'metadata' : string,
  'created_at' : Time,
  'address' : string,
  'token_type' : string,
  'analyzed_type' : AnalyzeHistoryType,
}
export type AnalyzeHistoryType = { 'AIAnalysis' : null } |
  { 'CommunityVote' : null };
export interface ApiToken {
  'id' : string,
  'status' : TokenStatus,
  'created' : Time,
  'principal' : Principal,
  'token' : string,
  'name' : string,
}
export interface CreateAnalyzeHistoryParams {
  'is_safe' : boolean,
  'metadata' : string,
  'address' : string,
  'token_type' : string,
  'analyzed_type' : AnalyzeHistoryType,
}
export interface CreateEscrowParams {
  'token_to' : TokenType,
  'metadata' : [] | [string],
  'duration_seconds' : [] | [bigint],
  'recipient' : [] | [Principal],
  'description' : [] | [string],
  'amount_from' : bigint,
  'amount_to' : bigint,
  'token_from' : TokenType,
}
export interface CreatePaymentLinkParams {
  'token' : TokenType__1,
  'amount' : bigint,
  'duration_nanos' : bigint,
  'custom_id' : [] | [string],
}
export interface CreateReportParams {
  'url' : [] | [string],
  'chain' : string,
  'description' : string,
  'evidence' : Array<string>,
  'address' : string,
  'category' : string,
  'stake_amount' : bigint,
}
export interface CreateTokenRequest { 'name' : string }
export type CreateTokenResponse = { 'ok' : ApiToken } |
  { 'err' : string };
export interface CreatorAddresses {
  'solana' : string,
  'ethereum' : string,
  'bitcoin' : string,
}
export type EscrowId = bigint;
export type EscrowMethod = { 'Native' : null } |
  { 'Wrapped' : null };
export interface EscrowRecord {
  'escrow_method' : EscrowMethod,
  'deposit_expires_at' : [] | [Time],
  'token_to' : TokenType,
  'metadata' : [] | [string],
  'accepted_at' : [] | [Time],
  'recipient' : [] | [Principal],
  'description' : [] | [string],
  'created_at' : Time,
  'sender' : Principal,
  'deposit_from_done' : boolean,
  'state' : EscrowState,
  'amount_from' : bigint,
  'amount_to' : bigint,
  'deposit_to_done' : boolean,
  'escrow_id' : EscrowId,
  'token_from' : TokenType,
  'expires_at' : Time,
  'released_at' : [] | [Time],
}
export type EscrowState = { 'Released' : null } |
  { 'Suspended' : null } |
  { 'Rejected' : null } |
  { 'Locked' : null } |
  { 'Cancelled' : null } |
  { 'AwaitingAccept' : null } |
  { 'Expired' : null } |
  { 'Pending' : null };
export interface EscrowStats {
  'by_state' : Array<[EscrowState, bigint]>,
  'total_volume_locked' : bigint,
  'suspended_escrows' : bigint,
  'total_escrows' : bigint,
  'completed_escrows' : bigint,
  'pending_escrows' : bigint,
}
export interface GetAnalyzeAddressResult {
  'report' : [] | [Report],
  'is_safe' : boolean,
}
export interface GetMyEscrowsParams {
  'escrow_method' : EscrowMethod,
  'token_to' : TokenType,
  'recipient' : [] | [Principal],
  'description' : [] | [string],
  'created_at' : Time,
  'sender' : Principal,
  'state' : EscrowState,
  'amount_from' : bigint,
  'amount_to' : bigint,
  'escrow_id' : EscrowId,
  'token_from' : TokenType,
  'expires_at' : Time,
}
export interface GetMyReportsParams {
  'url' : [] | [string],
  'report_id' : ReportId,
  'reward' : bigint,
  'unstaked_at' : [] | [Time],
  'voted_by' : Array<Voter>,
  'votes_no' : bigint,
  'chain' : string,
  'description' : string,
  'created_at' : Time,
  'evidence' : Array<string>,
  'vote_deadline' : Time,
  'address' : string,
  'category' : string,
  'votes_yes' : bigint,
  'stake_amount' : bigint,
  'reporter' : Principal,
}
export interface GetMyVotesParams {
  'url' : [] | [string],
  'report_id' : ReportId,
  'reward' : bigint,
  'unstaked_at' : [] | [Time],
  'voted_by' : Array<Voter>,
  'votes_no' : bigint,
  'vote_type' : boolean,
  'chain' : string,
  'description' : string,
  'created_at' : Time,
  'evidence' : Array<string>,
  'vote_deadline' : Time,
  'address' : string,
  'category' : string,
  'votes_yes' : bigint,
  'stake_amount' : bigint,
  'reporter' : Principal,
}
export type GetTokensResponse = { 'ok' : Array<ApiToken> } |
  { 'err' : string };
export type HeaderField = [string, string];
export interface HttpRequest {
  'url' : string,
  'method' : string,
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'certificate_version' : [] | [number],
}
export interface HttpResponse {
  'body' : Uint8Array | number[],
  'headers' : Array<HeaderField>,
  'upgrade' : [] | [boolean],
  'streaming_strategy' : [] | [null],
  'status_code' : number,
}
export interface PaymentLink {
  'id' : string,
  'status' : PaymentStatus,
  'creator' : Principal,
  'token' : TokenType__1,
  'creator_addresses' : [] | [CreatorAddresses],
  'created_at' : Time,
  'payer' : [] | [Principal],
  'amount' : bigint,
  'expires_at' : Time,
}
export interface PaymentLinkPublic {
  'status' : PaymentStatus,
  'creator' : Principal,
  'token' : TokenType__1,
  'creator_addresses' : [] | [CreatorAddresses],
  'created_at' : Time,
  'amount' : bigint,
  'expires_at' : Time,
}
export type PaymentStatus = { 'Active' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Expired' : null };
export interface RegenerateTokenRequest { 'tokenId' : string }
export interface Report {
  'url' : [] | [string],
  'report_id' : ReportId,
  'voted_by' : Array<Voter>,
  'votes_no' : bigint,
  'chain' : string,
  'description' : string,
  'created_at' : Time,
  'evidence' : Array<string>,
  'vote_deadline' : Time,
  'address' : string,
  'category' : string,
  'votes_yes' : bigint,
  'reporter' : Principal,
}
export type ReportId = number;
export type Result = { 'Ok' : string } |
  { 'Err' : string };
export type Result_1 = { 'Ok' : EscrowId } |
  { 'Err' : string };
export type Result_10 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_11 = { 'Ok' : Array<AnalyzeHistory> } |
  { 'Err' : string };
export type Result_12 = { 'Ok' : GetAnalyzeAddressResult } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Array<GetMyEscrowsParams> } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : Array<Report> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Report } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : PaymentLinkPublic } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<GetMyVotesParams> } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : Array<GetMyReportsParams> } |
  { 'Err' : string };
export type Result_8 = { 'Ok' : Array<PaymentLink> } |
  { 'Err' : string };
export type Result_9 = { 'Ok' : EscrowRecord } |
  { 'Err' : string };
export interface RevokeTokenRequest { 'tokenId' : string }
export interface SupportedPair {
  'to_token' : string,
  'active' : boolean,
  'from_token' : string,
  'to_canister_id' : string,
  'from_canister_id' : string,
}
export interface SwapExecuteRequest {
  'to_token' : string,
  'min_amount_out' : bigint,
  'from_token' : string,
  'recipient' : [] | [Principal],
  'deadline' : [] | [bigint],
  'amount' : bigint,
}
export interface SwapExecuteResponse {
  'transaction_id' : [] | [bigint],
  'redirect_url' : [] | [string],
  'error' : [] | [string],
  'success' : boolean,
}
export interface SwapHistory {
  'id' : bigint,
  'fee' : bigint,
  'transaction_id' : [] | [bigint],
  'to_token' : string,
  'status' : SwapStatus,
  'from_amount' : bigint,
  'from_token' : string,
  'user' : Principal,
  'created_at' : bigint,
  'to_amount' : bigint,
  'completed_at' : [] | [bigint],
}
export interface SwapQuoteRequest {
  'to_token' : string,
  'from_token' : string,
  'amount' : bigint,
}
export interface SwapQuoteResponse {
  'fee' : bigint,
  'min_amount_out' : bigint,
  'valid_for' : bigint,
  'rate' : number,
  'estimated_output' : bigint,
  'price_impact' : number,
}
export type SwapStatus = { 'Failed' : null } |
  { 'Cancelled' : null } |
  { 'Completed' : null } |
  { 'Pending' : null };
export type Time = bigint;
export interface TokenInfo {
  'decimals' : number,
  'name' : string,
  'canister_id' : string,
  'symbol' : string,
}
export type TokenOperationResponse = { 'ok' : string } |
  { 'err' : string };
export type TokenStatus = { 'active' : null } |
  { 'revoked' : null } |
  { 'expired' : null };
export type TokenType = { 'BTC' : null } |
  { 'ETH' : null } |
  { 'ICP' : null } |
  { 'SOL' : null } |
  { 'ckBTC' : null } |
  { 'ckETH' : null } |
  { 'FRADIUM' : null };
export type TokenType__1 = { 'BTC' : null } |
  { 'ETH' : null } |
  { 'ICP' : null } |
  { 'SOL' : null } |
  { 'Fradium' : null } |
  { 'ckBTC' : null } |
  { 'ckETH' : null };
export interface VoteReportParams {
  'report_id' : ReportId,
  'vote_type' : boolean,
  'stake_amount' : bigint,
}
export interface Voter {
  'voter' : Principal,
  'vote' : boolean,
  'vote_weight' : bigint,
}
export interface _SERVICE {
  'admin_change_report_deadline' : ActorMethod<[ReportId, Time], Result>,
  'admin_delete_report' : ActorMethod<[ReportId], Result>,
  'analyze_address' : ActorMethod<[string], Result_12>,
  'cancel_payment_link' : ActorMethod<[string], Result>,
  'check_faucet_claim' : ActorMethod<[], Result>,
  'claim_faucet' : ActorMethod<[], Result>,
  'create_analyze_history' : ActorMethod<
    [CreateAnalyzeHistoryParams],
    Result_11
  >,
  'create_api_token' : ActorMethod<[CreateTokenRequest], CreateTokenResponse>,
  'create_escrow' : ActorMethod<[CreateEscrowParams], Result_1>,
  'create_payment_link' : ActorMethod<[CreatePaymentLinkParams], Result>,
  'create_report' : ActorMethod<[CreateReportParams], Result>,
  'delete_api_token' : ActorMethod<
    [RevokeTokenRequest],
    TokenOperationResponse
  >,
  'execute_payment_icrc' : ActorMethod<[string], Result>,
  'execute_swap' : ActorMethod<[SwapExecuteRequest], SwapExecuteResponse>,
  'get_all_escrows' : ActorMethod<[], Array<EscrowRecord>>,
  'get_all_escrows_paginated' : ActorMethod<
    [bigint, bigint],
    { 'total' : bigint, 'items' : Array<EscrowRecord> }
  >,
  'get_analyze_history' : ActorMethod<[bigint, bigint], Result_11>,
  'get_analyze_history_count' : ActorMethod<[], Result_10>,
  'get_api_token_info' : ActorMethod<[string], [] | [ApiToken]>,
  'get_api_tokens' : ActorMethod<[], GetTokensResponse>,
  'get_deposit_account' : ActorMethod<
    [EscrowId, string],
    { 'sub' : [] | [Uint8Array | number[]], 'owner' : Principal }
  >,
  'get_escrow' : ActorMethod<[EscrowId], Result_9>,
  'get_escrow_stats' : ActorMethod<[], EscrowStats>,
  'get_my_payment_links' : ActorMethod<[], Result_8>,
  'get_my_reports' : ActorMethod<[], Result_7>,
  'get_my_votes' : ActorMethod<[], Result_6>,
  'get_open_escrows_paginated' : ActorMethod<
    [bigint, bigint],
    { 'total' : bigint, 'items' : Array<EscrowRecord> }
  >,
  'get_payment_link_details' : ActorMethod<[string], Result_5>,
  'get_received_escrows' : ActorMethod<[], Result_2>,
  'get_received_escrows_paginated' : ActorMethod<
    [bigint, bigint],
    {
      'total' : bigint,
      'offset' : bigint,
      'limit' : bigint,
      'items' : Array<EscrowRecord>,
    }
  >,
  'get_report' : ActorMethod<[ReportId], Result_4>,
  'get_reports' : ActorMethod<[], Result_3>,
  'get_sent_escrows' : ActorMethod<[], Result_2>,
  'get_sent_escrows_paginated' : ActorMethod<
    [bigint, bigint],
    {
      'total' : bigint,
      'offset' : bigint,
      'limit' : bigint,
      'items' : Array<EscrowRecord>,
    }
  >,
  'get_supported_pairs' : ActorMethod<[], Array<SupportedPair>>,
  'get_supported_tokens' : ActorMethod<[], Array<TokenInfo>>,
  'get_swap_by_id' : ActorMethod<[bigint], [] | [SwapHistory]>,
  'get_swap_history' : ActorMethod<
    [bigint, bigint],
    {
      'total' : bigint,
      'offset' : bigint,
      'limit' : bigint,
      'items' : Array<SwapHistory>,
    }
  >,
  'get_swap_quote' : ActorMethod<[SwapQuoteRequest], SwapQuoteResponse>,
  'http_request' : ActorMethod<[HttpRequest], HttpResponse>,
  'http_request_update' : ActorMethod<[HttpRequest], HttpResponse>,
  'join_escrow' : ActorMethod<[AcceptEscrowParams], Result_1>,
  'mark_deposit' : ActorMethod<[EscrowId], Result>,
  'record_native_payment' : ActorMethod<[string, string], Result>,
  'regenerate_api_token' : ActorMethod<
    [RegenerateTokenRequest],
    TokenOperationResponse
  >,
  'release_escrow' : ActorMethod<[EscrowId], Result>,
  'revoke_api_token' : ActorMethod<
    [RevokeTokenRequest],
    TokenOperationResponse
  >,
  'unstake_created_report' : ActorMethod<[ReportId], Result>,
  'unstake_voted_report' : ActorMethod<[ReportId], Result>,
  'validate_api_token' : ActorMethod<[string], [] | [Principal]>,
  'vote_report' : ActorMethod<[VoteReportParams], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

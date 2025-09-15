import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface AnalyzeHistory {
  'is_safe' : boolean,
  'metadata' : string,
  'created_at' : Time,
  'address' : string,
  'token_type' : TokenType,
  'analyzed_type' : AnalyzeHistoryType,
}
export type AnalyzeHistoryType = { 'AIAnalysis' : null } |
  { 'CommunityVote' : null };
export interface CreateAnalyzeHistoryParams {
  'is_safe' : boolean,
  'metadata' : string,
  'address' : string,
  'token_type' : TokenType,
  'analyzed_type' : AnalyzeHistoryType,
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
export interface GetAnalyzeAddressResult {
  'report' : [] | [Report],
  'is_safe' : boolean,
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
export type Result_1 = { 'Ok' : Array<Report> } |
  { 'Err' : string };
export type Result_2 = { 'Ok' : Report } |
  { 'Err' : string };
export type Result_3 = { 'Ok' : Array<GetMyVotesParams> } |
  { 'Err' : string };
export type Result_4 = { 'Ok' : Array<GetMyReportsParams> } |
  { 'Err' : string };
export type Result_5 = { 'Ok' : bigint } |
  { 'Err' : string };
export type Result_6 = { 'Ok' : Array<AnalyzeHistory> } |
  { 'Err' : string };
export type Result_7 = { 'Ok' : GetAnalyzeAddressResult } |
  { 'Err' : string };
export type Time = bigint;
export type TokenType = { 'Fradium' : null } |
  { 'Ethereum' : null } |
  { 'Solana' : null } |
  { 'Unknown' : null } |
  { 'Bitcoin' : null };
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
  'analyze_address' : ActorMethod<[string], Result_7>,
  'check_faucet_claim' : ActorMethod<[], Result>,
  'claim_faucet' : ActorMethod<[], Result>,
  'create_analyze_history' : ActorMethod<
    [CreateAnalyzeHistoryParams],
    Result_6
  >,
  'create_report' : ActorMethod<[CreateReportParams], Result>,
  'get_analyze_history' : ActorMethod<[bigint, bigint], Result_6>,
  'get_analyze_history_count' : ActorMethod<[], Result_5>,
  'get_my_reports' : ActorMethod<[], Result_4>,
  'get_my_votes' : ActorMethod<[], Result_3>,
  'get_report' : ActorMethod<[ReportId], Result_2>,
  'get_reports' : ActorMethod<[], Result_1>,
  'unstake_created_report' : ActorMethod<[ReportId], Result>,
  'unstake_voted_report' : ActorMethod<[ReportId], Result>,
  'vote_report' : ActorMethod<[VoteReportParams], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

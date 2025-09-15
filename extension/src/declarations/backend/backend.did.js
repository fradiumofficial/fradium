export const idlFactory = ({ IDL }) => {
  const ReportId = IDL.Nat32;
  const Time = IDL.Int;
  const Result = IDL.Variant({ 'Ok' : IDL.Text, 'Err' : IDL.Text });
  const Voter = IDL.Record({
    'voter' : IDL.Principal,
    'vote' : IDL.Bool,
    'vote_weight' : IDL.Nat,
  });
  const Report = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'report_id' : ReportId,
    'voted_by' : IDL.Vec(Voter),
    'votes_no' : IDL.Nat,
    'chain' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : Time,
    'evidence' : IDL.Vec(IDL.Text),
    'vote_deadline' : Time,
    'address' : IDL.Text,
    'category' : IDL.Text,
    'votes_yes' : IDL.Nat,
    'reporter' : IDL.Principal,
  });
  const GetAnalyzeAddressResult = IDL.Record({
    'report' : IDL.Opt(Report),
    'is_safe' : IDL.Bool,
  });
  const Result_7 = IDL.Variant({
    'Ok' : GetAnalyzeAddressResult,
    'Err' : IDL.Text,
  });
  const TokenType = IDL.Variant({
    'Fradium' : IDL.Null,
    'Ethereum' : IDL.Null,
    'Solana' : IDL.Null,
    'Unknown' : IDL.Null,
    'Bitcoin' : IDL.Null,
  });
  const AnalyzeHistoryType = IDL.Variant({
    'AIAnalysis' : IDL.Null,
    'CommunityVote' : IDL.Null,
  });
  const CreateAnalyzeHistoryParams = IDL.Record({
    'is_safe' : IDL.Bool,
    'metadata' : IDL.Text,
    'address' : IDL.Text,
    'token_type' : TokenType,
    'analyzed_type' : AnalyzeHistoryType,
  });
  const AnalyzeHistory = IDL.Record({
    'is_safe' : IDL.Bool,
    'metadata' : IDL.Text,
    'created_at' : Time,
    'address' : IDL.Text,
    'token_type' : TokenType,
    'analyzed_type' : AnalyzeHistoryType,
  });
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(AnalyzeHistory),
    'Err' : IDL.Text,
  });
  const CreateReportParams = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'chain' : IDL.Text,
    'description' : IDL.Text,
    'evidence' : IDL.Vec(IDL.Text),
    'address' : IDL.Text,
    'category' : IDL.Text,
    'stake_amount' : IDL.Nat,
  });
  const Result_5 = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text });
  const GetMyReportsParams = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'report_id' : ReportId,
    'reward' : IDL.Nat,
    'unstaked_at' : IDL.Opt(Time),
    'voted_by' : IDL.Vec(Voter),
    'votes_no' : IDL.Nat,
    'chain' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : Time,
    'evidence' : IDL.Vec(IDL.Text),
    'vote_deadline' : Time,
    'address' : IDL.Text,
    'category' : IDL.Text,
    'votes_yes' : IDL.Nat,
    'stake_amount' : IDL.Nat,
    'reporter' : IDL.Principal,
  });
  const Result_4 = IDL.Variant({
    'Ok' : IDL.Vec(GetMyReportsParams),
    'Err' : IDL.Text,
  });
  const GetMyVotesParams = IDL.Record({
    'url' : IDL.Opt(IDL.Text),
    'report_id' : ReportId,
    'reward' : IDL.Nat,
    'unstaked_at' : IDL.Opt(Time),
    'voted_by' : IDL.Vec(Voter),
    'votes_no' : IDL.Nat,
    'vote_type' : IDL.Bool,
    'chain' : IDL.Text,
    'description' : IDL.Text,
    'created_at' : Time,
    'evidence' : IDL.Vec(IDL.Text),
    'vote_deadline' : Time,
    'address' : IDL.Text,
    'category' : IDL.Text,
    'votes_yes' : IDL.Nat,
    'stake_amount' : IDL.Nat,
    'reporter' : IDL.Principal,
  });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(GetMyVotesParams),
    'Err' : IDL.Text,
  });
  const Result_2 = IDL.Variant({ 'Ok' : Report, 'Err' : IDL.Text });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Vec(Report), 'Err' : IDL.Text });
  const VoteReportParams = IDL.Record({
    'report_id' : ReportId,
    'vote_type' : IDL.Bool,
    'stake_amount' : IDL.Nat,
  });
  return IDL.Service({
    'admin_change_report_deadline' : IDL.Func([ReportId, Time], [Result], []),
    'admin_delete_report' : IDL.Func([ReportId], [Result], []),
    'analyze_address' : IDL.Func([IDL.Text], [Result_7], []),
    'check_faucet_claim' : IDL.Func([], [Result], []),
    'claim_faucet' : IDL.Func([], [Result], []),
    'create_analyze_history' : IDL.Func(
        [CreateAnalyzeHistoryParams],
        [Result_6],
        [],
      ),
    'create_report' : IDL.Func([CreateReportParams], [Result], []),
    'get_analyze_history' : IDL.Func([IDL.Nat, IDL.Nat], [Result_6], []),
    'get_analyze_history_count' : IDL.Func([], [Result_5], []),
    'get_my_reports' : IDL.Func([], [Result_4], []),
    'get_my_votes' : IDL.Func([], [Result_3], []),
    'get_report' : IDL.Func([ReportId], [Result_2], ['query']),
    'get_reports' : IDL.Func([], [Result_1], ['query']),
    'unstake_created_report' : IDL.Func([ReportId], [Result], []),
    'unstake_voted_report' : IDL.Func([ReportId], [Result], []),
    'vote_report' : IDL.Func([VoteReportParams], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };

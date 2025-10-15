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
  const Result_12 = IDL.Variant({
    'Ok' : GetAnalyzeAddressResult,
    'Err' : IDL.Text,
  });
  const AnalyzeHistoryType = IDL.Variant({
    'AIAnalysis' : IDL.Null,
    'CommunityVote' : IDL.Null,
  });
  const CreateAnalyzeHistoryParams = IDL.Record({
    'is_safe' : IDL.Bool,
    'metadata' : IDL.Text,
    'address' : IDL.Text,
    'token_type' : IDL.Text,
    'analyzed_type' : AnalyzeHistoryType,
  });
  const AnalyzeHistory = IDL.Record({
    'is_safe' : IDL.Bool,
    'metadata' : IDL.Text,
    'created_at' : Time,
    'address' : IDL.Text,
    'token_type' : IDL.Text,
    'analyzed_type' : AnalyzeHistoryType,
  });
  const Result_11 = IDL.Variant({
    'Ok' : IDL.Vec(AnalyzeHistory),
    'Err' : IDL.Text,
  });
  const CreateTokenRequest = IDL.Record({ 'name' : IDL.Text });
  const TokenStatus = IDL.Variant({
    'active' : IDL.Null,
    'revoked' : IDL.Null,
    'expired' : IDL.Null,
  });
  const ApiToken = IDL.Record({
    'id' : IDL.Text,
    'status' : TokenStatus,
    'created' : Time,
    'principal' : IDL.Principal,
    'token' : IDL.Text,
    'name' : IDL.Text,
  });
  const CreateTokenResponse = IDL.Variant({
    'ok' : ApiToken,
    'err' : IDL.Text,
  });
  const TokenType = IDL.Variant({
    'BTC' : IDL.Null,
    'ETH' : IDL.Null,
    'ICP' : IDL.Null,
    'SOL' : IDL.Null,
    'ckBTC' : IDL.Null,
    'ckETH' : IDL.Null,
    'FRADIUM' : IDL.Null,
  });
  const CreateEscrowParams = IDL.Record({
    'token_to' : TokenType,
    'metadata' : IDL.Opt(IDL.Text),
    'duration_seconds' : IDL.Opt(IDL.Nat64),
    'recipient' : IDL.Opt(IDL.Principal),
    'description' : IDL.Opt(IDL.Text),
    'amount_from' : IDL.Nat,
    'amount_to' : IDL.Nat,
    'token_from' : TokenType,
  });
  const EscrowId = IDL.Nat64;
  const Result_1 = IDL.Variant({ 'Ok' : EscrowId, 'Err' : IDL.Text });
  const TokenType__1 = IDL.Variant({
    'BTC' : IDL.Null,
    'ETH' : IDL.Null,
    'ICP' : IDL.Null,
    'SOL' : IDL.Null,
    'Fradium' : IDL.Null,
    'ckBTC' : IDL.Null,
    'ckETH' : IDL.Null,
  });
  const CreatePaymentLinkParams = IDL.Record({
    'token' : TokenType__1,
    'amount' : IDL.Nat,
    'duration_nanos' : IDL.Nat,
    'custom_id' : IDL.Opt(IDL.Text),
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
  const RevokeTokenRequest = IDL.Record({ 'tokenId' : IDL.Text });
  const TokenOperationResponse = IDL.Variant({
    'ok' : IDL.Text,
    'err' : IDL.Text,
  });
  const EscrowMethod = IDL.Variant({
    'Native' : IDL.Null,
    'Wrapped' : IDL.Null,
  });
  const EscrowState = IDL.Variant({
    'Released' : IDL.Null,
    'Suspended' : IDL.Null,
    'Rejected' : IDL.Null,
    'Locked' : IDL.Null,
    'Cancelled' : IDL.Null,
    'AwaitingAccept' : IDL.Null,
    'Expired' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const EscrowRecord = IDL.Record({
    'escrow_method' : EscrowMethod,
    'deposit_expires_at' : IDL.Opt(Time),
    'token_to' : TokenType,
    'metadata' : IDL.Opt(IDL.Text),
    'accepted_at' : IDL.Opt(Time),
    'recipient' : IDL.Opt(IDL.Principal),
    'description' : IDL.Opt(IDL.Text),
    'created_at' : Time,
    'sender' : IDL.Principal,
    'deposit_from_done' : IDL.Bool,
    'state' : EscrowState,
    'amount_from' : IDL.Nat,
    'amount_to' : IDL.Nat,
    'deposit_to_done' : IDL.Bool,
    'escrow_id' : EscrowId,
    'token_from' : TokenType,
    'expires_at' : Time,
    'released_at' : IDL.Opt(Time),
  });
  const Result_10 = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : IDL.Text });
  const ApiUsageRecord = IDL.Record({
    'at' : Time,
    'status' : IDL.Text,
    'model' : IDL.Text,
    'cost' : IDL.Nat,
    'route' : IDL.Text,
    'reason' : IDL.Opt(IDL.Text),
  });
  const ApiApprovalRecord = IDL.Record({
    'at' : Time,
    'metadata' : IDL.Text,
    'amount_e8s' : IDL.Nat,
  });
  const GetTokensResponse = IDL.Variant({
    'ok' : IDL.Vec(ApiToken),
    'err' : IDL.Text,
  });
  const Result_9 = IDL.Variant({ 'Ok' : EscrowRecord, 'Err' : IDL.Text });
  const EscrowStats = IDL.Record({
    'by_state' : IDL.Vec(IDL.Tuple(EscrowState, IDL.Nat)),
    'total_volume_locked' : IDL.Nat,
    'suspended_escrows' : IDL.Nat,
    'total_escrows' : IDL.Nat,
    'completed_escrows' : IDL.Nat,
    'pending_escrows' : IDL.Nat,
  });
  const PaymentStatus = IDL.Variant({
    'Active' : IDL.Null,
    'Cancelled' : IDL.Null,
    'Completed' : IDL.Null,
    'Expired' : IDL.Null,
  });
  const CreatorAddresses = IDL.Record({
    'solana' : IDL.Text,
    'ethereum' : IDL.Text,
    'bitcoin' : IDL.Text,
  });
  const PaymentLink = IDL.Record({
    'id' : IDL.Text,
    'status' : PaymentStatus,
    'creator' : IDL.Principal,
    'token' : TokenType__1,
    'creator_addresses' : IDL.Opt(CreatorAddresses),
    'created_at' : Time,
    'payer' : IDL.Opt(IDL.Principal),
    'amount' : IDL.Nat,
    'expires_at' : Time,
  });
  const Result_8 = IDL.Variant({
    'Ok' : IDL.Vec(PaymentLink),
    'Err' : IDL.Text,
  });
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
  const Result_7 = IDL.Variant({
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
  const Result_6 = IDL.Variant({
    'Ok' : IDL.Vec(GetMyVotesParams),
    'Err' : IDL.Text,
  });
  const PaymentLinkPublic = IDL.Record({
    'status' : PaymentStatus,
    'creator' : IDL.Principal,
    'token' : TokenType__1,
    'creator_addresses' : IDL.Opt(CreatorAddresses),
    'created_at' : Time,
    'amount' : IDL.Nat,
    'expires_at' : Time,
  });
  const Result_5 = IDL.Variant({ 'Ok' : PaymentLinkPublic, 'Err' : IDL.Text });
  const GetMyEscrowsParams = IDL.Record({
    'escrow_method' : EscrowMethod,
    'token_to' : TokenType,
    'recipient' : IDL.Opt(IDL.Principal),
    'description' : IDL.Opt(IDL.Text),
    'created_at' : Time,
    'sender' : IDL.Principal,
    'state' : EscrowState,
    'amount_from' : IDL.Nat,
    'amount_to' : IDL.Nat,
    'escrow_id' : EscrowId,
    'token_from' : TokenType,
    'expires_at' : Time,
  });
  const Result_2 = IDL.Variant({
    'Ok' : IDL.Vec(GetMyEscrowsParams),
    'Err' : IDL.Text,
  });
  const Result_4 = IDL.Variant({ 'Ok' : Report, 'Err' : IDL.Text });
  const Result_3 = IDL.Variant({ 'Ok' : IDL.Vec(Report), 'Err' : IDL.Text });
  const HeaderField = IDL.Tuple(IDL.Text, IDL.Text);
  const HttpRequest = IDL.Record({
    'url' : IDL.Text,
    'method' : IDL.Text,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'certificate_version' : IDL.Opt(IDL.Nat16),
  });
  const HttpResponse = IDL.Record({
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HeaderField),
    'upgrade' : IDL.Opt(IDL.Bool),
    'streaming_strategy' : IDL.Opt(IDL.Null),
    'status_code' : IDL.Nat16,
  });
  const AcceptEscrowParams = IDL.Record({ 'escrow_id' : EscrowId });
  const RegenerateTokenRequest = IDL.Record({ 'tokenId' : IDL.Text });
  const VoteReportParams = IDL.Record({
    'report_id' : ReportId,
    'vote_type' : IDL.Bool,
    'stake_amount' : IDL.Nat,
  });
  return IDL.Service({
    'admin_change_report_deadline' : IDL.Func([ReportId, Time], [Result], []),
    'admin_delete_report' : IDL.Func([ReportId], [Result], []),
    'analyze_address' : IDL.Func([IDL.Text], [Result_12], []),
    'cancel_payment_link' : IDL.Func([IDL.Text], [Result], []),
    'check_faucet_claim' : IDL.Func([], [Result], []),
    'claim_faucet' : IDL.Func([], [Result], []),
    'create_analyze_history' : IDL.Func(
        [CreateAnalyzeHistoryParams],
        [Result_11],
        [],
      ),
    'create_api_token' : IDL.Func(
        [CreateTokenRequest],
        [CreateTokenResponse],
        [],
      ),
    'create_escrow' : IDL.Func([CreateEscrowParams], [Result_1], []),
    'create_payment_link' : IDL.Func([CreatePaymentLinkParams], [Result], []),
    'create_report' : IDL.Func([CreateReportParams], [Result], []),
    'delete_api_token' : IDL.Func(
        [RevokeTokenRequest],
        [TokenOperationResponse],
        [],
      ),
    'execute_payment_icrc' : IDL.Func([IDL.Text], [Result], []),
    'get_all_escrows' : IDL.Func([], [IDL.Vec(EscrowRecord)], ['query']),
    'get_all_escrows_paginated' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Record({ 'total' : IDL.Nat, 'items' : IDL.Vec(EscrowRecord) })],
        ['query'],
      ),
    'get_analyze_history' : IDL.Func([IDL.Nat, IDL.Nat], [Result_11], []),
    'get_analyze_history_count' : IDL.Func([], [Result_10], []),
    'get_api_analyze_history' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'offset' : IDL.Nat,
            'limit' : IDL.Nat,
            'items' : IDL.Vec(ApiUsageRecord),
          }),
        ],
        [],
      ),
    'get_api_approvals_history' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'offset' : IDL.Nat,
            'limit' : IDL.Nat,
            'items' : IDL.Vec(ApiApprovalRecord),
          }),
        ],
        [],
      ),
    'get_api_credits_stats' : IDL.Func(
        [],
        [IDL.Record({ 'used_e8s' : IDL.Nat, 'remaining_e8s' : IDL.Nat })],
        [],
      ),
    'get_api_token_info' : IDL.Func([IDL.Text], [IDL.Opt(ApiToken)], ['query']),
    'get_api_tokens' : IDL.Func([], [GetTokensResponse], []),
    'get_deposit_account' : IDL.Func(
        [EscrowId, IDL.Text],
        [
          IDL.Record({
            'sub' : IDL.Opt(IDL.Vec(IDL.Nat8)),
            'owner' : IDL.Principal,
          }),
        ],
        ['query'],
      ),
    'get_escrow' : IDL.Func([EscrowId], [Result_9], ['query']),
    'get_escrow_stats' : IDL.Func([], [EscrowStats], ['query']),
    'get_my_payment_links' : IDL.Func([], [Result_8], []),
    'get_my_reports' : IDL.Func([], [Result_7], []),
    'get_my_votes' : IDL.Func([], [Result_6], []),
    'get_open_escrows_paginated' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [IDL.Record({ 'total' : IDL.Nat, 'items' : IDL.Vec(EscrowRecord) })],
        ['query'],
      ),
    'get_payment_link_details' : IDL.Func([IDL.Text], [Result_5], ['query']),
    'get_received_escrows' : IDL.Func([], [Result_2], []),
    'get_received_escrows_paginated' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'offset' : IDL.Nat,
            'limit' : IDL.Nat,
            'items' : IDL.Vec(EscrowRecord),
          }),
        ],
        [],
      ),
    'get_report' : IDL.Func([ReportId], [Result_4], ['query']),
    'get_reports' : IDL.Func([], [Result_3], ['query']),
    'get_sent_escrows' : IDL.Func([], [Result_2], []),
    'get_sent_escrows_paginated' : IDL.Func(
        [IDL.Nat, IDL.Nat],
        [
          IDL.Record({
            'total' : IDL.Nat,
            'offset' : IDL.Nat,
            'limit' : IDL.Nat,
            'items' : IDL.Vec(EscrowRecord),
          }),
        ],
        [],
      ),
    'http_request' : IDL.Func([HttpRequest], [HttpResponse], ['query']),
    'http_request_update' : IDL.Func([HttpRequest], [HttpResponse], []),
    'join_escrow' : IDL.Func([AcceptEscrowParams], [Result_1], []),
    'mark_deposit' : IDL.Func([EscrowId], [Result], []),
    'record_api_approval' : IDL.Func([IDL.Nat, IDL.Text], [], []),
    'record_native_payment' : IDL.Func([IDL.Text, IDL.Text], [Result], []),
    'regenerate_api_token' : IDL.Func(
        [RegenerateTokenRequest],
        [TokenOperationResponse],
        [],
      ),
    'release_escrow' : IDL.Func([EscrowId], [Result], []),
    'revoke_api_token' : IDL.Func(
        [RevokeTokenRequest],
        [TokenOperationResponse],
        [],
      ),
    'unstake_created_report' : IDL.Func([ReportId], [Result], []),
    'unstake_voted_report' : IDL.Func([ReportId], [Result], []),
    'validate_api_token' : IDL.Func(
        [IDL.Text],
        [IDL.Opt(IDL.Principal)],
        ['query'],
      ),
    'vote_report' : IDL.Func([VoteReportParams], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };

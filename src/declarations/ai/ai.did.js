export const idlFactory = ({ IDL }) => {
  const RansomwareResult = IDL.Record({
    'transactions_analyzed' : IDL.Nat32,
    'threshold_used' : IDL.Float64,
    'data_source' : IDL.Text,
    'is_ransomware' : IDL.Bool,
    'address' : IDL.Text,
    'chain_type' : IDL.Text,
    'confidence' : IDL.Float64,
    'confidence_level' : IDL.Text,
    'ransomware_probability' : IDL.Float64,
  });
  const Result = IDL.Variant({ 'Ok' : RansomwareResult, 'Err' : IDL.Text });
  const HttpHeader = IDL.Record({ 'value' : IDL.Text, 'name' : IDL.Text });
  const HttpResponse = IDL.Record({
    'status' : IDL.Nat,
    'body' : IDL.Vec(IDL.Nat8),
    'headers' : IDL.Vec(HttpHeader),
  });
  const TransformArgs = IDL.Record({
    'context' : IDL.Vec(IDL.Nat8),
    'response' : HttpResponse,
  });
  return IDL.Service({
    'analyze_btc_address' : IDL.Func(
        [IDL.Vec(IDL.Float32), IDL.Text, IDL.Nat32],
        [Result],
        [],
      ),
    'analyze_eth_address' : IDL.Func(
        [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Float64)), IDL.Text, IDL.Nat32],
        [Result],
        [],
      ),
    'analyze_sol_address' : IDL.Func([IDL.Text], [Result], []),
    'transform' : IDL.Func([TransformArgs], [HttpResponse], ['query']),
    'transform_helius_response' : IDL.Func(
        [TransformArgs],
        [HttpResponse],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };

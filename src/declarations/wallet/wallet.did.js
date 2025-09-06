export const idlFactory = ({ IDL }) => {
  const NetworkChoice = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Local' : IDL.Null,
  });
  const SendRequest = IDL.Record({
    'destination_address' : IDL.Text,
    'amount_in_satoshi' : IDL.Nat64,
  });
  const Outpoint = IDL.Record({
    'txid' : IDL.Vec(IDL.Nat8),
    'vout' : IDL.Nat32,
  });
  const Utxo = IDL.Record({
    'height' : IDL.Nat32,
    'value' : IDL.Nat64,
    'outpoint' : Outpoint,
  });
  const GetUtxosResponse = IDL.Record({
    'next_page' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'tip_height' : IDL.Nat32,
    'tip_block_hash' : IDL.Vec(IDL.Nat8),
    'utxos' : IDL.Vec(Utxo),
  });
  const Addresses = IDL.Record({
    'solana' : IDL.Text,
    'icp_account' : IDL.Text,
    'ethereum' : IDL.Text,
    'icp_principal' : IDL.Text,
    'bitcoin' : IDL.Text,
  });
  return IDL.Service({
    'bitcoin_address' : IDL.Func([], [IDL.Text], []),
    'bitcoin_balance' : IDL.Func([IDL.Text], [IDL.Nat64], []),
    'bitcoin_current_fee_percentiles' : IDL.Func([], [IDL.Vec(IDL.Nat64)], []),
    'bitcoin_send' : IDL.Func([SendRequest], [IDL.Text], []),
    'bitcoin_utxos' : IDL.Func([IDL.Text], [GetUtxosResponse], []),
    'ethereum_address' : IDL.Func([], [IDL.Text], []),
    'ethereum_balance' : IDL.Func([IDL.Text], [IDL.Text], []),
    'ethereum_send' : IDL.Func([IDL.Text, IDL.Nat], [IDL.Text], []),
    'solana_address' : IDL.Func([], [IDL.Text], []),
    'solana_balance' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'solana_send' : IDL.Func([IDL.Text, IDL.Nat], [IDL.Text], []),
    'wallet_addresses' : IDL.Func([], [Addresses], []),
  });
};
export const init = ({ IDL }) => {
  const NetworkChoice = IDL.Variant({
    'Mainnet' : IDL.Null,
    'Local' : IDL.Null,
  });
  return [NetworkChoice];
};

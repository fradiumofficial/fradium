import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Addresses {
  'solana' : string,
  'icp_account' : string,
  'ethereum' : string,
  'icp_principal' : string,
  'bitcoin' : string,
}
export interface GetUtxosResponse {
  'next_page' : [] | [Uint8Array | number[]],
  'tip_height' : number,
  'tip_block_hash' : Uint8Array | number[],
  'utxos' : Array<Utxo>,
}
export type NetworkChoice = { 'Mainnet' : null } |
  { 'Local' : null };
export interface Outpoint { 'txid' : Uint8Array | number[], 'vout' : number }
export interface SendRequest {
  'destination_address' : string,
  'amount_in_satoshi' : bigint,
}
export interface Utxo {
  'height' : number,
  'value' : bigint,
  'outpoint' : Outpoint,
}
export interface _SERVICE {
  'bitcoin_address' : ActorMethod<[], string>,
  'bitcoin_balance' : ActorMethod<[], bigint>,
  'bitcoin_current_fee_percentiles' : ActorMethod<
    [],
    BigUint64Array | bigint[]
  >,
  'bitcoin_send' : ActorMethod<[SendRequest], string>,
  'bitcoin_utxos' : ActorMethod<[string], GetUtxosResponse>,
  'ethereum_address' : ActorMethod<[], string>,
  'ethereum_balance' : ActorMethod<[], string>,
  'ethereum_send' : ActorMethod<[string, bigint], string>,
  'solana_address' : ActorMethod<[], string>,
  'solana_balance' : ActorMethod<[], bigint>,
  'solana_send' : ActorMethod<[string, bigint], string>,
  'wallet_addresses' : ActorMethod<[], Addresses>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

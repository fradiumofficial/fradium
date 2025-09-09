import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface HttpHeader { 'value' : string, 'name' : string }
export interface HttpResponse {
  'status' : bigint,
  'body' : Uint8Array | number[],
  'headers' : Array<HttpHeader>,
}
export interface RansomwareResult {
  'transactions_analyzed' : number,
  'threshold_used' : number,
  'data_source' : string,
  'is_ransomware' : boolean,
  'address' : string,
  'chain_type' : string,
  'confidence' : number,
  'confidence_level' : string,
  'ransomware_probability' : number,
}
export type Result = { 'Ok' : RansomwareResult } |
  { 'Err' : string };
export interface TransformArgs {
  'context' : Uint8Array | number[],
  'response' : HttpResponse,
}
export interface _SERVICE {
  'analyze_btc_address' : ActorMethod<[Array<number>, string, number], Result>,
  'analyze_eth_address' : ActorMethod<
    [Array<[string, number]>, string, number],
    Result
  >,
  'analyze_sol_address' : ActorMethod<[string], Result>,
  'transform' : ActorMethod<[TransformArgs], HttpResponse>,
  'transform_helius_response' : ActorMethod<[TransformArgs], HttpResponse>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

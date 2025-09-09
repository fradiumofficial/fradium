import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type Result = { 'Ok' : string } |
  { 'Err' : string };
export interface _SERVICE { 'ask' : ActorMethod<[string], Result> }
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];

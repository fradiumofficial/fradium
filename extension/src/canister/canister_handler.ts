import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { CANISTER_HOST, getCanisterId } from '../lib/config';
import type { RansomwareResult } from './canister_result';

// Define the canister interface based on your Rust backend
export interface RansomwareDetectorService {
  predict_from_features: (address: string, features: number[]) => Promise<{ Ok?: RansomwareResult; Err?: string }>;
  get_model_info: () => Promise<{ Ok?: string; Err?: string }>;
}

// Create the agent for ICP communication
export const createAgent = async (): Promise<HttpAgent> => {
  const agent = new HttpAgent({
    host: CANISTER_HOST,
  });

  // Only fetch root key in local development
  if (CANISTER_HOST.includes('127.0.0.1')) {
    await agent.fetchRootKey();
  }

  return agent;
};

// Create the canister actor
export const createRansomwareDetectorActor = async (): Promise<RansomwareDetectorService> => {
  const agent = await createAgent();
  const canisterId = getCanisterId('ransomware_detector');

  if (!canisterId) {
    throw new Error('Ransomware detector canister ID not found');
  }

  return Actor.createActor<RansomwareDetectorService>(
    ({ IDL }) => {
      // Define the IDL interface matching your Rust backend
      const RansomwareResult = IDL.Record({
        address: IDL.Text,
        ransomware_probability: IDL.Float64,
        confidence_level: IDL.Text,
        threshold_used: IDL.Float64,
        transactions_analyzed: IDL.Nat32,
        is_ransomware: IDL.Bool,
        confidence: IDL.Float64,
      });

      const Result = IDL.Variant({
        Ok: RansomwareResult,
        Err: IDL.Text,
      });

      const ResultString = IDL.Variant({
        Ok: IDL.Text,
        Err: IDL.Text,
      });

      return IDL.Service({
        analyze_address: IDL.Func([IDL.Text, IDL.Vec(IDL.Float32)], [Result], []),
        predict_from_features: IDL.Func([IDL.Text, IDL.Vec(IDL.Float32)], [Result], []),
        get_model_info: IDL.Func([], [ResultString], ['query']),
      });
    },
    {
      agent,
      canisterId: Principal.fromText(canisterId),
    }
  );
};
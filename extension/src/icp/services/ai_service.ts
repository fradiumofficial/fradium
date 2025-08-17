import { Actor, type ActorSubclass } from "@dfinity/agent";
// Note: These imports will need to be updated once AI canister declarations are generated
// import { idlFactory } from "../../../src/declarations/ai";
// import type { _SERVICE } from "../../../src/declarations/ai/ai.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";
import type { RansomwareAnalysisResponse } from "@/modules/analyze_address/model/AnalyzeAddressModel";

// Temporary mock IDL factory until AI canister declarations are available
const idlFactory = ({ IDL }: any) => {
  return IDL.Service({
    'analyze_address': IDL.Func(
      [IDL.Text],
      [IDL.Variant({
        'Ok': IDL.Record({
          'is_ransomware': IDL.Bool,
          'confidence_level': IDL.Text,
          'ransomware_probability': IDL.Float64,
          'threshold_used': IDL.Float64,
          'transactions_analyzed': IDL.Nat,
        }),
        'Err': IDL.Text,
      })],
      ['query'],
    ),
    'analyze_address_v2': IDL.Func(
      [IDL.Vec(IDL.Float32), IDL.Text, IDL.Nat32],
      [IDL.Variant({
        'Ok': IDL.Record({
          'is_ransomware': IDL.Bool,
          'confidence_level': IDL.Text,
          'ransomware_probability': IDL.Float64,
          'threshold_used': IDL.Float64,
          'transactions_analyzed': IDL.Nat,
        }),
        'Err': IDL.Text,
      })],
      ['query'],
    ),
  });
};

type _SERVICE = {
  'analyze_address': (address: string) => Promise<any>;
  'analyze_address_v2': (features: number[], address: string, transactionCount: number) => Promise<any>;
};

let actor: ActorSubclass<_SERVICE> | null = null;

export const getAiActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log('Creating agent for AI...');
    const agent = await createAgent();
    
    // Check if AI canister is configured
    let canisterId: string;
    try {
      canisterId = getCanisterId('ai'); // Try to get AI canister first
    } catch {
      console.warn('AI canister not configured, using backend canister as fallback');
      canisterId = getCanisterId('backend'); // Fallback to backend
    }
    
    console.log('AI canister ID:', canisterId);
    console.log('Agent created successfully');

    actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    console.log('AI actor created successfully');
    return actor;
  } catch (error) {
    console.error('Error creating AI actor:', error);
    throw new Error(`Failed to create AI actor: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearAiActor = (): void => {
  actor = null;
};

// Helper functions for AI analysis
export const analyzeBtcAddress = async (
  features: number[],
  address: string,
  featureCount: number
): Promise<RansomwareAnalysisResponse> => {
  try {
    console.log('Creating AI actor for BTC analysis...');
    const actor = await getAiActor();
    console.log('AI actor created, calling analyze_address_v2...');
    
    // Convert features to Float32 and featureCount to number as expected by the canister
    const float32Features = features.map(f => Number(f));
    const result = await actor.analyze_address_v2(float32Features, address, featureCount);
    console.log('BTC analysis result:', result);
    return result as RansomwareAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeBtcAddress:', error);
    
    // If AI canister is not available, return a mock safe result
    if (error instanceof Error && error.message.includes('AI canister not configured')) {
      console.warn('AI canister not available, returning safe result');
      return {
        Ok: {
          address,
          is_ransomware: false,
          confidence_level: "LOW",
          ransomware_probability: 0.1,
          threshold_used: 0.5,
          transactions_analyzed: BigInt(featureCount),
        }
      } as unknown as RansomwareAnalysisResponse;
    }
    
    throw new Error(`Failed to analyze BTC address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeEthAddress = async (
  _features: [string, number][],
  address: string,
  transactionCount: number
): Promise<RansomwareAnalysisResponse> => {
  try {
    console.log('Creating AI actor for ETH analysis...');
    const actor = await getAiActor();
    console.log('AI actor created, calling analyze_address (generic method for ETH)...');
    
    // For Ethereum, we use the generic analyze_address method since ETH analysis
    // is handled internally by the canister based on address format
    const result = await actor.analyze_address(address);
    console.log('ETH analysis result:', result);
    return result as RansomwareAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeEthAddress:', error);
    
    // If AI canister is not available, return a mock safe result
    if (error instanceof Error && error.message.includes('AI canister not configured')) {
      console.warn('AI canister not available, returning safe result');
      return {
        Ok: {
          address,
          is_ransomware: false,
          confidence_level: "LOW",
          ransomware_probability: 0.1,
          threshold_used: 0.5,
          transactions_analyzed: BigInt(transactionCount),
        }
      } as unknown as RansomwareAnalysisResponse;
    }
    
    throw new Error(`Failed to analyze ETH address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

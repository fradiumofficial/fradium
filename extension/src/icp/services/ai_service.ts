import { Actor, type ActorSubclass } from "@dfinity/agent";
import { idlFactory } from "../../../../src/declarations/ai";
import type { _SERVICE } from "../../../../src/declarations/ai/ai.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";
import type { RansomwareAnalysisResponse } from "@/modules/analyze_address/model/AnalyzeAddressModel";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getAiActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log('Creating agent for AI...');
    const agent = await createAgent();
    const canisterId = getCanisterId('ai');
    
    console.log('AI canister ID:', canisterId);
    console.log('Agent created successfully');

    actor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

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
    console.log('AI actor created, calling analyze_btc_address...');
    
    // Convert features to Float32 and featureCount to number as expected by the canister
    const float32Features = features.map(f => Number(f));
    const result = await actor.analyze_btc_address(float32Features, address, featureCount);
    console.log('BTC analysis result:', result);
    return result as RansomwareAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeBtcAddress:', error);
    throw new Error(`Failed to analyze BTC address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeEthAddress = async (
  features: [string, number][],
  address: string,
  transactionCount: number
): Promise<RansomwareAnalysisResponse> => {
  try {
    console.log('Creating AI actor for ETH analysis...');
    const actor = await getAiActor();
    console.log('AI actor created, calling analyze_eth_address...');
    
    // Use the specific ETH analysis method with features
    const result = await actor.analyze_eth_address(features, address, transactionCount);
    console.log('ETH analysis result:', result);
    return result as RansomwareAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeEthAddress:', error);
    throw new Error(`Failed to analyze ETH address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeSolAddress = async (address: string): Promise<RansomwareAnalysisResponse> => {
  try {
    console.log('Creating AI actor for SOL analysis...');
    const actor = await getAiActor();
    console.log('AI actor created, calling analyze_sol_address...');
    
    const result = await actor.analyze_sol_address(address);
    console.log('SOL analysis result:', result);
    return result as RansomwareAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeSolAddress:', error);
    throw new Error(`Failed to analyze SOL address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

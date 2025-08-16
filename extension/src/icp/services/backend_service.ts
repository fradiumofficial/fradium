import { Actor, type ActorSubclass, type Identity } from "@dfinity/agent";
import { idlFactory } from "../../../../src/declarations/backend";
import type { _SERVICE } from "../../../../src/declarations/backend/backend.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";
import type { CommunityAnalysisResponse } from "@/modules/analyze_address/model/AnalyzeAddressModel";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getBackendActor = async (identity?: Identity): Promise<ActorSubclass<_SERVICE>> => {
  // Clear cached actor if identity changes
  if (identity && actor) {
    actor = null;
  }
  
  if (actor && !identity) {
    return actor;
  }

  try {
    console.log('Creating agent for backend...');
    const agent = await createAgent(identity);
    const canisterId = getCanisterId('backend');
    
    console.log('Backend canister ID:', canisterId);
    console.log('Agent created successfully');

    const newActor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    // Only cache if no specific identity (for anonymous calls)
    if (!identity) {
      actor = newActor;
    }

    console.log('Backend actor created successfully');
    return newActor;
  } catch (error) {
    console.error('Error creating backend actor:', error);
    throw new Error(`Failed to create backend actor: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearBackendActor = (): void => {
  actor = null;
};

// Import types from backend declarations
import type { 
  CreateWalletParams, 
  WalletAddress, 
  UserWallet 
} from "../../../../src/declarations/backend/backend.did";

// Helper functions for common backend operations
export const analyzeAddressCommunity = async (address: string): Promise<CommunityAnalysisResponse>  => {
  try {
    console.log('Creating backend actor...');
    const actor = await getBackendActor();
    console.log('Backend actor created, calling analyze_address...');
    const result = await actor.analyze_address(address);
    console.log('Analysis result:', result);
    return result as CommunityAnalysisResponse;
  } catch (error) {
    console.error('Error in analyzeAddressCommunity:', error);
    throw new Error(`Failed to analyze address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Wallet functions
export const createWallet = async (walletData: CreateWalletParams, identity?: Identity): Promise<{ Ok: UserWallet } | { Err: string }> => {
  try {
    console.log('BackendService: Creating wallet...', walletData);
    console.log('BackendService: Using identity:', identity ? 'authenticated' : 'anonymous');
    const actor = await getBackendActor(identity);
    const result = await actor.create_wallet(walletData);
    console.log('BackendService: Create wallet result:', result);
    return result as { Ok: UserWallet } | { Err: string };
  } catch (error) {
    console.error('Error in createWallet:', error);
    throw new Error(`Failed to create wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const getUserWallet = async (identity?: Identity): Promise<{ Ok: UserWallet } | { Err: string }> => {
  try {
    console.log('BackendService: Getting user wallet...');
    console.log('BackendService: Using identity:', identity ? 'authenticated' : 'anonymous');
    const actor = await getBackendActor(identity);
    const result = await actor.get_wallet();
    console.log('BackendService: Get wallet result:', result);
    return result as { Ok: UserWallet } | { Err: string };
  } catch (error) {
    console.error('Error in getUserWallet:', error);
    throw new Error(`Failed to get wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Export types for use in other files
export type { WalletAddress, CreateWalletParams, UserWallet };

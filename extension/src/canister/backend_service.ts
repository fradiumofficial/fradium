import { Actor, type ActorSubclass } from "@dfinity/agent";
import { idlFactory } from "../../../src/declarations/backend";
import type { _SERVICE } from "../../../src/declarations/backend/backend.did";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getBackendActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log('Creating agent for backend...');
    const agent = await createAgent();
    const canisterId = getCanisterId('backend');
    
    console.log('Backend canister ID:', canisterId);
    console.log('Agent created successfully');

    actor = Actor.createActor(idlFactory, {
      agent,
      canisterId,
    });

    console.log('Backend actor created successfully');
    return actor;
  } catch (error) {
    console.error('Error creating backend actor:', error);
    throw new Error(`Failed to create backend actor: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const clearBackendActor = (): void => {
  actor = null;
};

// Helper functions for common backend operations
export const analyzeAddressCommunity = async (address: string) => {
  try {
    console.log('Creating backend actor...');
    const actor = await getBackendActor();
    console.log('Backend actor created, calling analyze_address...');
    const result = await actor.analyze_address(address);
    console.log('Analysis result:', result);
    return result;
  } catch (error) {
    console.error('Error in analyzeAddressCommunity:', error);
    throw new Error(`Failed to analyze address: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
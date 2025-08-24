import { CANISTER_HOST } from "@/lib/config";
import { HttpAgent, type Identity } from "@dfinity/agent";

export const createAgent = async (identity?: Identity): Promise<HttpAgent> => {
  try {
    console.log('Creating HttpAgent with host:', CANISTER_HOST);
    console.log('Using identity:', identity ? 'authenticated' : 'anonymous');
    
    const agent = new HttpAgent({
      host: CANISTER_HOST,
      identity, // Use the provided identity
      // Add fetch polyfill for browser extension
      fetch: globalThis.fetch?.bind?.(globalThis) || fetch,
      // Add retry configuration
      retryTimes: 3,
    });

    // Only fetch root key for local development
    if (CANISTER_HOST.includes('127.0.0.1') || CANISTER_HOST.includes('localhost')) {
      console.log('Fetching root key for local development...');
      await agent.fetchRootKey();
    } else {
      console.log('Using IC mainnet - skipping root key fetch');
    }

    console.log('HttpAgent created successfully');
    return agent;
  } catch (error) {
    console.error('Error creating HttpAgent:', error);
    throw new Error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
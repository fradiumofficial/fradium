import { Actor, type ActorSubclass, type Identity } from "@dfinity/agent";
import type { _SERVICE } from "../../../../src/declarations/solana/solana.did";
import { idlFactory } from "../../../../src/declarations/solana";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getSolanaActor = async (identity?: Identity): Promise<ActorSubclass<_SERVICE>> => {
  // Clear cached actor if identity changes
  if (identity && actor) {
    actor = null;
  }
  
  if (actor && !identity) {
    return actor;
  }

  try {
    console.log("Creating agent for Solana...");
    console.log("Solana: Using identity:", identity ? 'authenticated' : 'anonymous');
    const agent = await createAgent(identity);
    const canisterId = getCanisterId("solana");

    console.log("Solana canister ID:", canisterId);
    console.log("Agent created successfully");

    const newActor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    // Only cache if no specific identity (for anonymous calls)
    if (!identity) {
      actor = newActor;
    }

    console.log("Solana actor created successfully");
    return newActor;
  } catch (error) {
    console.error("Error creating Solana actor:", error);
    throw new Error(
      `Failed to create Solana actor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const clearSolanaActor = (): void => {
  actor = null;
};

export const getSolanaAddress = async (identity: Identity): Promise<string> => {
  try {
    console.log('getSolanaAddress: Starting with identity:', identity.getPrincipal().toText());
    const actor = await getSolanaActor(identity);
    console.log('getSolanaAddress: Actor created successfully');
    const address = await actor.solana_account([identity.getPrincipal()]);
    console.log('getSolanaAddress: Received address from canister:', address);
    return address;
  } catch (error) {
    console.error('getSolanaAddress: Error occurred:', error);
    throw error;
  }
};

export const getSolanaBalance = async (address: string, identity?: Identity): Promise<bigint> => {
  try {
    console.log('getSolanaBalance: Starting for address:', address);
    console.log('getSolanaBalance: Using identity:', identity ? 'authenticated' : 'anonymous');
    const actor = await getSolanaActor(identity);
    const balance = await actor.get_balance([address]);
    console.log('getSolanaBalance: Received balance:', balance.toString());
    return balance;
  } catch (error) {
    console.error('getSolanaBalance: Error occurred:', error);
    throw error;
  }
};

// Get balances for multiple Solana addresses
export const getSolanaBalances = async (addresses: string[], identity?: Identity): Promise<{ balances: Record<string, number>; errors: Record<string, string> }> => {
  const balances: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const address of addresses) {
    try {
      const balance = await getSolanaBalance(address, identity);
      balances[address] = Number(balance);
      console.log(`Solana balance for ${address}: ${balance}`);
    } catch (error) {
      console.error(`Error getting Solana balance for ${address}:`, error);
      errors[address] = error instanceof Error ? error.message : 'Unknown error';
      balances[address] = 0;
    }
  }

  return { balances, errors };
};

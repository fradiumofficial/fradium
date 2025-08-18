import { Actor, type ActorSubclass, type Identity } from "@dfinity/agent";
import type { _SERVICE } from "../../../../src/declarations/solana/solana.did";
import { idlFactory } from "../../../../src/declarations/solana";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getSolanaActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log("Creating agent for Solana...");
    const agent = await createAgent();
    const canisterId = getCanisterId("solana");

    console.log("Solana canister ID:", canisterId);
    console.log("Agent created successfully");

    actor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    console.log("Solana actor created successfully");
    return actor;
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
    const actor = await getSolanaActor();
    console.log('getSolanaAddress: Actor created successfully');
    const address = await actor.solana_account([identity.getPrincipal()]);
    console.log('getSolanaAddress: Received address from canister:', address);
    return address;
  } catch (error) {
    console.error('getSolanaAddress: Error occurred:', error);
    throw error;
  }
};

export const getSolanaBalance = async (address: string): Promise<bigint> => {
  const actor = await getSolanaActor();
  const balance = await actor.get_balance([address]);
  return balance;
};

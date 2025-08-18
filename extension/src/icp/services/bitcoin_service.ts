import { Actor, type ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../src/declarations/bitcoin/bitcoin.did";
import { idlFactory } from "../../../../src/declarations/bitcoin";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getBitcoinActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log("Creating agent for Bitcoin...");
    const agent = await createAgent();
    const canisterId = getCanisterId("bitcoin");

    console.log("Bitcoin canister ID:", canisterId);
    console.log("Agent created successfully");

    actor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    console.log("Bitcoin actor created successfully");
    return actor;
  } catch (error) {
    console.error("Error creating Bitcoin actor:", error);
    throw new Error(
      `Failed to create Bitcoin actor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const clearBitcoinActor = (): void => {
  actor = null;
};

export const getBitcoinAddress = async (): Promise<string> => {
  try {
    console.log('getBitcoinAddress: Starting...');
    const actor = await getBitcoinActor();
    console.log('getBitcoinAddress: Actor created successfully');
    const address = await actor.get_p2pkh_address();
    console.log('getBitcoinAddress: Received address from canister:', address);
    return address;
  } catch (error) {
    console.error('getBitcoinAddress: Error occurred:', error);
    throw error;
  }
};

export const getBitcoinBalance = async (address: string): Promise<bigint> => {
  const actor = await getBitcoinActor();
  const balance = await actor.get_balance(address);
  return balance;
};
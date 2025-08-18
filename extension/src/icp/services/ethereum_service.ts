import { Actor, type ActorSubclass } from "@dfinity/agent";
import type { _SERVICE } from "../../../../src/declarations/ethereum/ethereum.did";
import { idlFactory } from "../../../../src/declarations/ethereum";
import { createAgent } from "./base_service";
import { getCanisterId } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getEthereumActor = async (): Promise<ActorSubclass<_SERVICE>> => {
  if (actor) {
    return actor;
  }

  try {
    console.log("Creating agent for Ethereum...");
    const agent = await createAgent();
    const canisterId = getCanisterId("ethereum");

    console.log("Ethereum canister ID:", canisterId);
    console.log("Agent created successfully");

    actor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    console.log("Ethereum actor created successfully");
    return actor;
  } catch (error) {
    console.error("Error creating Ethereum actor:", error);
    throw new Error(
      `Failed to create Ethereum actor: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const clearEthereumActor = (): void => {
  actor = null;
};

export const getEthereumAddress = async (): Promise<string> => {
  try {
    console.log('getEthereumAddress: Starting...');
    const actor = await getEthereumActor();
    console.log('getEthereumAddress: Actor created successfully');
    const response = await actor.get_address();
    
    if ("Ok" in response) {
      console.log('getEthereumAddress: Received address from canister:', response.Ok);
      return response.Ok;
    } else {
      console.error('getEthereumAddress: Error from canister:', response.Err);
      throw new Error(`Failed to get Ethereum address: ${response.Err}`);
    }
  } catch (error) {
    console.error('getEthereumAddress: Error occurred:', error);
    throw error;
  }
};

export const getEthereumBalance = async (address: string): Promise<bigint> => {
  try {
    console.log('getEthereumBalance: Starting for address:', address);
    const actor = await getEthereumActor();
    const response = await actor.get_balance(address);
    
    if ("Ok" in response) {
      console.log('getEthereumBalance: Received balance:', response.Ok.toString());
      return BigInt(response.Ok);
    } else {
      console.error('getEthereumBalance: Error from canister:', response.Err);
      throw new Error(`Failed to get Ethereum balance: ${response.Err}`);
    }
  } catch (error) {
    console.error('getEthereumBalance: Error occurred:', error);
    throw error;
  }
};

// Get balances for multiple Ethereum addresses
export const getEthereumBalances = async (addresses: string[]): Promise<{ balances: Record<string, number>; errors: Record<string, string> }> => {
  const balances: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const address of addresses) {
    try {
      const balance = await getEthereumBalance(address);
      balances[address] = Number(balance);
      console.log(`Ethereum balance for ${address}: ${balance}`);
    } catch (error) {
      console.error(`Error getting Ethereum balance for ${address}:`, error);
      errors[address] = error instanceof Error ? error.message : 'Unknown error';
      balances[address] = 0;
    }
  }

  return { balances, errors };
};

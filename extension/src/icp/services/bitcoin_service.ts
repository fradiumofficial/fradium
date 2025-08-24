import { Actor, type ActorSubclass, type Identity } from "@dfinity/agent";
import type { _SERVICE } from "../../../../src/declarations/bitcoin/bitcoin.did";
import { idlFactory } from "../../../../src/declarations/bitcoin";
import { createAgent } from "./base_service";
import { getCanisterId, BITCOIN_CONFIG } from "@/lib/config";

let actor: ActorSubclass<_SERVICE> | null = null;

export const getBitcoinActor = async (identity?: Identity): Promise<ActorSubclass<_SERVICE>> => {
  // Clear cached actor if an explicit identity is provided to ensure per-user actor
  if (identity && actor) {
    actor = null;
  }

  if (actor && !identity) {
    return actor;
  }

  try {
    console.log("Creating agent for Bitcoin...");
    console.log("Bitcoin: Using identity:", identity ? 'authenticated' : 'anonymous');
    const agent = await createAgent(identity);
    const canisterId = getCanisterId("bitcoin");

    console.log("Bitcoin canister ID:", canisterId);
    console.log("Agent created successfully");

    const newActor = Actor.createActor(idlFactory as any, {
      agent,
      canisterId,
    }) as ActorSubclass<_SERVICE>;

    // Cache only if no specific identity (anonymous)
    if (!identity) {
      actor = newActor;
    }

    console.log("Bitcoin actor created successfully");
    return newActor;
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

export const getBitcoinAddress = async (identity?: Identity): Promise<string> => {
  try {
    console.log('getBitcoinAddress: Starting...');
    const actor = await getBitcoinActor(identity);
    console.log('getBitcoinAddress: Actor created successfully');
    const address = await actor.get_p2pkh_address();
    console.log('getBitcoinAddress: Received address from canister:', address);
    
    // Validate that this is a new address with no balance
    try {
      const balance = await actor.get_balance(address);
      if (Number(balance) > 0) {
        console.warn('getBitcoinAddress: Warning - new address has non-zero balance:', balance.toString());
        // For new wallets, we should ensure balance is 0
        // This might indicate the canister has a faucet enabled
      }
    } catch (balanceError) {
      console.log('getBitcoinAddress: Could not check initial balance (expected for new addresses):', balanceError);
    }
    
    return address;
  } catch (error) {
    console.error('getBitcoinAddress: Error occurred:', error);
    throw error;
  }
};

export const getBitcoinBalance = async (address: string, identity?: Identity): Promise<bigint> => {
  try {
    console.log('getBitcoinBalance: Starting for address:', address);
    const actor = await getBitcoinActor(identity);
    const balance = await actor.get_balance(address);
    console.log('getBitcoinBalance: Received balance:', balance.toString());
    
    // CRITICAL FIX: Ensure new addresses start with 0 balance
    // This prevents the $5 bug where new accounts get testnet coins
    const balanceNumber = Number(balance);
    
    // Check if this is a newly created address (first time checking balance)
    const isNewAddress = await isFirstTimeBalanceCheck(address);
    
    if (isNewAddress && balanceNumber > 0) {
      console.warn(`getBitcoinBalance: New address ${address} has non-zero balance ${balanceNumber}. This may indicate testnet faucet is enabled.`);
      console.warn('getBitcoinBalance: For production, new addresses should start with 0 balance.');
      
      // For new addresses in production, we should return 0
      // But for development/testnet, we might want to allow this
      if (BITCOIN_CONFIG.isProduction()) {
        console.warn('getBitcoinBalance: Production environment detected. Returning 0 for new address with non-zero balance.');
        return BigInt(0);
      }
    }

    // If canister reports 0, attempt an external fallback to avoid stale 0 balances
    if (balanceNumber === 0) {
      try {
        const resp = await fetch(`https://mempool.space/api/address/${address}`);
        if (resp.ok) {
          const data = await resp.json();
          const funded = Number((data?.chain_stats?.funded_txo_sum) || 0);
          const spent = Number((data?.chain_stats?.spent_txo_sum) || 0);
          const extSatoshi = Math.max(funded - spent, 0);
          if (extSatoshi > 0) {
            console.log('getBitcoinBalance: External API indicates non-zero satoshi balance, using fallback');
            return BigInt(extSatoshi);
          }
        }
      } catch (fallbackErr) {
        console.log('getBitcoinBalance: External fallback failed:', fallbackErr);
      }
    }
    
    return balance;
  } catch (error) {
    console.error('getBitcoinBalance: Error occurred:', error);
    throw error;
  }
};

// Helper function to check if this is the first time checking balance for an address
const isFirstTimeBalanceCheck = async (address: string): Promise<boolean> => {
  try {
    // Check localStorage for previous balance checks
    const key = `bitcoin_balance_checked_${address}`;
    const hasBeenChecked = localStorage.getItem(key);
    
    if (!hasBeenChecked) {
      // Mark this address as checked
      localStorage.setItem(key, 'true');
      return true; // This is the first time
    }
    
    return false; // This address has been checked before
  } catch (error) {
    console.warn('isFirstTimeBalanceCheck: Error checking localStorage:', error);
    return false; // Assume not new if we can't check
  }
};

// Get balances for multiple Bitcoin addresses
export const getBitcoinBalances = async (addresses: string[], identity?: Identity): Promise<{ balances: Record<string, number>; errors: Record<string, string> }> => {
  const balances: Record<string, number> = {};
  const errors: Record<string, string> = {};

  for (const address of addresses) {
    try {
      const balance = await getBitcoinBalance(address, identity);
      balances[address] = Number(balance);
      console.log(`Bitcoin balance for ${address}: ${balance}`);
    } catch (error) {
      console.error(`Error getting Bitcoin balance for ${address}:`, error);
      errors[address] = error instanceof Error ? error.message : 'Unknown error';
      balances[address] = 0;
    }
  }

  return { balances, errors };
};
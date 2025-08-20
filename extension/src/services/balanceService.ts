// Balance fetching service for different networks
// This service handles fetching real balance data from various blockchain networks
// Updated to use background balance loading for better performance
import { getBitcoinBalances, getBitcoinBalance } from '../icp/services/bitcoin_service';
import { getSolanaBalance, getSolanaBalances } from '../icp/services/solana_service';
import { saveTransaction, getLastKnownBalance, setLastKnownBalance } from '../lib/localStorage';
import { BITCOIN_CONFIG } from '@/lib/config';

export interface BalanceResult {
  balance: number;
  usdValue: number;
}

export interface TokenBalanceResult {
  balances: Record<string, number>;
  errors: Record<string, string>;
}

// Token types enum similar to asset-page.jsx
export const TokenType = {
  BITCOIN: 'Bitcoin',
  SOLANA: 'Solana',
  FRADIUM: 'Fradium',
  UNKNOWN: 'Unknown'
} as const;

export type TokenType = typeof TokenType[keyof typeof TokenType];

// Helper to record deltas for multi-address balances
const recordReceiveDeltas = (tokenType: TokenType, balances: Record<string, number>, unitLabel: string) => {
  try {
    Object.entries(balances).forEach(([address, raw]) => {
      const value = tokenType === TokenType.BITCOIN ? raw / 100000000 : tokenType === TokenType.SOLANA ? raw / Math.pow(10, 9) : raw;
      const last = getLastKnownBalance(tokenType, address) || 0;
      setLastKnownBalance(tokenType, address, value);
      const delta = value - last;
      if (delta > 0) {
        saveTransaction({
          tokenType,
          direction: 'Receive',
          amount: delta.toString(),
          toAddress: address,
          note: `Received ${delta} ${unitLabel}`
        });
      }
    });
  } catch (e) {
    console.warn('Failed to record receive deltas:', e);
  }
};

/**
 * Fetch Bitcoin balance for a given address
 * @param address Bitcoin address
 * @returns Promise with balance in BTC and USD value
 */
export const fetchBitcoinBalance = async (address: string): Promise<BalanceResult> => {
  console.log('BalanceService: Fetching Bitcoin balance for address:', address);
  
  try {
    // Use canister service first
    
    const balanceInSatoshi = await getBitcoinBalance(address);
    const balanceInBTC = Number(balanceInSatoshi) / 100000000; // Convert satoshi to BTC
    
    console.log('BalanceService: Bitcoin balance result:', {
      satoshi: balanceInSatoshi.toString(),
      btc: balanceInBTC,
      address: address
    });
    
    // CRITICAL FIX: Ensure new accounts start with 0 balance
    // This prevents the $5 bug where new accounts get testnet coins
    if (balanceInBTC === 0) {
      console.log('BalanceService: New account detected, balance is 0');
      return { balance: 0, usdValue: 0 };
    }
    
    // Additional validation: Check if this is a newly created address
    const isNewAddress = await isNewlyCreatedBitcoinAddress(address);
    if (isNewAddress && balanceInBTC > 0) {
      console.warn(`BalanceService: New Bitcoin address ${address} has non-zero balance ${balanceInBTC} BTC. This may indicate testnet faucet is enabled.`);
      
      // For production, new addresses should start with 0
      if (BITCOIN_CONFIG.isProduction()) {
        console.warn('BalanceService: Production environment detected. Returning 0 for new address with non-zero balance.');
        return { balance: 0, usdValue: 0 };
      }
    }
    
    // Get current BTC price
    const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
    const priceData = await priceResponse.json();
    const btcPrice = priceData.bitcoin.usd;
    
    const result = {
      balance: balanceInBTC,
      usdValue: balanceInBTC * btcPrice
    };
    
    console.log('BalanceService: Final Bitcoin balance result:', result);
    await chrome.storage.local.set({ bitcoinBalance: result, lastUpdated: Date.now() });

    // Detect incoming funds and record as Receive when increased
    try {
      const lastKnown = getLastKnownBalance(TokenType.BITCOIN, address);
      setLastKnownBalance(TokenType.BITCOIN, address, balanceInBTC);
      if (lastKnown !== null) {
        const delta = balanceInBTC - lastKnown;
        if (delta > 0) {
          saveTransaction({
            tokenType: TokenType.BITCOIN,
            direction: 'Receive',
            amount: delta.toString(),
            toAddress: address,
            note: `Received ${delta} BTC`
          });
        }
      }
    } catch (e) {
      console.warn('Failed to update/record BTC receive:', e);
    }
    return result;
    
  } catch (error) {
    console.error('BalanceService: Error fetching Bitcoin balance:', error);
    // For new accounts or errors, always return 0
    return { balance: 0, usdValue: 0 };
  }
};

// Helper function to check if Bitcoin address is newly created
const isNewlyCreatedBitcoinAddress = async (address: string): Promise<boolean> => {
  try {
    // Check if this address was created in the current session
    const key = `bitcoin_address_created_${address}`;
    const creationTime = localStorage.getItem(key);
    
    if (!creationTime) {
      // Mark this address as newly created
      localStorage.setItem(key, Date.now().toString());
      return true;
    }
    
    // Check if address was created in the last 5 minutes (new session)
    const createdTime = parseInt(creationTime);
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    
    return createdTime > fiveMinutesAgo;
  } catch (error) {
    console.warn('isNewlyCreatedBitcoinAddress: Error checking localStorage:', error);
    return false;
  }
};


/**
 * Fetch Solana balance for a given address
 * @param address Solana address
 * @returns Promise with balance in SOL and USD value
 */
export const fetchSolanaBalance = async (address: string, identity?: any): Promise<BalanceResult> => {
  console.log('BalanceService: Fetching Solana balance for address:', address);
  console.log('BalanceService: Using identity:', identity ? 'authenticated' : 'anonymous');
  
  try {
    // First, try using our internal canister service
    try {
      console.log('BalanceService: Trying canister service first...');
      
      const balanceInLamports = await getSolanaBalance(address, identity);
      const balanceInSOL = Number(balanceInLamports) / Math.pow(10, 9);
      
      console.log('BalanceService: Canister balance result:', {
        lamports: balanceInLamports.toString(),
        sol: balanceInSOL,
        address: address
      });
      
      // Ensure new accounts start with 0 balance
      if (balanceInSOL === 0) {
        console.log('BalanceService: New Solana account detected, balance is 0');
        return { balance: 0, usdValue: 0 };
      }
      
      // Get current SOL price
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const priceData = await priceResponse.json();
      const solPrice = priceData.solana.usd;
      
      const result = {
        balance: balanceInSOL,
        usdValue: balanceInSOL * solPrice
      };
      
      console.log('BalanceService: Final Solana balance result:', result);
      try {
        const lastKnown = getLastKnownBalance(TokenType.SOLANA, address);
        setLastKnownBalance(TokenType.SOLANA, address, balanceInSOL);
        if (lastKnown !== null) {
          const delta = balanceInSOL - lastKnown;
          if (delta > 0) {
            saveTransaction({
              tokenType: TokenType.SOLANA,
              direction: 'Receive',
              amount: delta.toString(),
              toAddress: address,
              note: `Received ${delta} SOL`
            });
          }
        }
      } catch (e) {
        console.warn('Failed to update/record SOL receive (canister):', e);
      }
      return result;
      
    } catch (canisterError) {
      console.warn('BalanceService: Canister service failed, trying external API...', canisterError);
      
      // Fallback to external Solana RPC
      const response = await fetch('https://api.mainnet-beta.solana.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getBalance',
          params: [address]
        })
      });
      
      const data = await response.json();
      console.log('BalanceService: External API response:', data);
      
      if (data.error) {
        throw new Error(`Solana RPC error: ${data.error.message}`);
      }
      
      // Convert lamports to SOL
      const balanceInSOL = data.result.value / Math.pow(10, 9);
      
      // Ensure new accounts start with 0 balance
      if (balanceInSOL === 0) {
        console.log('BalanceService: New Solana account detected via external API, balance is 0');
        return { balance: 0, usdValue: 0 };
      }
      
      // Get current SOL price
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const priceData = await priceResponse.json();
      const solPrice = priceData.solana.usd;
      
      const result = {
        balance: balanceInSOL,
        usdValue: balanceInSOL * solPrice
      };
      
      console.log('BalanceService: External API Solana balance result:', result);
      await chrome.storage.local.set({ solanaBalance: result, lastUpdated: Date.now() });
      try {
        const lastKnown = getLastKnownBalance(TokenType.SOLANA, address);
        setLastKnownBalance(TokenType.SOLANA, address, balanceInSOL);
        if (lastKnown !== null) {
          const delta = balanceInSOL - lastKnown;
          if (delta > 0) {
            saveTransaction({
              tokenType: TokenType.SOLANA,
              direction: 'Receive',
              amount: delta.toString(),
              toAddress: address,
              note: `Received ${delta} SOL`
            });
          }
        }
      } catch (e) {
        console.warn('Failed to update/record SOL receive (fallback):', e);
      }
      return result;
    }
    
  } catch (error) {
    console.error('BalanceService: Error fetching Solana balance:', error);
    // For new accounts or errors, always return 0
    return { balance: 0, usdValue: 0 };
  }
};

/**
 * Fetch Fradium balance for a given address (ICP-based)
 * @param address ICP principal or address
 * @returns Promise with balance in FUM and USD value
 */
export const fetchFradiumBalance = async (_address: string): Promise<BalanceResult> => {
  try {
    // This would connect to your Fradium token canister
    // You'll need to implement this based on your token's interface
    
    // Placeholder implementation
    const balance = 0; // Get from your canister
    const fumPrice = 1.0; // Set your token price or fetch from an exchange
    
    return {
      balance: balance,
      usdValue: balance * fumPrice
    };
  } catch (error) {
    console.error('Error fetching Fradium balance:', error);
    return { balance: 0, usdValue: 0 };
  }
};

/**
 * Get balances for specific token type (following asset-page.jsx pattern)
 * @param tokenType Token type to fetch balances for
 * @param addresses Array of addresses to check
 * @param identity Optional identity for authenticated calls (required for Solana)
 * @returns Promise with balances and errors
 */
export const getBalance = async (tokenType: TokenType, addresses: string[], identity?: any): Promise<TokenBalanceResult> => {
  console.log(`BalanceService: Getting ${tokenType} balance for addresses:`, addresses);
  console.log(`BalanceService: Using identity:`, identity ? 'authenticated' : 'anonymous');
  
  const balances: Record<string, number> = {};
  const errors: Record<string, string> = {};

  switch (tokenType) {
    case TokenType.BITCOIN:
      try {
        const result = await getBitcoinBalances(addresses);
        recordReceiveDeltas(TokenType.BITCOIN, result.balances, 'BTC');
        return result;
      } catch (error) {
        console.error('Error getting Bitcoin balances:', error);
        addresses.forEach(addr => {
          balances[addr] = 0;
          errors[addr] = error instanceof Error ? error.message : 'Unknown error';
        });
      }
      break;

    case TokenType.SOLANA:
      try {
        const result = await getSolanaBalances(addresses, identity);
        recordReceiveDeltas(TokenType.SOLANA, result.balances, 'SOL');
        return result;
      } catch (error) {
        console.error('Error getting Solana balances:', error);
        addresses.forEach(addr => {
          balances[addr] = 0;
          errors[addr] = error instanceof Error ? error.message : 'Unknown error';
        });
      }
      break;



    case TokenType.FRADIUM:
      // Placeholder for Fradium - not implemented yet
      addresses.forEach(addr => {
        balances[addr] = 0;
      });
      break;

    default:
      addresses.forEach(addr => {
        balances[addr] = 0;
        errors[addr] = 'Unsupported token type';
      });
      break;
  }

  return { balances, errors };
};
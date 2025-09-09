// Ethereum Analysis Service for Extension
// Simplified version for browser extension environment

import type { EthereumFeatures } from './types';

/**
 * Extract features from Ethereum address
 * Note: This is a simplified version for extension.
 * In production, this would call external APIs like Etherscan, Infura, etc.
 */
export async function extractEthereumFeatures(
  address: string,
  options: any = {}
): Promise<EthereumFeatures> {
  try {
    console.log(`Extracting Ethereum features for address: ${address}`);

    // For extension environment, we'll use simplified feature extraction
    // In production, this would fetch real transaction data from blockchain APIs

    // Generate basic features based on address characteristics
    const features: EthereumFeatures = {
      // Transaction data (placeholder values)
      total_txs: Math.floor(Math.random() * 100) + 1,
      total_ether_sent: Math.random() * 10,
      total_ether_received: Math.random() * 10,
      unique_incoming_addresses: Math.floor(Math.random() * 20) + 1,
      unique_outgoing_addresses: Math.floor(Math.random() * 15) + 1,

      // Timing data
      first_transaction: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      last_transaction: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),

      // Balance data
      current_balance: Math.random() * 5,

      // Additional features
      address_length: address.length,
      starts_with_zero: address.startsWith('0x0') ? 1 : 0,
      has_repeated_chars: /(.)\1{3,}/.test(address.slice(2)) ? 1 : 0,
      entropy_score: calculateAddressEntropy(address.slice(2)),
    };

    console.log('Extracted Ethereum features:', features);
    return features;

  } catch (error) {
    console.error('Error extracting Ethereum features:', error);
    throw new Error(`Ethereum feature extraction failed: ${error.message}`);
  }
}

/**
 * Calculate entropy of address characters (basic randomness measure)
 */
function calculateAddressEntropy(addressPart: string): number {
  const charCount: { [key: string]: number } = {};
  const length = addressPart.length;

  // Count character frequencies
  for (const char of addressPart) {
    charCount[char] = (charCount[char] || 0) + 1;
  }

  // Calculate Shannon entropy
  let entropy = 0;
  for (const count of Object.values(charCount)) {
    const probability = count / length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  // Basic Ethereum address validation
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  return ethAddressPattern.test(address);
}

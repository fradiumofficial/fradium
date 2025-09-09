// Bitcoin Analysis Service for Extension
// Simplified version for browser extension environment

import type { BitcoinFeatures } from './types';

/**
 * Extract features from Bitcoin address
 * Note: This is a simplified version for extension.
 * In production, this would call external APIs like BlockCypher, Blockchair, etc.
 */
export async function extractBitcoinFeatures(address: string): Promise<number[]> {
  try {
    console.log(`Extracting Bitcoin features for address: ${address}`);

    // For extension environment, we'll use a simplified feature extraction
    // In production, this would fetch real transaction data from blockchain APIs

    // Generate basic features based on address characteristics
    const features: number[] = [];

    // Feature 1: Address length
    features.push(address.length);

    // Feature 2: Address type (1 = P2PKH, 3 = P2SH, bc1 = Bech32)
    if (address.startsWith('1')) {
      features.push(1);
    } else if (address.startsWith('3')) {
      features.push(3);
    } else if (address.startsWith('bc1')) {
      features.push(2);
    } else {
      features.push(0);
    }

    // Feature 3: Has numbers (basic pattern detection)
    features.push(/[0-9]/.test(address) ? 1 : 0);

    // Feature 4: Has uppercase
    features.push(/[A-Z]/.test(address) ? 1 : 0);

    // Feature 5: Length category
    if (address.length < 30) {
      features.push(1);
    } else if (address.length < 40) {
      features.push(2);
    } else {
      features.push(3);
    }

    // Add more placeholder features to reach expected length
    // In production, these would be real transaction-based features
    for (let i = 0; i < 20; i++) {
      features.push(Math.random()); // Placeholder random features
    }

    console.log(`Extracted ${features.length} Bitcoin features`);
    return features;

  } catch (error) {
    console.error('Error extracting Bitcoin features:', error);
    throw new Error(`Bitcoin feature extraction failed: ${error.message}`);
  }
}

/**
 * Validate Bitcoin address format
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation - in production, use a proper Bitcoin address validator
  const legacyPattern = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
  const bech32Pattern = /^bc1[a-z0-9]{39,59}$/;

  return legacyPattern.test(address) || bech32Pattern.test(address);
}

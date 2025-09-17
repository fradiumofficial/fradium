// Solana Analysis Service for Extension
// Simplified version for browser extension environment

import type { SolanaFeatures } from './types';

/**
 * Extract features from Solana address
 * Note: This is a simplified version for extension.
 * In production, this would call external APIs like Helius, Solscan, etc.
 */
export async function extractSolanaFeatures(address: string): Promise<SolanaFeatures> {
  try {
    console.log(`Extracting Solana features for address: ${address}`);

    // For extension environment, we'll use a simplified feature extraction
    // In production, this would fetch real transaction data from Solana APIs

    // Generate basic features based on address characteristics
    const features: SolanaFeatures = {
      address_length: address.length,
      has_numbers: /[0-9]/.test(address) ? 1 : 0,
      has_uppercase: /[A-Z]/.test(address) ? 1 : 0,
      has_lowercase: /[a-z]/.test(address) ? 1 : 0,
      starts_with_number: /^\d/.test(address) ? 1 : 0,
      starts_with_letter: /^[a-zA-Z]/.test(address) ? 1 : 0,
      total_txs: Math.floor(Math.random() * 100) + 1, // Placeholder transaction count
      avg_tx_value: Math.random() * 1000, // Placeholder average transaction value
      total_received: Math.random() * 10000, // Placeholder total received
      total_sent: Math.random() * 8000, // Placeholder total sent
      unique_interactions: Math.floor(Math.random() * 50) + 1, // Placeholder unique addresses interacted with
      first_tx_age_days: Math.floor(Math.random() * 365), // Placeholder account age
      last_tx_age_hours: Math.floor(Math.random() * 168), // Placeholder last activity (7 days)
      balance_sol: Math.random() * 100, // Placeholder SOL balance
      program_interactions: Math.floor(Math.random() * 20), // Placeholder program interactions
      is_system_program: 0,
      is_vote_account: 0,
      is_token_account: 0,
    };

    // Add more sophisticated features based on address patterns
    features.is_system_program = address === '11111111111111111111111111111112' ? 1 : 0;
    features.is_vote_account = address.startsWith('Vote') ? 1 : 0;
    features.is_token_account = address.length === 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address) ? 1 : 0;

    console.log(`Extracted Solana features:`, features);
    return features;

  } catch (error) {
    console.error('Error extracting Solana features:', error);
    throw new Error(`Solana feature extraction failed: ${error.message}`);
  }
}

/**
 * Validate Solana address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation - Solana addresses are 32-44 characters, base58 encoded
  const base58Pattern = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Pattern.test(address);
}

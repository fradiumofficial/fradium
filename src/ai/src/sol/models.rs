// ============================================================================
// VALIDATION FUNCTIONS (matches Python validation logic)
// ============================================================================

pub fn is_valid_solana_address(address: &str) -> bool {
    if address.len() < 32 || address.len() > 44 {
        return false;
    }
    
    // Base58 character validation (matches Python validation)
    let valid_chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    address.chars().all(|c| valid_chars.contains(c))
}

#[derive(Debug, thiserror::Error)]
pub enum SolanaModelError {
}


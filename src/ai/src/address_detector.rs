// src/address_detector.rs

#[derive(PartialEq, Debug)]
pub enum AddressType {
    Bitcoin,
    Ethereum,
    Solana,
    Unknown,
}

pub fn detect_address_type(address: &str) -> AddressType {
    // Ethereum: starts with 0x and 40 hexdigits
    if address.starts_with("0x") && address.len() == 42 {
        if address[2..].chars().all(|c| c.is_ascii_hexdigit()) {
            return AddressType::Ethereum;
        }
    }

    let lower = address.to_lowercase();

    // Bitcoin Mainnet Legacy
    if (address.starts_with('1') || address.starts_with('3'))
        && (26..=35).contains(&address.len())
    {
        return AddressType::Bitcoin;
    }

    // Bitcoin Mainnet Bech32
    if lower.starts_with("bc1q") || lower.starts_with("bc1p") {
        return AddressType::Bitcoin;
    }

    // Bitcoin Testnet Legacy
    if (address.starts_with('m') || address.starts_with('n') || address.starts_with('2'))
        && (26..=35).contains(&address.len())
    {
        return AddressType::Bitcoin;
    }

    // Bitcoin Testnet Bech32
    if lower.starts_with("tb1q") || lower.starts_with("tb1p") {
        return AddressType::Bitcoin;
    }

    // Solana (Base58, length usually 32–44, avoid overlap with BTC testnet)
    if address.len() >= 36 &&
        address.chars().all(|c| "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz".contains(c))
    {
        return AddressType::Solana;
    }

    AddressType::Unknown
}

// src/address_detector.rs

#[derive(PartialEq, Debug)]
pub enum AddressType {
    Bitcoin,
    Ethereum,
    Unknown,
}

pub fn detect_address_type(address: &str) -> AddressType {
    if address.starts_with("0x") && address.len() == 42 {
        if address[2..].chars().all(|c| c.is_ascii_hexdigit()) {
            return AddressType::Ethereum;
        }
    }
    if address.starts_with('1') || address.starts_with('3') {
        if address.len() >= 26 && address.len() <= 35 {
            return AddressType::Bitcoin;
        }
    }
    if address.starts_with("bc1") && address.len() > 40 {
        return AddressType::Bitcoin;
    }
    AddressType::Unknown
}
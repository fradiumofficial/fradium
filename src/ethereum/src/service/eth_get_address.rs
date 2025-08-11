use alloy::signers::{icp::IcpSigner, Signer};

use crate::{create_derivation_path, get_ecdsa_key_name};

#[ic_cdk::update]
pub async fn get_address() -> Result<String, String> {
    let principal = ic_cdk::caller();

    // Setup signer
    let ecdsa_key_name = get_ecdsa_key_name();
    let derivation_path = create_derivation_path(&principal);
    let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
        .await
        .map_err(|e| e.to_string())?;

    let address = signer.address();
    Ok(address.to_string())
}
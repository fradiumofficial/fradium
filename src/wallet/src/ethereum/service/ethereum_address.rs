use alloy::signers::{icp::IcpSigner, Signer};

use crate::ethereum::{create_derivation_path, get_ecdsa_key_name};
use crate::shared::validate_caller_not_anonymous;

#[ic_cdk::update]
pub async fn ethereum_address() -> String {
	let owner = validate_caller_not_anonymous();
	let ecdsa_key_name = get_ecdsa_key_name();
	let derivation_path = create_derivation_path(&owner);
	let signer = IcpSigner::new(derivation_path, &ecdsa_key_name, None)
		.await
		.expect("Failed to create ICP signer for Ethereum address");

	let address = signer.address();
	address.to_string()
}
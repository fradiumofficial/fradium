use candid::Nat;
use num::ToPrimitive;
use solana_pubkey::Pubkey;
use std::str::FromStr;

use super::{client, solana_wallet::SolanaWallet};
use crate::shared::validate_caller_not_anonymous;

#[ic_cdk::update]
pub async fn solana_address() -> String {
	let owner = validate_caller_not_anonymous();
	let wallet = SolanaWallet::new(owner).await;
	wallet.solana_account().to_string()
}

#[ic_cdk::update]
pub async fn solana_balance() -> Nat {
	// Hardcoded return for testing: 2.3 SOL = 2,300,000,000 lamports
	// return Nat::from(2300000000u64);

	let owner = validate_caller_not_anonymous();
	let wallet = SolanaWallet::new(owner).await;
	let account = wallet.solana_account();
	let public_key = account.as_ref();

	let balance = client()
		.get_balance(*public_key)
		.send()
		.await
		.expect_consistent()
		.expect("Call to `getBalance` failed");
	Nat::from(balance)
}

#[ic_cdk::update]
pub async fn solana_send(to: String, amount: Nat) -> String {
	let owner = validate_caller_not_anonymous();

	use solana_system_interface::instruction;
	use solana_message::Message;
	use solana_transaction::Transaction;

	let client = client();

	let wallet = SolanaWallet::new(owner).await;

	let recipient = Pubkey::from_str(&to).unwrap();
	let payer = wallet.solana_account();
	let amount = amount.0.to_u64().unwrap();

	let instruction = instruction::transfer(payer.as_ref(), &recipient, amount);
	let message = Message::new_with_blockhash(
		&[instruction],
		Some(payer.as_ref()),
		&client.estimate_recent_blockhash().send().await.unwrap(),
	);
	let signatures = vec![payer.sign_message(&message).await];
	let transaction = Transaction { message, signatures };

	client
		.send_transaction(transaction)
		.send()
		.await
		.expect_consistent()
		.expect("Call to `sendTransaction` failed")
		.to_string()
} 
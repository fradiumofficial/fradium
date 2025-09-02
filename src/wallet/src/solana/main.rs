use solana::{
    client, solana_wallet::SolanaWallet, spl, state::{init_state, read_state},
    InitArg,
};
use candid::{Nat, Principal};
use ic_cdk::{init, post_upgrade, update};
use num::ToPrimitive;
use crate::shared::validate_caller_not_anonymous;
use sol_rpc_client::nonce::nonce_from_account;
use sol_rpc_types::{GetAccountInfoEncoding, GetAccountInfoParams, TokenAmount, EncodedConfirmedTransactionWithStatusMeta};
use solana_hash::Hash;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_system_interface::instruction;
use solana_transaction::Transaction;
use std::str::FromStr;
use candid::CandidType;
use serde::Serialize;

#[init]
pub fn init(init_arg: InitArg) {
    init_state(init_arg)
}

#[post_upgrade]
fn post_upgrade(init_arg: Option<InitArg>) {
    if let Some(init_arg) = init_arg {
        init_state(init_arg)
    }
}

#[update]
pub async fn solana_address(owner: Option<Principal>) -> String {
    let owner_principal = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = SolanaWallet::new(owner_principal).await;
    wallet.solana_account().to_string()
}

#[update]
pub async fn solana_balance(account: Option<String>) -> Nat {
    let account = account.unwrap_or(solana_account(None).await);
    let public_key = Pubkey::from_str(&account).unwrap();
    let balance = client()
        .get_balance(public_key)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getBalance` failed");
    Nat::from(balance)
}

#[update]
pub async fn create_associated_token_account(
    owner: Option<Principal>,
    mint_account: String,
) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = SolanaWallet::new(owner).await;

    let payer = wallet.solana_account();
    let mint = Pubkey::from_str(&mint_account).unwrap();

    let (associated_token_account, instruction) = spl::create_associated_token_account_instruction(
        payer.as_ref(),
        payer.as_ref(),
        &mint,
        &get_account_owner(&mint).await,
    );

    if let Some(_account) = client
        .get_account_info(associated_token_account)
        .with_encoding(GetAccountInfoEncoding::Base64)
        .send()
        .await
        .expect_consistent()
        .unwrap_or_else(|e| {
            panic!("Call to `getAccountInfo` for {associated_token_account} failed: {e}")
        })
    {
        ic_cdk::println!(
            "[create_associated_token_account]: Account {} already exists. Skipping creation of associated token account",
            associated_token_account
        );
        return associated_token_account.to_string();
    }

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );

    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string();

    associated_token_account.to_string()
}

#[update]
pub async fn solana_send(owner: Option<Principal>, to: String, amount: Nat) -> String {
    let client = client();

    let owner = owner.unwrap_or_else(validate_caller_not_anonymous);
    let wallet = SolanaWallet::new(owner).await;

    let recipient = Pubkey::from_str(&to).unwrap();
    let payer = wallet.solana_account();
    let amount = amount.0.to_u64().unwrap();

    ic_cdk::println!(
        "Instruction to transfer {amount} lamports from {} to {recipient}",
        payer.as_ref()
    );
    let instruction = instruction::transfer(payer.as_ref(), &recipient, amount);

    let message = Message::new_with_blockhash(
        &[instruction],
        Some(payer.as_ref()),
        &client.estimate_recent_blockhash().send().await.unwrap(),
    );
    let signatures = vec![payer.sign_message(&message).await];
    let transaction = Transaction {
        message,
        signatures,
    };

    client
        .send_transaction(transaction)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `sendTransaction` failed")
        .to_string()
}

#[derive(CandidType, Serialize)]
pub struct SolanaTransactionInfo {
    pub signature: String,
    pub slot: u64,
    pub block_time: Option<u64>,
    pub transaction: Option<EncodedConfirmedTransactionWithStatusMeta>,
}

async fn get_account_owner(account: &Pubkey) -> Pubkey {
    let owner = client()
        .get_account_info(*account)
        .with_encoding(GetAccountInfoEncoding::Base64)
        .send()
        .await
        .expect_consistent()
        .expect("Call to `getAccountInfo` failed")
        .unwrap_or_else(|| panic!("Account not found for pubkey `{account}`"))
        .owner;
    Pubkey::from_str(&owner).unwrap()
}

fn main() {}

#[test]
fn check_candid_interface_compatibility() {
    use candid_parser::utils::{service_equal, CandidSource};

    candid::export_service!();

    let new_interface = __export_service();

    // check the public interface against the actual one
    let old_interface = std::path::PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").unwrap())
        .join("solana.did");

    service_equal(
        CandidSource::Text(dbg!(&new_interface)),
        CandidSource::File(old_interface.as_path()),
    )
    .unwrap();
}

ic_cdk::export_candid!();
// src/ai/build.rs

use std::env;
use std::fs;
use std::path::PathBuf;
use serde_json::Value;

fn main() {
    let out_dir = PathBuf::from(env::var("OUT_DIR").unwrap());
    let dest_path = out_dir.join("local_canister_ids.rs");

    // Default to mainnet IDs if local config is not found
    let mut ledger_id = "ryjl3-tyaaa-aaaaa-aaaba-cai".to_string();
    let mut ckbtc_id = "mxzaz-hqaaa-aaaar-qaada-cai".to_string();
    let mut cketh_id = "ss2fx-dyaaa-aaaar-qacoq-cai".to_string();
    let mut ckusdc_id = "xevnm-gaaaa-aaaar-qafnq-cai".to_string();

    // The canister_ids.json is in the root of the dfx project, not the crate root.
    // The manifest dir is .../fradium/src/ai/, so we go up two levels.
    let manifest_dir = PathBuf::from(env::var("CARGO_MANIFEST_DIR").unwrap());
    let root_dir = manifest_dir.parent().unwrap().parent().unwrap();
    let ids_path = root_dir.join(".dfx").join("local").join("canister_ids.json");

    println!("cargo:rerun-if-changed={}", ids_path.display());
    println!("cargo:rerun-if-changed=build.rs");

    if ids_path.exists() {
        let ids_content = fs::read_to_string(ids_path).expect("could not read canister_ids.json");
        let ids_json: Value = serde_json::from_str(&ids_content).expect("could not parse canister_ids.json");

        if let Some(id) = ids_json.get("ledger").and_then(|v| v.get("local")).and_then(|s| s.as_str()) {
            ledger_id = id.to_string();
        }
        if let Some(id) = ids_json.get("ckbtc_ledger").and_then(|v| v.get("local")).and_then(|s| s.as_str()) {
            ckbtc_id = id.to_string();
        }
        if let Some(id) = ids_json.get("cketh_ledger").and_then(|v| v.get("local")).and_then(|s| s.as_str()) {
            cketh_id = id.to_string();
        }
        if let Some(id) = ids_json.get("ckusdc_ledger").and_then(|v| v.get("local")).and_then(|s| s.as_str()) {
            ckusdc_id = id.to_string();
        }
    }

    let code = format!(
        r#"
        pub const LOCAL_LEDGER_ID: &str = "{}";
        pub const LOCAL_CKBTC_ID: &str = "{}";
        pub const LOCAL_CKETH_ID: &str = "{}";
        pub const LOCAL_CKUSDC_ID: &str = "{}";
        "#,
        ledger_id, ckbtc_id, cketh_id, ckusdc_id
    );

    fs::write(&dest_path, code).unwrap();
}
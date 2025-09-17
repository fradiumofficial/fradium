#!/usr/bin/env bash

# Build AI canister
cargo build --target wasm32-unknown-unknown --release -p ai

# Extract Candid interface
candid-extractor target/wasm32-unknown-unknown/release/ai.wasm > src/ai/ai.did


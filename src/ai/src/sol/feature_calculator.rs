// src/solana/feature_calculator.rs

use std::collections::{HashMap, HashSet};
use crate::sol::{models::*, price_converter::SolanaPriceConverter};
use crate::sol::config::COMPREHENSIVE_PROGRAM_ADDRESSES;

const LAMPORTS_TO_SOL: f64 = 1_000_000_000.0;

pub struct SolanaFeatureCalculator {
    price_converter: SolanaPriceConverter,
}

#[derive(Debug, Clone)]
struct ProcessedTx {
    value_btc: f64,
    value_sol: f64,
    fee_btc: f64,
    slot: i64,
    tx_context: String,
}

impl SolanaFeatureCalculator {
    pub fn new(price_converter: SolanaPriceConverter) -> Self {
        Self { price_converter }
    }

    pub async fn calculate_features(
        &mut self,
        address: &str,
        parsed_transfers: &[ParsedSolanaTransaction],  // The flat list of individual transfers
        raw_transactions: &[HeliusTransaction]         // The original raw list from Helius
    ) -> Option<HashMap<String, f64>> {
        // FIXED: Use parsed_transfers instead of transactions
        if parsed_transfers.is_empty() {
            ic_cdk::println!("[DEBUG] No parsed transfers provided for address: {}", address);
            return None;
        }

        let address = address.trim().to_lowercase(); // FIXED: Make lowercase for consistent comparison
        ic_cdk::println!("[DEBUG] Target address: '{}' (normalized)", address);
        
        // DEBUG: Show first few transfers
        ic_cdk::println!("[DEBUG] Checking first 3 parsed transfers:");
        for (i, transfer) in parsed_transfers.iter().take(3).enumerate() {
            ic_cdk::println!("[DEBUG TRANSFER {}] From: '{}', To: '{}', Type: {:?}, Value SOL: {}", 
                i, transfer.from, transfer.to, transfer.tx_type, transfer.value_sol);
        }

        let mut sent_txs = Vec::new();
        let mut received_txs = Vec::new();
        let mut all_values_btc = Vec::new();
        let mut all_fees_btc = Vec::new();
        let mut slots = Vec::new();
        let mut counterparties = HashMap::new();

        // Counters - match Python exactly
        let mut failed_txs = 0;
        let mut sol_txs = 0;
        let mut token_txs = 0;
        let mut dex_txs = 0;
        let mut lending_txs = 0;
        let mut staking_txs = 0;
        let mut programmatic_txs = 0;
        let mut unique_tokens = HashSet::new();
        let mut price_failures = 0;
        let mut context_counts = HashMap::new();
        let mut account_creation_costs = 0.0;

        ic_cdk::println!("[DEBUG] Starting to process {} parsed transfers from {} raw transactions...", 
                        parsed_transfers.len(), raw_transactions.len());

        // COMPLETELY REPLACED: Single loop through parsed transfers instead of nested loops
        for (i, transfer) in parsed_transfers.iter().enumerate() {
            // Get BTC conversion
            let sol_btc_ratio = self.price_converter.get_sol_btc_ratio(transfer.timestamp as u64).await;
            let value_btc = transfer.value_sol * sol_btc_ratio;
            all_values_btc.push(value_btc);

            // Add to slots (convert slot to i64)
            slots.push(transfer.slot as i64);

            // Count transaction types and contexts
            match transfer.tx_type {
                TransactionType::Failed => failed_txs += 1,
                TransactionType::SolTransfer => sol_txs += 1,
                TransactionType::TokenTransfer => {
                    token_txs += 1;
                    unique_tokens.insert(transfer.mint_address.clone());
                    if !transfer.price_fetch_success {
                        price_failures += 1;
                    }
                },
                _ => {}
            }

            // Count contexts
            let context_str = match transfer.tx_context {
                TransactionContext::DexSwap => {
                    dex_txs += 1;
                    "DEX_SWAP"
                },
                TransactionContext::Lending => {
                    lending_txs += 1;
                    "LENDING"
                },
                TransactionContext::Staking => {
                    staking_txs += 1;
                    "STAKING"
                },
                TransactionContext::PureTransfer => "PURE_TRANSFER",
                TransactionContext::OtherProgram => "OTHER_PROGRAM",
                TransactionContext::Unknown => "UNKNOWN",
            };
            *context_counts.entry(context_str.to_string()).or_insert(0) += 1;

            if transfer.is_programmatic {
                programmatic_txs += 1;
            }

            // Handle fees and account creation costs
            let fee_sol = transfer.fee_lamports as f64 / LAMPORTS_TO_SOL;
            let fee_btc = fee_sol * sol_btc_ratio;
            if fee_sol > 0.002 {
                account_creation_costs += fee_sol;
            }

            // DEBUG for first few transfers
            if i < 3 {
                ic_cdk::println!("[DEBUG TRANSFER {}] Address comparison:", i);
                ic_cdk::println!("  Target: '{}'", address);
                ic_cdk::println!("  From: '{}' (matches? {})", transfer.from.to_lowercase(), transfer.from.to_lowercase() == address);
                ic_cdk::println!("  To: '{}' (matches? {})", transfer.to.to_lowercase(), transfer.to.to_lowercase() == address);
                ic_cdk::println!("  Value BTC: {}, SOL: {}", value_btc, transfer.value_sol);
            }

            // Check if sent by target address
            if transfer.from.to_lowercase() == address && value_btc > 0.0 {
                ic_cdk::println!("[DEBUG TRANSFER {}] ---> SENT MATCH! value_btc: {}", i, value_btc);
                
                sent_txs.push(ProcessedTx {
                    value_btc,
                    value_sol: transfer.value_sol,
                    fee_btc,
                    slot: transfer.slot as i64,
                    tx_context: context_str.to_string(),
                });

                all_fees_btc.push(fee_btc);

                // Add counterparty if not a known program
                if !self.is_known_program(&transfer.to) {
                    *counterparties.entry(transfer.to.clone()).or_insert(0) += 1;
                }
            }

            // Check if received by target address
            if transfer.to.to_lowercase() == address && value_btc > 0.0 {
                ic_cdk::println!("[DEBUG TRANSFER {}] ---> RECEIVED MATCH! value_btc: {}", i, value_btc);
                
                received_txs.push(ProcessedTx {
                    value_btc,
                    value_sol: transfer.value_sol,
                    fee_btc: 0.0, // Don't double-count fees for received transactions
                    slot: transfer.slot as i64,
                    tx_context: context_str.to_string(),
                });

                // Add counterparty if not a known program
                if !self.is_known_program(&transfer.from) {
                    *counterparties.entry(transfer.from.clone()).or_insert(0) += 1;
                }
            }
        }
        
        ic_cdk::println!("[DEBUG] Final Counts | Sent: {}, Received: {}, SOL: {}, Token: {}", 
            sent_txs.len(), received_txs.len(), sol_txs, token_txs);

        // FIXED: Use raw_transactions.len() for total transaction count (not parsed_transfers.len())
        self.calculate_all_features(
            raw_transactions.len(), // This is the total number of original transactions
            slots,
            sent_txs,
            received_txs,
            all_values_btc,
            all_fees_btc,
            counterparties,
            failed_txs,
            sol_txs,
            token_txs,
            unique_tokens.len(),
            dex_txs,
            lending_txs,
            staking_txs,
            programmatic_txs,
            price_failures,
            context_counts,
            account_creation_costs,
        )
    }


    fn calculate_all_features(
        &self,
        total_txs: usize,
        slots: Vec<i64>,
        sent_txs: Vec<ProcessedTx>,
        received_txs: Vec<ProcessedTx>,
        all_values_btc: Vec<f64>,
        all_fees_btc: Vec<f64>,
        counterparties: HashMap<String, u32>,
        failed_txs: u32,
        sol_txs: u32,
        token_txs: u32,
        unique_tokens: usize,
        dex_txs: u32,
        lending_txs: u32,
        staking_txs: u32,
        programmatic_txs: u32,
        price_failures: u32,
        context_counts: HashMap<String, u32>,
        account_creation_costs: f64,
    ) -> Option<HashMap<String, f64>> {
        let mut features = HashMap::new();

        // Basic counts - exactly like Python
        features.insert("num_txs_as_sender".to_string(), sent_txs.len() as f64);
        features.insert("num_txs_as_receiver".to_string(), received_txs.len() as f64);
        features.insert("total_txs".to_string(), total_txs as f64);

        // Enhanced features - match Python exactly
        features.insert("failed_txs".to_string(), failed_txs as f64);
        features.insert("success_rate".to_string(), 
            if total_txs > 0 { (total_txs - failed_txs as usize) as f64 / total_txs as f64 } else { 0.0 });
        features.insert("sol_txs".to_string(), sol_txs as f64);
        features.insert("token_txs".to_string(), token_txs as f64);
        features.insert("unique_tokens_transacted".to_string(), unique_tokens as f64);
        features.insert("sol_to_token_ratio".to_string(), 
            if token_txs > 0 { sol_txs as f64 / token_txs as f64 } else { f64::INFINITY });

        // DeFi features
        features.insert("dex_swap_txs".to_string(), dex_txs as f64);
        features.insert("lending_txs".to_string(), lending_txs as f64);
        features.insert("staking_txs".to_string(), staking_txs as f64);
        features.insert("programmatic_txs".to_string(), programmatic_txs as f64);
        features.insert("programmatic_ratio".to_string(), 
            if total_txs > 0 { programmatic_txs as f64 / total_txs as f64 } else { 0.0 });

        let defi_txs = dex_txs + lending_txs + staking_txs;
        features.insert("defi_txs_total".to_string(), defi_txs as f64);
        features.insert("defi_ratio".to_string(), 
            if total_txs > 0 { defi_txs as f64 / total_txs as f64 } else { 0.0 });
        features.insert("dex_to_total_ratio".to_string(), 
            if total_txs > 0 { dex_txs as f64 / total_txs as f64 } else { 0.0 });

        // Data quality
        features.insert("price_fetch_failures".to_string(), price_failures as f64);
        features.insert("price_fetch_success_rate".to_string(), 
            if total_txs > 0 { (total_txs - price_failures as usize) as f64 / total_txs as f64 } else { 0.0 });
        features.insert("account_creation_costs_sol".to_string(), account_creation_costs);

        // Context features
        features.insert("transaction_context_diversity".to_string(), context_counts.len() as f64);
        let max_context_count = context_counts.values().max().copied().unwrap_or(0);
        features.insert("most_common_context_ratio".to_string(), 
            if total_txs > 0 { max_context_count as f64 / total_txs as f64 } else { 0.0 });

        // Slot features - filter valid slots like Python
        let valid_slots: Vec<i64> = slots.into_iter().filter(|&s| s > 0).collect();
        if !valid_slots.is_empty() {
            let first_slot = *valid_slots.iter().min().unwrap() as f64;
            let last_slot = *valid_slots.iter().max().unwrap() as f64;
            let lifetime_slots = last_slot - first_slot;
            let unique_slots = valid_slots.iter().collect::<HashSet<_>>().len() as f64;

            features.insert("first_slot_appeared_in".to_string(), first_slot);
            features.insert("last_slot_appeared_in".to_string(), last_slot);
            features.insert("lifetime_in_slots".to_string(), lifetime_slots);
            features.insert("num_timesteps_appeared_in".to_string(), unique_slots);
            features.insert("slot_density".to_string(), 
                if lifetime_slots > 0.0 { total_txs as f64 / lifetime_slots } else { 0.0 });
        } else {
            features.insert("first_slot_appeared_in".to_string(), 0.0);
            features.insert("last_slot_appeared_in".to_string(), 0.0);
            features.insert("lifetime_in_slots".to_string(), 0.0);
            features.insert("num_timesteps_appeared_in".to_string(), 0.0);
            features.insert("slot_density".to_string(), 0.0);
        }

        // Direction-specific slots
        let sent_slots: Vec<i64> = sent_txs.iter().map(|tx| tx.slot).filter(|&s| s > 0).collect();
        let received_slots: Vec<i64> = received_txs.iter().map(|tx| tx.slot).filter(|&s| s > 0).collect();
        
        features.insert("first_sent_slot".to_string(), 
            sent_slots.iter().min().copied().unwrap_or(0) as f64);
        features.insert("first_received_slot".to_string(), 
            received_slots.iter().min().copied().unwrap_or(0) as f64);

        // Value statistics - exactly like Python
        self.add_stats(&mut features, "btc_transacted", &all_values_btc, true);
        self.add_stats(&mut features, "btc_sent", &sent_txs.iter().map(|tx| tx.value_btc).collect::<Vec<_>>(), true);
        self.add_stats(&mut features, "btc_received", &received_txs.iter().map(|tx| tx.value_btc).collect::<Vec<_>>(), true);
        self.add_stats(&mut features, "fees", &all_fees_btc, true);

        // SOL statistics
        self.add_stats(&mut features, "sol_sent", &sent_txs.iter().map(|tx| tx.value_sol).collect::<Vec<_>>(), true);
        self.add_stats(&mut features, "sol_received", &received_txs.iter().map(|tx| tx.value_sol).collect::<Vec<_>>(), true);

        // Fee shares - exactly like Python
        let fee_shares: Vec<f64> = sent_txs.iter()
            .filter(|tx| tx.value_btc > 0.0)
            .map(|tx| (tx.fee_btc / tx.value_btc) * 100.0)
            .collect();
        self.add_stats(&mut features, "fees_as_share", &fee_shares, true);

        // Interval stats - match Python exactly
        let mut sorted_unique_slots: Vec<i64> = valid_slots.iter().copied().collect::<HashSet<_>>().into_iter().collect();
        sorted_unique_slots.sort_unstable();
        self.add_interval_stats(&mut features, "slots_btwn_txs", &sorted_unique_slots);
        
        let mut sorted_sent_slots = sent_slots;
        sorted_sent_slots.sort_unstable();
        self.add_interval_stats(&mut features, "slots_btwn_input_txs", &sorted_sent_slots);
        
        let mut sorted_received_slots = received_slots;
        sorted_received_slots.sort_unstable();
        self.add_interval_stats(&mut features, "slots_btwn_output_txs", &sorted_received_slots);

        // Counterparty analysis - filter programs like Python
        let human_counterparties: HashMap<String, u32> = counterparties.into_iter()
            .filter(|(addr, _)| !self.is_known_program(addr))
            .collect();

        features.insert("transacted_w_address_total".to_string(), human_counterparties.len() as f64);
        features.insert("num_addr_transacted_multiple".to_string(), 
            human_counterparties.values().filter(|&&count| count > 1).count() as f64);

        if !human_counterparties.is_empty() {
            let counts: Vec<f64> = human_counterparties.values().map(|&c| c as f64).collect();
            self.add_stats(&mut features, "transacted_w_address", &counts, false);
        } else {
            self.add_stats(&mut features, "transacted_w_address", &[], false);
        }

        // Behavioral patterns - match Python
        let all_txs: Vec<&ProcessedTx> = sent_txs.iter().chain(received_txs.iter()).collect();
        features.insert("avg_tx_complexity".to_string(), self.calculate_tx_complexity(&all_txs));
        features.insert("burst_activity_score".to_string(), self.calculate_burst_score(&valid_slots));
        features.insert("round_number_ratio".to_string(), self.calculate_round_number_ratio(&all_values_btc));

        ic_cdk::println!("=== FEATURE VECTOR DEBUG ===");
        ic_cdk::println!("[DEBUG] Key transaction counts:");
        ic_cdk::println!("  num_txs_as_sender: {}", features.get("num_txs_as_sender").unwrap_or(&-1.0));
        ic_cdk::println!("  num_txs_as_receiver: {}", features.get("num_txs_as_receiver").unwrap_or(&-1.0));
        ic_cdk::println!("  total_txs: {}", features.get("total_txs").unwrap_or(&-1.0));
        ic_cdk::println!("  sol_txs: {}", features.get("sol_txs").unwrap_or(&-1.0));
        ic_cdk::println!("  token_txs: {}", features.get("token_txs").unwrap_or(&-1.0));

        ic_cdk::println!("[DEBUG] Key value features:");
        ic_cdk::println!("  btc_transacted_total: {}", features.get("btc_transacted_total").unwrap_or(&-1.0));
        ic_cdk::println!("  btc_sent_total: {}", features.get("btc_sent_total").unwrap_or(&-1.0));
        ic_cdk::println!("  btc_received_total: {}", features.get("btc_received_total").unwrap_or(&-1.0));
        ic_cdk::println!("  fees_total: {}", features.get("fees_total").unwrap_or(&-1.0));

        ic_cdk::println!("[DEBUG] Key behavioral features:");
        ic_cdk::println!("  programmatic_txs: {}", features.get("programmatic_txs").unwrap_or(&-1.0));
        ic_cdk::println!("  dex_swap_txs: {}", features.get("dex_swap_txs").unwrap_or(&-1.0));
        ic_cdk::println!("  price_fetch_failures: {}", features.get("price_fetch_failures").unwrap_or(&-1.0));
        ic_cdk::println!("  transacted_w_address_total: {}", features.get("transacted_w_address_total").unwrap_or(&-1.0));

        ic_cdk::println!("[DEBUG] Statistical features sample:");
        ic_cdk::println!("  btc_transacted_mean: {}", features.get("btc_transacted_mean").unwrap_or(&-1.0));
        ic_cdk::println!("  btc_transacted_max: {}", features.get("btc_transacted_max").unwrap_or(&-1.0));

        ic_cdk::println!("=== END FEATURE DEBUG ===");

        Some(features)
    }





    fn calculate_tx_complexity(&self, all_txs: &[&ProcessedTx]) -> f64 {
        if all_txs.is_empty() {
            return 0.0;
        }

        let complexity_scores = [
            ("PURE_TRANSFER", 1.0),
            ("DEX_SWAP", 3.0),
            ("LENDING", 2.5),
            ("STAKING", 2.0),
            ("OTHER_PROGRAM", 2.0),
        ].iter().cloned().collect::<HashMap<&str, f64>>();

        let total_complexity: f64 = all_txs.iter()
            .map(|tx| complexity_scores.get(tx.tx_context.as_str()).copied().unwrap_or(1.5))
            .sum();

        total_complexity / all_txs.len() as f64
    }

    fn calculate_burst_score(&self, slots: &[i64]) -> f64 {
        if slots.len() < 3 {
            return 0.0;
        }

        let mut unique_slots: Vec<i64> = slots.iter().copied().collect::<HashSet<_>>().into_iter().collect();
        unique_slots.sort_unstable();

        if unique_slots.len() < 2 {
            return 0.0;
        }

        let intervals: Vec<i64> = unique_slots.windows(2)
            .map(|window| window[1] - window[0])
            .collect();

        if intervals.is_empty() {
            return 0.0;
        }

        let short_intervals = intervals.iter().filter(|&&interval| interval < 10).count();
        short_intervals as f64 / intervals.len() as f64
    }

    fn calculate_round_number_ratio(&self, values: &[f64]) -> f64 {
        if values.is_empty() {
            return 0.0;
        }

        let round_numbers = values.iter()
            .filter(|&&value| value > 0.0)
            .filter(|&&value| {
                let formatted = format!("{:.8}", value);
                let trimmed = formatted.trim_end_matches('0').trim_end_matches('.');
                !trimmed.contains('.') || trimmed.split('.').nth(1).map_or(true, |dec| dec.len() <= 2)
            })
            .count();

        round_numbers as f64 / values.len() as f64
    }

    fn add_stats(&self, features: &mut HashMap<String, f64>, prefix: &str, values: &[f64], include_total: bool) {
        if values.is_empty() {
            if include_total {
                features.insert(format!("{}_total", prefix), 0.0);
            }
            features.insert(format!("{}_min", prefix), 0.0);
            features.insert(format!("{}_max", prefix), 0.0);
            features.insert(format!("{}_mean", prefix), 0.0);
            features.insert(format!("{}_median", prefix), 0.0);
            features.insert(format!("{}_std", prefix), 0.0);
        } else {
            if include_total {
                features.insert(format!("{}_total", prefix), values.iter().sum());
            }
            features.insert(format!("{}_min", prefix), values.iter().fold(f64::INFINITY, |a, &b| a.min(b)));
            features.insert(format!("{}_max", prefix), values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)));
            features.insert(format!("{}_mean", prefix), values.iter().sum::<f64>() / values.len() as f64);
            
            let mut sorted = values.to_vec();
            sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
            let median = if sorted.len() % 2 == 0 {
                (sorted[sorted.len() / 2 - 1] + sorted[sorted.len() / 2]) / 2.0
            } else {
                sorted[sorted.len() / 2]
            };
            features.insert(format!("{}_median", prefix), median);

            let mean = values.iter().sum::<f64>() / values.len() as f64;
            let variance = values.iter().map(|v| (v - mean).powi(2)).sum::<f64>() / values.len() as f64;
            features.insert(format!("{}_std", prefix), variance.sqrt());
        }
    }

    fn add_interval_stats(&self, features: &mut HashMap<String, f64>, prefix: &str, sorted_slots: &[i64]) {
        if sorted_slots.len() > 1 {
            let intervals: Vec<f64> = sorted_slots.windows(2)
                .map(|window| (window[1] - window[0]) as f64)
                .collect();
            self.add_stats(features, prefix, &intervals, true);
        } else {
            self.add_stats(features, prefix, &[], true);
        }
    }

    fn is_known_program(&self, address: &str) -> bool {
        COMPREHENSIVE_PROGRAM_ADDRESSES.contains(&address)
    }
}
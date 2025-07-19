// src/feature_calculator.rs

use super::config::WEI_TO_ETH;
use super::models::{EtherscanTx, ReceivedTxInfo, SentTxInfo, TxType, logs};
use super::price_converter;
use std::collections::{HashMap, HashSet};

pub async fn calculate_features(
    address: &str,
    transactions: Vec<EtherscanTx>,
) -> Result<HashMap<String, f64>, String> {
    let mut sent_txs: Vec<SentTxInfo> = Vec::new();
    let mut received_txs: Vec<ReceivedTxInfo> = Vec::new();
    let mut all_values_btc: Vec<f64> = Vec::new();
    let mut all_fees_btc: Vec<f64> = Vec::new();
    let mut blocks: Vec<u64> = Vec::new();
    let mut counterparties: HashMap<String, u32> = HashMap::new();

    for tx in transactions {
        let timestamp = tx.time_stamp.parse::<u64>().unwrap_or(0);
        if timestamp == 0 {
            continue;
        }

        let block_num = tx.block_number.parse::<u64>().unwrap_or(0);
        let tx_from = tx.from.to_lowercase();
        let tx_to = tx.to.to_lowercase();

        let mut value_eth = 0.0;
        if tx.tx_type == TxType::ETH {
            value_eth = tx.value.parse::<f64>().unwrap_or(0.0) / WEI_TO_ETH;
        } else {
            let token_info = price_converter::get_token_info(&tx.contract_address).await?;
            let decimals = token_info.decimals;
            let token_amount =
                tx.value.parse::<f64>().unwrap_or(0.0) / 10.0f64.powi(decimals as i32);

            if token_amount > 0.0 {
                let token_eth_ratio =
                    price_converter::get_token_eth_ratio(&tx.contract_address, timestamp).await?;
                value_eth = token_amount * token_eth_ratio;
                if value_eth > 0.0 {
                    logs::add_log(format!(
                        "      -> Conversion: {:.4} {} * {:.8} = {:.8} ETH",
                        token_amount, token_info.symbol, token_eth_ratio, value_eth
                    ));
                }
            }
        }

        let gas_used = tx.gas_used.parse::<u64>().unwrap_or(0);
        let gas_price = tx.gas_price.parse::<u64>().unwrap_or(0);
        let gas_fee_eth = (gas_used as f64 * gas_price as f64) / WEI_TO_ETH;

        let eth_btc_ratio = price_converter::get_eth_btc_ratio(timestamp).await?;

        let value_btc = value_eth * eth_btc_ratio;
        let fee_btc = gas_fee_eth * eth_btc_ratio;

        if block_num > 0 {
            blocks.push(block_num);
        }

        if tx_from == address {
            all_fees_btc.push(fee_btc);
            if value_btc > 0.0 {
                sent_txs.push(SentTxInfo {
                    value_btc,
                    fee_btc,
                    block: block_num,
                });
                all_values_btc.push(value_btc);
                if !tx_to.is_empty() {
                    *counterparties.entry(tx_to.clone()).or_insert(0) += 1;
                }
            }
        }
        if tx_to == address {
            if value_btc > 0.0 {
                received_txs.push(ReceivedTxInfo {
                    value_btc,
                    block: block_num,
                });
                all_values_btc.push(value_btc);
                if !tx_from.is_empty() {
                    *counterparties.entry(tx_from).or_insert(0) += 1;
                }
            }
        }
    }

    Ok(aggregate_features(
        blocks,
        sent_txs,
        received_txs,
        all_values_btc,
        all_fees_btc,
        counterparties,
    ))
}

fn aggregate_features(
    blocks: Vec<u64>,
    sent_txs: Vec<SentTxInfo>,
    received_txs: Vec<ReceivedTxInfo>,
    all_values_btc: Vec<f64>,
    all_fees_btc: Vec<f64>,
    counterparties: HashMap<String, u32>,
) -> HashMap<String, f64> {
    let mut features = HashMap::new();

    features.insert("num_txs_as_sender".to_string(), sent_txs.len() as f64);
    features.insert("num_txs_as_receiver".to_string(), received_txs.len() as f64);
    features.insert(
        "total_txs".to_string(),
        (sent_txs.len() + received_txs.len()) as f64,
    );

    if !blocks.is_empty() {
        let first_block = *blocks.iter().min().unwrap() as f64;
        let last_block = *blocks.iter().max().unwrap() as f64;
        features.insert("first_block_appeared_in".to_string(), first_block);
        features.insert("last_block_appeared_in".to_string(), last_block);
        features.insert("lifetime_in_blocks".to_string(), last_block - first_block);
        let unique_blocks: HashSet<_> = blocks.iter().collect();
        features.insert(
            "num_timesteps_appeared_in".to_string(),
            unique_blocks.len() as f64,
        );
    } else {
        features.insert("first_block_appeared_in".to_string(), 0.0);
        features.insert("last_block_appeared_in".to_string(), 0.0);
        features.insert("lifetime_in_blocks".to_string(), 0.0);
        features.insert("num_timesteps_appeared_in".to_string(), 0.0);
    }

    let sent_blocks: Vec<u64> = sent_txs
        .iter()
        .filter(|tx| tx.block > 0)
        .map(|tx| tx.block)
        .collect();
    let received_blocks: Vec<u64> = received_txs
        .iter()
        .filter(|tx| tx.block > 0)
        .map(|tx| tx.block)
        .collect();
    features.insert(
        "first_sent_block".to_string(),
        sent_blocks.iter().min().map_or(0.0, |b| *b as f64),
    );
    features.insert(
        "first_received_block".to_string(),
        received_blocks.iter().min().map_or(0.0, |b| *b as f64),
    );

    add_stats(&mut features, "btc_transacted", &all_values_btc, true);
    add_stats(
        &mut features,
        "btc_sent",
        &sent_txs.iter().map(|tx| tx.value_btc).collect::<Vec<_>>(),
        true,
    );
    add_stats(
        &mut features,
        "btc_received",
        &received_txs
            .iter()
            .map(|tx| tx.value_btc)
            .collect::<Vec<_>>(),
        true,
    );
    add_stats(&mut features, "fees", &all_fees_btc, true);

    let fee_shares: Vec<f64> = sent_txs
        .iter()
        .filter(|tx| tx.value_btc > 0.0)
        .map(|tx| (tx.fee_btc / tx.value_btc) * 100.0)
        .collect();
    add_stats(&mut features, "fees_as_share", &fee_shares, true);

    add_interval_stats(&mut features, "blocks_btwn_txs", &blocks);
    add_interval_stats(&mut features, "blocks_btwn_input_txs", &sent_blocks);
    add_interval_stats(&mut features, "blocks_btwn_output_txs", &received_blocks);

    features.insert(
        "transacted_w_address_total".to_string(),
        counterparties.len() as f64,
    );
    features.insert(
        "num_addr_transacted_multiple".to_string(),
        counterparties.values().filter(|&&c| c > 1).count() as f64,
    );
    add_stats(
        &mut features,
        "transacted_w_address",
        &counterparties
            .values()
            .map(|&v| v as f64)
            .collect::<Vec<_>>(),
        false,
    );

    features
}

fn add_stats(features: &mut HashMap<String, f64>, prefix: &str, values: &[f64], include_total: bool) {
    let empty_defaults = vec![
        format!("{}_min", prefix),
        format!("{}_max", prefix),
        format!("{}_mean", prefix),
        format!("{}_median", prefix),
    ];

    if include_total {
        features.insert(format!("{}_total", prefix), 0.0);
    }
    for key in empty_defaults {
        features.insert(key, 0.0);
    }

    if values.is_empty() {
        return;
    }

    let sum: f64 = values.iter().sum();
    if include_total {
        features.insert(format!("{}_total", prefix), sum);
    }
    features.insert(format!("{}_mean", prefix), sum / values.len() as f64);
    features.insert(
        format!("{}_min", prefix),
        values.iter().fold(f64::INFINITY, |a, &b| a.min(b)),
    );
    features.insert(
        format!("{}_max", prefix),
        values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b)),
    );

    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = sorted.len() / 2;
    let median = if sorted.len() % 2 == 0 {
        (sorted[mid - 1] + sorted[mid]) / 2.0
    } else {
        sorted[mid]
    };
    features.insert(format!("{}_median", prefix), median);
}

fn add_interval_stats(features: &mut HashMap<String, f64>, prefix: &str, blocks: &[u64]) {
    if blocks.len() > 1 {
        let mut unique_sorted: Vec<u64> = blocks.to_vec();
        unique_sorted.sort();
        unique_sorted.dedup();
        let intervals: Vec<f64> = unique_sorted.windows(2).map(|w| (w[1] - w[0]) as f64).collect();
        add_stats(features, prefix, &intervals, true);
    } else {
        add_stats(features, prefix, &[], true);
    }
}
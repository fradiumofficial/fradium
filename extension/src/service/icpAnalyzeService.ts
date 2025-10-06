// ICP Analyze Service - Minimal local implementation to align with frontend shapes
// Note: For parity with the web, you can later port the full logic (balances + tx fetching).

export async function buildComprehensiveFeatures(principalStr: string): Promise<any> {
  return {
    principal: principalStr,
    icp_balance: 0.0,
    ckbtc_balance: 0.0,
    cketh_balance: 0.0,
    ckusdc_balance: 0.0,
    num_tokens_held: 0,
    total_portfolio_value_usd: 0.0,
    portfolio_diversity_score: 0,
    total_transactions: 0,
    sent_transactions: 0,
    received_transactions: 0,
    unique_counterparties: 0,
    tokens_used: 0,
    cross_token_user: false,
    total_value_sent_usd: 0.0,
    total_value_received_usd: 0.0,
    net_flow_usd: 0.0,
    avg_transaction_value_usd: 0.0,
    sent_amount_mean_usd: 0.0,
    received_amount_mean_usd: 0.0,
    transaction_value_std_usd: 0.0,
    tokens_actively_used: 0,
    primary_token_dominance: 0.0,
    transaction_span_days: 0.0,
    avg_time_between_txs_hours: 0.0,
    transaction_frequency_score: 0.0,
    send_receive_ratio: 0.0,
    value_sent_received_ratio_usd: 0.0,
    mint_to_transfer_ratio: 0.0,
    defi_activity_score: 0.0,
    round_number_transactions: 0,
    high_value_transaction_ratio: 0.0,
    microtransaction_ratio: 0.0,
    icp_transfer: 0,
    ckbtc_transfer: 0,
    ckbtc_mint: 0,
    cketh_transfer: 0,
    cketh_mint: 0,
    cketh_burn: 0,
    ckusdc_transfer: 0,
    ckusdc_mint: 0,
    ckusdc_burn: 0,
  };
}

export function prepareFeaturesForCanister(features: any): Array<[string, number]> {
  const featurePairs: Array<[string, number]> = [];
  const ensureNumber = (value: any) => {
    const num = Number(value);
    if (isNaN(num) || !isFinite(num)) return 0.0;
    return num;
  };

  const keys: string[] = [
    'icp_balance','ckbtc_balance','cketh_balance','ckusdc_balance','num_tokens_held','total_portfolio_value_usd',
    'portfolio_diversity_score','total_transactions','sent_transactions','received_transactions','unique_counterparties',
    'tokens_used','cross_token_user','total_value_sent_usd','total_value_received_usd','net_flow_usd','avg_transaction_value_usd',
    'sent_amount_mean_usd','received_amount_mean_usd','transaction_value_std_usd','tokens_actively_used','primary_token_dominance',
    'transaction_span_days','avg_time_between_txs_hours','transaction_frequency_score','send_receive_ratio','value_sent_received_ratio_usd',
    'mint_to_transfer_ratio','defi_activity_score','round_number_transactions','high_value_transaction_ratio','microtransaction_ratio',
    'icp_transfer','ckbtc_transfer','ckbtc_mint','cketh_transfer','cketh_mint','cketh_burn','ckusdc_transfer','ckusdc_mint','ckusdc_burn'
  ];

  for (const key of keys) {
    featurePairs.push([key, key === 'cross_token_user' ? (features.cross_token_user ? 1.0 : 0.0) : ensureNumber(features[key])]);
  }

  return featurePairs;
}



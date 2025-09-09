// src/ai/src/icp/config.rs

use serde::Deserialize;

// TODO: Place your trained ICP ONNX model in the `src/ai/models` folder
// and update the filename here.
pub const MODEL_BYTES: &[u8] = include_bytes!("../../models/icp_compliance_model_v1.onnx");

// TODO: You MUST replace this with the actual scaler parameters (mean and std)
// generated during your model training process. The order must exactly match
// the feature_names below.
pub const SCALER_PARAMS_JSON: &str = r#"
{
    "mean": [
        161.65401277915743,
        0.009501185909613174,
        0.08028012499726905,
        43.308204538873994,
        0.9831482190731521,
        2199.9056517697554,
        0.4904251244733818,
        28.510915358100345,
        13.233818460360016,
        15.31520490233627,
        9.263500574492532,
        1.0,
        1.0,
        7574.409317357963,
        6078.754716911529,
        -1017.4102334894997,
        211.195280700389,
        277.59579018668944,
        203.60083259293788,
        415.4025657457005,
        0.7714119043861203,
        422820955.34829146,
        12.180747350822553,
        3031041059.129878,
        0.3123176068936673,
        0.8073076525091338,
        3600.457059009949,
        0.0028883653762916284,
        1.3243122729033083,
        3.932998353747205,
        0.11062960990330155,
        1.0,
        21.346227499042513,
        0.15626196859440827,
        0.004404442742244351,
        0.00038299502106472615,
        0.005361930294906166,
        0.06932209881271544,
        0.11298353121409421,
        0.0019149751053236309,
        0.0005744925315970893
    ],
    "scale": [
        4531.833921348636,
        0.4660939025063764,
        5.264882113148273,
        2045.9436807094492,
        0.822476880952264,
        80972.87679311143,
        0.6568469850302504,
        38.044680533986465,
        20.00377936169606,
        22.63413218187798,
        15.54798494746994,
        1.0,
        1.0,
        172670.40599343934,
        149340.92623697213,
        85036.15515929375,
        3150.005158907349,
        4995.528887624903,
        2669.2136735340423,
        5511.427481085698,
        0.5538064400116527,
        2720114906.8108735,
        120.49281522064027,
        24123559565.34891,
        3.254538836003513,
        3.019441492431386,
        260061.74052416577,
        0.05605827522056976,
        6.83551392697222,
        11.56595615111284,
        0.22585049876029714,
        1.0,
        34.82196889259456,
        2.7793381331485385,
        0.07692219257557305,
        0.019566510569812023,
        0.09370237557288111,
        0.902452656195132,
        2.1984700869482787,
        0.05174261317134141,
        0.041510812484488985
    ]
}
"#;

#[derive(Debug, Deserialize)]
pub struct IcpModelMetadata {
    pub feature_names: Vec<String>,
    pub num_features: u32,
    pub class_names: Vec<String>,
    pub model_version: String,
    pub model_type: String,
    pub auc_score: f64,
}
// The feature names must be in the exact order the model was trained on.
// This is derived directly from your `features_to_vector` function.
pub const MODEL_METADATA_JSON: &str = r#"
{
    "feature_names": [
        "icp_balance",
        "ckbtc_balance",
        "cketh_balance",
        "ckusdc_balance",
        "num_tokens_held",
        "total_portfolio_value_usd",
        "portfolio_diversity_score",
        "total_transactions",
        "sent_transactions",
        "received_transactions",
        "unique_counterparties",
        "tokens_used",
        "cross_token_user",
        "total_value_sent_usd",
        "total_value_received_usd",
        "net_flow_usd",
        "avg_transaction_value_usd",
        "sent_amount_mean_usd",
        "received_amount_mean_usd",
        "transaction_value_std_usd",
        "tokens_actively_used",
        "primary_token_dominance",
        "transaction_span_days",
        "avg_time_between_txs_hours",
        "transaction_frequency_score",
        "send_receive_ratio",
        "value_sent_received_ratio_usd",
        "mint_to_transfer_ratio",
        "defi_activity_score",
        "round_number_transactions",
        "high_value_transaction_ratio",
        "microtransaction_ratio",
        "ICP_transfer",
        "ckBTC_transfer",
        "ckETH_mint",
        "ckETH_burn",
        "ckUSDC_mint",
        "ckUSDC_transfer",
        "ckETH_transfer",
        "ckUSDC_burn",
        "ckBTC_mint"
    ],
    "num_features": 41,
    "class_names": [
        "illicit",
        "licit"
    ],
    "model_version": "1.0-MLP-Baseline",
    "model_type": "MLPClassifier",
    "auc_score": 0.4851567612588494,
    "blockchain": "icp"
}
"#;
// src/solana/config.rs

pub const SOL_MAX_TRANSACTIONS: usize = 500;
pub const LAMPORTS_TO_SOL: f64 = 1_000_000_000.0;
pub const API_DELAY_MS: u64 = 500;
pub const MAX_RETRIES: u32 = 3;
pub const HELIUS_MAX_RECORDS: usize = 1000;
pub const MAX_TRANSACTIONS_PER_ADDRESS: usize = 50000;
pub const JUPITER_API_DELAY_MS: u64 = 1000;

pub const MODEL_BYTES: &[u8] = include_bytes!("../../models/sol_risk_model_mlp.onnx");

pub const SCALER_PARAMS_JSON: &str = r#"
{
  "mean": [
    4.781818181818182,
    6.736363636363636,
    74.88636363636364,
    0.0,
    1.0,
    8.05,
    5.5590909090909095,
    1.2454545454545454,
    1.0784444246271794,
    0.0,
    0.0,
    0.0,
    21.195454545454545,
    0.26491631894711065,
    0.0,
    0.0,
    0.0,
    2.109090909090909,
    0.9853979637169025,
    0.0017139847665517168,
    1.4,
    0.9181258301843297,
    348785537.23636365,
    352426520.5090909,
    3640982.7954545454,
    44.518181818181816,
    3.9041788101168358,
    40540348.43636364,
    45435443.127272725,
    5.230108602610355,
    1.0493157136692756e-05,
    0.9046238411163646,
    0.042214562476092364,
    0.0006897939861326353,
    0.1429300029472378,
    2.975668874860867,
    0.004633361718278956,
    0.9003538018534966,
    0.1360188794933643,
    0.07439264921372077,
    0.22232282408817608,
    2.254439722089519,
    8.596189777733266e-06,
    0.7749616149971663,
    0.027649492999710885,
    0.0009015290977739983,
    0.1047227610099501,
    6.1136949099018585e-06,
    9.412246914187638e-09,
    1.3604395828314964e-06,
    8.34601770138832e-08,
    2.776818404306234e-08,
    1.9589488898134412e-07,
    1984.9262034752953,
    3.112241911400625,
    595.1677911365965,
    94.263698039544,
    53.21438108363505,
    150.71361714192014,
    1495.2478843417728,
    0.005137705622660059,
    503.2247708827958,
    18.33251584487664,
    0.5637398897604546,
    68.98899309504984,
    12060617096.941492,
    166.3752988450671,
    2662920836.8724966,
    109135624.07171857,
    1712420.741489831,
    411806223.55901057,
    3640982.7954545454,
    1644.5136363636364,
    2014980.8681818182,
    130587.64612963959,
    16363.661363636364,
    374328.0694462007,
    1244375.5727272728,
    74837.84090909091,
    700908.5227272727,
    305199.0705964522,
    296837.91818181815,
    226718.42027560147,
    1498236.2227272727,
    4519.577272727272,
    1068219.5636363637,
    93625.26376693863,
    14637.522727272728,
    244302.9017466168,
    5.181818181818182,
    0.0,
    1.6727272727272726,
    0.2772727272727273,
    2.3863636363636362,
    0.4935406040061604,
    0.3568181818181818,
    0.4369426280260086,
    0.19090909090909092,
    0.5339442057704383,
    0.061210534603080964,
    0.05770065725611692,
    234545456.12236062,
    1.9431464314460754,
    0.008096325698139721,
    121659.54180444912,
    328.45314564731365,
    524.3252800350681,
    165399950.93863636,
    0.058760492626408284,
    0.0,
    0.037074055366048755,
    0.0490637749010189,
    0.0,
    0.053023155338384885,
    26.19643539860324,
    3.8906600537896865,
    0.015154192349026827,
    1.0,
    8200.408694551184,
    1.680458740382032
  ],
  "scale": [
    22.15477860137702,
    21.916028701605285,
    41.9481367605994,
    1.0,
    1.0,
    27.10421386225598,
    26.216600554383458,
    6.947447358086885,
    6.408902755925084,
    1.0,
    1.0,
    1.0,
    33.60536993442792,
    0.3758045337197551,
    1.0,
    1.0,
    1.0,
    12.464017632256065,
    0.08884246977190498,
    0.007914061467903327,
    0.48989794855663565,
    0.1438851328805643,
    45406458.82530619,
    34844644.995514855,
    20339300.558474116,
    33.3017148939215,
    13.0599887383581,
    107023257.72404115,
    113127447.72491142,
    65.29282190384963,
    0.0001106030128128905,
    10.533377796964007,
    0.490680813147694,
    0.007048424132894104,
    1.6692972374965245,
    36.5902761142848,
    0.06798851902315482,
    10.52810424405424,
    1.3101414431440035,
    0.9320536911580093,
    2.3348553462963615,
    28.721767793453274,
    0.00012038871669481847,
    10.390184064168341,
    0.31437598209519424,
    0.01030688727294335,
    1.3412667659485116,
    1.645858911224226e-05,
    7.372222011252264e-09,
    3.5451850272721076e-06,
    1.9462806932594066e-07,
    6.475591294163296e-08,
    4.983937472292885e-07,
    24317.344270609046,
    45.53826529546306,
    6855.204685716187,
    885.6989216453978,
    639.7199847103217,
    1556.721029654892,
    19016.97090669317,
    0.07109786474713388,
    6753.4367065526885,
    207.38896628088708,
    6.474420934777162,
    883.9448660604978,
    151335467922.62112,
    2188.0109284266105,
    30966237747.457806,
    1444680741.0613558,
    25238412.733887635,
    5101433671.771545,
    20339300.558474116,
    20790.024508376726,
    11948649.951064155,
    1149563.7072081238,
    136151.95254191212,
    2595538.053783184,
    12453907.725965062,
    869376.1429096191,
    6457870.139464902,
    3197576.2443851666,
    3092256.8909333916,
    2700286.877434599,
    12580192.737172894,
    66855.86445942312,
    9824300.847706562,
    999373.7653938791,
    146122.12354852806,
    2416634.594615174,
    16.47377078773837,
    1.0,
    7.033179923385349,
    1.031517777655739,
    9.622926952881636,
    1.6431992589756224,
    1.2689289913639636,
    1.8713527020077965,
    0.393017569476678,
    0.39770593656094,
    0.20822405598245916,
    0.17748667819707614,
    1337190825.969125,
    9.902802592297343,
    0.3013513331628843,
    1058406.1367761688,
    1165.5671825101103,
    1508.8159977676687,
    744523012.6105666,
    0.19068992995955988,
    1.0,
    0.15876027426635664,
    0.19181175300888312,
    1.0,
    0.1983718102258432,
    303.14667668288115,
    13.063575443348508,
    0.049303642472799496,
    1.0,
    93245.14401348634,
    1.7125916948505677
  ]
}
"#;

pub const MODEL_METADATA_JSON: &str = r#"
{
    "feature_names": [
        "num_txs_as_sender",
        "num_txs_as_receiver",
        "total_txs",
        "failed_txs",
        "success_rate",
        "sol_txs",
        "token_txs",
        "unique_tokens_transacted",
        "sol_to_token_ratio",
        "dex_swap_txs",
        "lending_txs",
        "staking_txs",
        "programmatic_txs",
        "programmatic_ratio",
        "defi_txs_total",
        "defi_ratio",
        "dex_to_total_ratio",
        "price_fetch_failures",
        "price_fetch_success_rate",
        "account_creation_costs_sol",
        "transaction_context_diversity",
        "most_common_context_ratio",
        "first_slot_appeared_in",
        "last_slot_appeared_in",
        "lifetime_in_slots",
        "num_timesteps_appeared_in",
        "slot_density",
        "first_sent_slot",
        "first_received_slot",
        "btc_transacted_total",
        "btc_transacted_min",
        "btc_transacted_max",
        "btc_transacted_mean",
        "btc_transacted_median",
        "btc_transacted_std",
        "btc_sent_total",
        "btc_sent_min",
        "btc_sent_max",
        "btc_sent_mean",
        "btc_sent_median",
        "btc_sent_std",
        "btc_received_total",
        "btc_received_min",
        "btc_received_max",
        "btc_received_mean",
        "btc_received_median",
        "btc_received_std",
        "fees_total",
        "fees_min",
        "fees_max",
        "fees_mean",
        "fees_median",
        "fees_std",
        "sol_sent_total",
        "sol_sent_min",
        "sol_sent_max",
        "sol_sent_mean",
        "sol_sent_median",
        "sol_sent_std",
        "sol_received_total",
        "sol_received_min",
        "sol_received_max",
        "sol_received_mean",
        "sol_received_median",
        "sol_received_std",
        "fees_as_share_total",
        "fees_as_share_min",
        "fees_as_share_max",
        "fees_as_share_mean",
        "fees_as_share_median",
        "fees_as_share_std",
        "slots_btwn_txs_total",
        "slots_btwn_txs_min",
        "slots_btwn_txs_max",
        "slots_btwn_txs_mean",
        "slots_btwn_txs_median",
        "slots_btwn_txs_std",
        "slots_btwn_input_txs_total",
        "slots_btwn_input_txs_min",
        "slots_btwn_input_txs_max",
        "slots_btwn_input_txs_mean",
        "slots_btwn_input_txs_median",
        "slots_btwn_input_txs_std",
        "slots_btwn_output_txs_total",
        "slots_btwn_output_txs_min",
        "slots_btwn_output_txs_max",
        "slots_btwn_output_txs_mean",
        "slots_btwn_output_txs_median",
        "slots_btwn_output_txs_std",
        "transacted_w_address_total",
        "transacted_w_programs_total",
        "num_addr_transacted_multiple",
        "transacted_w_address_min",
        "transacted_w_address_max",
        "transacted_w_address_mean",
        "transacted_w_address_median",
        "transacted_w_address_std",
        "avg_tx_complexity",
        "burst_activity_score",
        "round_number_ratio",
        "partner_transaction_ratio",
        "activity_density",
        "sol_transaction_size_variance",
        "sol_flow_imbalance",
        "temporal_spread",
        "slot_density_efficiency",
        "fee_percentile",
        "fee_efficiency",
        "interaction_intensity",
        "program_interaction_ratio",
        "token_preference",
        "token_diversity",
        "defi_engagement",
        "programmatic_sophistication",
        "value_per_transaction",
        "burst_activity",
        "mixing_intensity",
        "reliability_score",
        "avg_slot_spacing",
        "transaction_regularity"
    ],
    "num_features": 120,
    "deployment_threshold": 0.6678094863891602,
    "class_names": [
        "benign",
        "malicious"
    ],
    "model_version": "1.0_SOL_MLP",
    "model_type": "MLPClassifier",
    "auc_score": 0.8,
    "best_f1_score": 0.8888888839506174,
    "blockchain": "solana"
}
"#;

// Comprehensive Solana program addresses for filtering
pub const COMPREHENSIVE_PROGRAM_ADDRESSES: &[&str] = &[
    // System Programs
    "11111111111111111111111111111112",  // System Program
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",  // Token Program
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",  // Token Program 2022
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",  // Associated Token Program
    
    // DEXs
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  // Raydium AMM
    "CAMMCzo5YL8w4VFF8KVHrK22GGUQpMDdHwMBSPBy4kD",   // Raydium CLMM
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",  // Orca
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",   // Orca Whirlpools
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",   // Jupiter V6
    "JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB",   // Jupiter V4
    "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1",  // Orca V1
    "EhYXq3ANp5nAerUpbSgd7VK2RRcxK1zNuSQ755G5Mtc1",   // Orca V2
    
    // Serum DEX
    "EUqojwWA2rd19FZrzeBncJsm38Jm1hEhE3zsmX3bRc2o",   // Serum DEX
    "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",   // Serum DEX V3
    "BJ3jrUzddfuSrZHXSCxMbUE2yoHqpiUWyypURhoxiFwZ",   // Serum DEX V2
    
    // Lending Protocols
    "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",   // Solend
    "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg",   // Mango V3
    "mv3ekLzLbnVPNxjSKvqBpU3ZeZXPQdEC3bp5MDEBG68",    // Mango V4
    "LendZqTs7gn5CTSJU1jWKhKuVpjg9avMpS7FgG7V4CJ",   // Port Finance
    "FC81tbGt6JWRXidaWYFXxGnTk2VgEYrLR9c2YLGgCu8z",   // Francium
    
    // Staking Programs
    "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",   // Marinade Finance
    "StakeSSzfxn391k3LvdKbZP5WVwWd6AsY39qcgwy7f3J",   // Native Staking
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",   // JitoSOL
    "SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY",    // Stake Pool Program
    
    // Cross-chain Bridges
    "worm2ZoG2kUd4vFXhvjh93UUH596ayRfgQ2MgjNMTth",   // Wormhole
    "wormDTUJ6AWPNvk59vGQbDvGJmqbDTdgWgAqcLBCgUb",    // Wormhole Token Bridge
    "HDwcJBJXjL9FpJ7UBsYBtaDjsBUhuLCUYoz3zr8SWWaQ",   // Wormhole NFT Bridge
    
    // NFT Marketplaces
    "CJsLwbP1iu5DuUikHEJnLfANgKy6stB2uFgvBBHoyxwz",   // Solanart
    "hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk",    // Metaplex Auction House
    "M2mx93ekt1fmXSVkTrUL9xVFHkmME8HTUi5Cyc5aF7K",    // Magic Eden V1
    
    // Other DeFi
    "CLMM9tUoggJu2wagPkkqs9eFG4BWhVBZWkP1qv3Sp7tR",   // Lifinity
    "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",    // Saber
    
    // Oracle
    "FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH",    // Pyth Oracle
    "gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s",     // Pyth Program
    
    // Governance
    "Gov1BBdCNNqVD39vdFm93vVEwX7xEYqR3AwKbyKPP4",      // SPL Governance
    "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw",     // Realms Governance
];

// Stablecoin addresses for validation
pub const STABLECOIN_ADDRESSES: &[(&str, &str)] = &[
    ("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC"),
    ("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "USDT"), 
    ("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU", "USDC"),  // USDC on other markets
    ("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "mSOL"),   // Marinade SOL
    ("So11111111111111111111111111111111111111112", "WSOL"),   // Wrapped SOL
];

// Known token info for common tokens
pub const KNOWN_TOKEN_INFO: &[(&str, &str, u8)] = &[
    ("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "USDC", 6),
    ("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", "USDT", 6),
    ("So11111111111111111111111111111111111111112", "WSOL", 9),
    ("9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E", "BTC", 6),
    ("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So", "mSOL", 9),
    ("J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn", "jitoSOL", 9),
    ("bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1", "bSOL", 9),
];

// API configurations - REPLACE WITH YOUR API KEYS
pub const HELIUS_API_KEY: &str = "2924b86e-5cf9-4952-b335-fb4efea7eb6d";
pub const CRYPTOCOMPARE_API_KEY: &str = "05c9ed12474c1681807b9948d95d4b3a55e0842ae70bb6091d65c15ad3393296";
pub const MORALIS_API_KEY: &str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6Ijg3MmU4OGMyLTVmMTMtNDFhNC1hODk3LThmMTk0ZDY2NGFlNyIsIm9yZ0lkIjoiNDYwMDAzIiwidXNlcklkIjoiNDczMjU4IiwidHlwZUlkIjoiZjIyNmM1M2MtM2U3Ni00Y2Y1LThjOWEtZDY1NzAxOWI5YWUyIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTI4MzkzNjksImV4cCI6NDkwODU5OTM2OX0.Eh_iVFjeJH11aNFMFPxQjWJdR_Hxs0dOg3gnzYX-eiA";

// DEX, Lending, and Staking program sets for transaction classification
pub const DEX_PROGRAMS: &[&str] = &[
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",  // Raydium
    "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",  // Orca
    "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",   // Jupiter
    "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",   // Orca Whirlpools
];

pub const LENDING_PROGRAMS: &[&str] = &[
    "So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo",   // Solend
    "4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg",   // Mango
    "LendZqTs7gn5CTSJU1jWKhKuVpjg9avMpS7FgG7V4CJ",   // Port Finance
];

pub const STAKING_PROGRAMS: &[&str] = &[
    "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD",   // Marinade
    "StakeSSzfxn391k3LvdKbZP5WVwWd6AsY39qcgwy7f3J",   // Native Staking
    "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",   // JitoSOL
];
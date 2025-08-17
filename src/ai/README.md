# 🛡️ Multi-Chain On-Chain Ransomware Detector on the Internet Computer

This project showcases an advanced **multi-chain machine learning** system that detects ransomware-related activity across Bitcoin, Ethereum, and Solana blockchains. Deployed as a **canister smart contract on the Internet Computer (ICP)** blockchain, it provides **trustless and decentralized** inference with flexible preprocessing architectures tailored for each blockchain's unique characteristics.

---

## 🚀 Key Features

* **Multi-Chain Support**
  Comprehensive analysis across Bitcoin, Ethereum, and Solana networks with chain-specific optimizations and feature extraction methodologies.

* **Hybrid Processing Architecture**
  - **Bitcoin & Ethereum**: Optimized hybrid approach with preprocessing handled client-side for enhanced efficiency
  - **Solana**: Full on-chain processing with integrated feature extraction and analysis

* **Advanced ML Inference**
  Neural network models (MLP) powered by [`tract-onnx`](https://github.com/sonos/tract) for high-performance on-chain predictions.

* **Stateful & Upgrade-Safe**
  Canisters persist models and metadata across upgrades using **stable memory**, ensuring production reliability.

* **Flexible Data Processing**
  Modular preprocessing pipeline that adapts to different blockchain architectures and data availability patterns.

* **Atomic ML Deployment**
  ONNX models are **embedded into the Wasm binary** during compilation, ensuring perfect model-code synchronization.

* **Production-Ready APIs**
  Robust input validation, pagination support, and graceful error handling for enterprise-grade reliability.

---

## 🧠 Technology Stack

| Layer              | Technology                       |
| ------------------ | -------------------------------- |
| **Backend**        | Rust                             |
| **Blockchain**     | Internet Computer (DFINITY)      |
| **ML Inference**   | tract-onnx                       |
| **Model Training** | Python (Scikit-learn + skl2onnx) |
| **Data Sources**   | Multi-chain APIs (Bitcoin, Ethereum, Solana) |

---

## 🧱 Project Structure

```
ai/
├── models/
│   ├── btc_risk_model_mlp.onnx      # Bitcoin MLP model
│   ├── eth_risk_model_mlp.onnx      # Ethereum MLP model
│   └── sol_risk_model_mlp.onnx      # Solana MLP model
├── src/
│   ├── btc/                         # Bitcoin-specific modules
│   │   ├── config.rs                # BTC configuration
│   │   ├── mod.rs                   # BTC module entry
│   │   └── models.rs                # BTC model handling
│   ├── eth/                         # Ethereum-specific with ERC20 Support
│   │   ├── config.rs                # ETH configuration
│   │   ├── mod.rs                   # ETH module entry
│   │   ├── models.rs                # ETH model handling
│   │   └── prediction.rs            # ETH prediction logic
│   ├── sol/                         # Solana-specific modules
│   │   ├── config.rs                # SOL configuration
│   │   ├── data_extractor.rs        # SOL data extraction
│   │   ├── feature_calculator.rs    # SOL feature calculation
│   │   ├── mod.rs                   # SOL module entry
│   │   ├── models.rs                # SOL model handling
│   │   ├── prediction.rs            # SOL prediction logic
│   │   └── price_converter.rs       # SOL price conversion
│   ├── address_detector.rs          # Multi-chain address detection
│   ├── lib.rs                       # Main canister entry point
│   └── shared_models.rs             # Cross-chain shared utilities
├── training/
│   ├── config/
│   │   ├── model_metadata.json      # Model thresholds and metadata
│   │   └── scaler_parameters.json   # Feature scaling parameters
│   ├── data_samples/
│   │   └── test_sample.json         # Testing data samples
│   └── scripts/
│       └── onnx_xgtrain_v3.py       # Model training script
├── ai.did                           # Candid interface definition
├── Cargo.toml                       # Rust crate configuration
└── README.md                        # Documentation (this file)
```

---

## ⚙️ Getting Started

### ✅ Prerequisites

* [DFINITY SDK (dfx)](https://smartcontracts.org/docs/quickstart/quickstart.html)
* Python ≥ 3.10
* Recommended: Python virtual environment (`venv`)

---

### 🔧 Step 1: Set Up the Environment

```bash
# Clone the repository
git clone https://github.com/FradiumOfficial/AI.git
cd AI

# Optional: Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install required Python libraries
pip install pandas numpy scikit-learn onnx onnxruntime skl2onnx joblib
```

---

### 🤖 Step 2: Train the Models & Export Artifacts

```bash
# Navigate to training scripts directory
cd training/scripts
python onnx_xgtrain_v3.py
```

This script will:

* Train MLPClassifier models for each blockchain
* Export configuration artifacts to `training/config/`:
  * `model_metadata.json`
  * `scaler_parameters.json`
* Generate ONNX models for Bitcoin, Ethereum, and Solana

---

### 🧬 Step 3: Configure the Canister

Model artifacts are automatically loaded during canister initialization:

1. **Multi-Chain Models:**
   * Bitcoin: `models/btc_risk_model_mlp.onnx`
   * Ethereum: `models/eth_risk_model_mlp.onnx`
   * Solana: `models/sol_risk_model_mlp.onnx`

2. **Configuration Files:**
   * Model metadata loaded from `training/config/model_metadata.json`
   * Scaling parameters from `training/config/scaler_parameters.json`

3. **Test Data:**
   * Sample data available in `training/data_samples/test_sample.json`

---

### 🚀 Step 4: Deploy the Canister

#### 1. Start a Clean Replica

```bash
dfx start --clean --background
```

#### 2. Deploy the Canister

```bash
dfx deploy
```

> Expected initialization logs:
>
> ```
> [init] ✅ Multi-chain models loaded successfully
> [init] ✅ Configuration metadata loaded
> [init] ✅ Ready for multi-chain analysis
> ```

---

### ♻️ Optional: Redeploy After Model Updates

For model retraining or configuration updates:

```bash
dfx deploy --mode reinstall
```

This triggers the `#[init]` function, reloading updated models and configurations.

---

### 🧪 Step 5: Test Multi-Chain Analysis

#### ✔️ Check Deployment Status

```bash
dfx canister call ai get_model_info
```

#### 🔍 Analyze Bitcoin Addresses (Hybrid Processing)

```bash
# Bitcoin analysis with preprocessed features
dfx canister call ai analyze_btc_address '(vec {0.1; 0.5; 0.8; 0.3}, "13AM4VW2dhxYgXeQepoHkHSQuy6NgaEb94", 42)'
```

#### 🔍 Analyze Ethereum Addresses (Hybrid Processing)

```bash
# Ethereum analysis with feature map
dfx canister call ai analyze_eth_address '(vec {record {"tx_frequency"; 0.7}; record {"amount_variance"; 0.3}}, "0x123...", 15)'
```

#### 🔍 Analyze Solana Addresses (Full On-Chain Processing)

```bash
# Solana analysis with complete on-chain processing
dfx canister call ai analyze_sol_address '("11111111111111111111111111111112")'
```

---

## 🏗️ Architecture Overview

### Processing Models by Chain

#### 🟠 Bitcoin & Ethereum - Hybrid Architecture
- **Client-Side Preprocessing**: Feature extraction and data preparation handled externally for optimal efficiency
- **On-Chain Inference**: ML model predictions executed within the canister
- **Benefits**: Reduced computational overhead while maintaining decentralized inference

#### 🟣 Solana - Full On-Chain Processing
- **Integrated Pipeline**: Complete feature extraction, preprocessing, and inference on-chain
- **Self-Contained**: No external dependencies for data processing
- **Advanced Integration**: Direct blockchain data access and real-time analysis

### Core Components

- **Address Detector**: Multi-chain address format recognition and routing
- **Chain-Specific Modules**: Tailored processing for Bitcoin, Ethereum, and Solana
- **Model Interface**: Unified ML model loading and inference across chains
- **Feature Processors**: Chain-optimized feature extraction and calculation
- **Prediction Engines**: Specialized prediction logic for each blockchain

---

## 📊 Model Information

The system employs specialized machine learning models trained on blockchain-specific behavioral patterns:

### Bitcoin Features
- Transaction frequency and timing patterns
- Address clustering and wallet behavior
- Amount distribution analysis
- UTXO spending patterns

### Ethereum Features  
- Smart contract interaction patterns
- ERC-20 token transaction behavior
- Gas usage optimization patterns
- Address interaction networks

### Solana Features
- Program interaction analysis
- Token account management patterns
- Transaction fee optimization
- Validator interaction behavior

All models are trained using scikit-learn and exported to ONNX format for efficient on-chain inference.

---

## 🔧 Development

### Adding New Blockchain Support

1. Create new chain module in `src/{chain}/`
2. Implement chain-specific feature extraction
3. Train and export ONNX model to `models/`
4. Update address detection in `address_detector.rs`
5. Add new endpoint in `lib.rs`

### Updating Existing Models

1. Modify feature calculation in respective chain modules
2. Retrain models using `training/scripts/onnx_xgtrain_v3.py`
3. Update configuration in `training/config/`
4. Redeploy canister with `--mode reinstall`

### Testing

Comprehensive test samples are provided in `training/data_samples/test_sample.json` for validation across all supported chains.

---

## 🔄 API Reference

### Analyze Bitcoin Address
```rust
analyze_btc_address(features: Vec<f32>, address: String, transaction_count: u32) -> Result<RansomwareResult, String>
```

### Analyze Ethereum Address  
```rust
analyze_eth_address(features: HashMap<String, f64>, address: String, transaction_count: u32) -> Result<RansomwareResult, String>
```

### Analyze Solana Address
```rust
analyze_sol_address(address: String) -> Result<RansomwareResult, String>
```

---

## 📌 Notes

* The project implements upgrade-safe patterns (`pre_upgrade`, `post_upgrade`) for production resilience
* Multi-chain architecture allows seamless extension to additional blockchain networks
* Prediction outputs are probabilistic and should be used as part of comprehensive risk assessment
* Each chain module is optimized for its specific blockchain characteristics and data availability patterns

---

## 📜 License

This project is open-sourced under the MIT License. See [LICENSE](LICENSE) for details.
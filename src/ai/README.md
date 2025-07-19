# 🛡️ On-Chain Ransomware Detector on the Internet Computer

This project showcases a fully **on-chain machine learning** system that detects ransomware-related activity based on the behavioral patterns of Bitcoin addresses. It is deployed as a **canister smart contract on the Internet Computer (ICP)** blockchain, allowing **trustless and decentralized** inference directly on-chain—no external servers needed.

---

## 🚀 Key Features

* **Fully On-Chain ML Inference**
  All predictions are executed within the canister using a neural network (MLP) model powered by [`tract-onnx`](https://github.com/sonos/tract). No off-chain computation is required.

* **Stateful & Upgrade-Safe**
  The canister persists its model and metadata across upgrades using **stable memory**, ensuring reliability in production.

* **Decoupled Preprocessing**
  Preprocessing and feature scaling are separated from the model, following machine learning deployment best practices.

* **Atomic ML Deployment**
  The ONNX model is **embedded into the Wasm binary** during compilation to ensure exact model-code synchronization.

* **Robust Input/API Handling**
  Pagination, API call limits, and malformed input are gracefully handled to ensure resilience and responsiveness.

---

## 🧠 Technology Stack

| Layer              | Technology                       |
| ------------------ | -------------------------------- |
| **Backend**        | Rust                             |
| **Blockchain**     | Internet Computer (DFINITY)      |
| **ML Inference**   | tract-onnx                       |
| **Model Training** | Python (Scikit-learn + skl2onnx) |
| **Data Source**    | blockchain.info API              |

---

## 🧱 Project Structure

```
ai/
├── config/
│   ├── model_metadata.json          # Thresholds and metadata
│   └── scaler_parameters.json       # Scaler values for preprocessing
├── data_samples/
│   └── test_sample.json             # Sample input used for testing
├── detector_service/
│   └── src/
│       ├── btc/                     # Bitcoin-specific 
│       │   ├── config.rs
│       │   ├── mod.rs
│       │   └── models.rs
│       ├── eth/                     # Ethereum-specific with ERC20 Support
│       │   ├── config.rs
│       │   ├── data_extractor.rs
│       │   ├── feature_calculator.rs
│       │   ├── mod.rs
│       │   ├── models.rs
│       │   ├── prediction.rs
│       │   └── price_converter.rs
│       ├── address_detector.rs      # Unified address prediction logic
│       ├── lib.rs                   # Main entry point of the canister
│       ├── ransomware_detector.did  # Candid interface definition
│       └── shared_models.rs         # Reusable types or shared utilities
├── models/                          # (Optional) Store generated models
├── scripts/                         # (Optional) For any extra tooling/scripts
├── Cargo.toml                       # Rust crate config
├── Cargo.lock                       # Locked Rust dependencies
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

### 🤖 Step 2: Train the Model & Export Artifacts

```bash
# Navigate to scripts directory and run training
cd scripts
python train_model.py
```

This script will:

* Train the MLPClassifier and StandardScaler
* Export artifacts to the `ai/config/` directory:
  * `model_metadata.json`
  * `scaler_parameters.json`
* Save trained models to the `ai/models/` directory

---

### 🧬 Step 3: Configure the Canister

The model artifacts are automatically loaded from the `ai/config/` directory:

1. **Model Metadata:**
   * Configuration is loaded from `ai/config/model_metadata.json`
   * Contains classification thresholds and model parameters

2. **Scaler Parameters:**
   * Feature scaling parameters are loaded from `ai/config/scaler_parameters.json`
   * Ensures consistent data preprocessing

3. **Test Data:**
   * Sample addresses for testing are available in `ai/data_samples/test_samples.json`

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

> You should see logs such as:
>
> ```
> [init] ✅ Metadata loaded successfully
> [init] ✅ Embedded model loaded
> ```

---

### ♻️ Optional: Redeploy After Model Updates

If you retrain the model or update metadata:

```bash
dfx deploy --mode reinstall
```

This ensures the `#[init]` function is triggered again, reloading the new model and metadata.

---

### 🧪 Step 5: Test the Canister

#### ✔️ Check Deployment Status

```bash
dfx canister call ransomware_detector get_model_info
```

> Expected Output:
>
> ```bash
> (variant { Ok = "Status - Metadata: LOADED... | Model: LOADED" })
> ```

#### 🔍 Analyze Bitcoin Addresses

```bash
# Illicit address (example)
dfx canister call ransomware_detector analyze_address '("13AM4VW2dhxYgXeQepoHkHSQuy6NgaEb94")'

# Normal address
dfx canister call ransomware_detector analyze_address '("1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s")'
```

#### 🔍 Analyze Ethereum Addresses

```bash
# Ethereum address analysis
dfx canister call ransomware_detector analyze_eth_address '("0x123...")'
```

---

## 🏗️ Architecture Overview

### Core Components

- **Detector Service**: Main service handling address analysis requests
- **Feature Calculator**: Extracts behavioral features from blockchain data
- **Model Interface**: Handles ML model loading and inference
- **Data Extractor**: Retrieves blockchain transaction data
- **Prediction Engine**: Processes features through trained models

### Multi-Chain Support

- **Bitcoin**: Primary ransomware detection using transaction patterns
- **Ethereum**: Extended support for Ethereum address analysis including Ethereum address which has ERC20 transactions

---

## 📊 Model Information

The system uses machine learning models trained on behavioral patterns of Bitcoin addresses, including:

- Transaction frequency patterns
- Amount distribution analysis
- Address clustering behavior
- Temporal transaction patterns

Models are trained using scikit-learn and exported to ONNX format for efficient on-chain inference.

---

## 🔧 Development

### Adding New Features

1. Update feature calculation in `ai/eth/feature_calculator.rs` or equivalent
2. Retrain models using updated scripts
3. Update configuration files in `ai/config/`
4. Redeploy the canister

### Testing

Test samples are provided in `ai/data_samples/test_samples.json` for validation and testing purposes.

---

## 📌 Notes

* The project is designed with upgrade hooks (`pre_upgrade`, `post_upgrade`) to ensure resilience.
* The model supports inference for Bitcoin and Ethereum addresses based on transaction patterns.
* Prediction output is probabilistic and should be used as one of several indicators for illicit activity.
* Multi-chain architecture allows for easy extension to other blockchain networks for later development.

---

## 📜 License

This project is open-sourced under the MIT License. See [LICENSE](LICENSE) for details.

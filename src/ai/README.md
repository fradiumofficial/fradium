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
.
├── src/
│   └── ransomware_detector.did        # Canister interface 
│   └── lib.rs                         # Main Rust source code
├── onnx_xgtrain_v3.py                 # Model training and ONNX conversion
├── ransomware_model_mlp.onnx         # Pre-trained MLP model (embedded)
├── scaler_parameters.json            # Feature scaling metadata
├── model_metadata.json               # Thresholds and classifier metadata
├── test_sample.json                  # Sample test data (illicit address)
├── Cargo.toml                        # Rust dependencies
├── dfx.json                          # Internet Computer config
└── README.md                         # Project documentation
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
git clone https://github.com/NusantaraGuard/AI.git
cd <your-repo-folder>

# Optional: Create and activate a Python virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install required Python libraries
pip install pandas numpy scikit-learn onnx onnxruntime skl2onnx joblib
```

---

### 🤖 Step 2: Train the Model & Export Artifacts

```bash
python onnx_xgtrain_v3.py
```

This script will:

* Train the MLPClassifier and StandardScaler
* Export:

  * `ransomware_model_mlp.onnx`
  * `scaler_parameters.json`
  * `model_metadata.json`

Place these files in the project root directory.

---

### 🧬 Step 3: Embed Artifacts into Rust Canister

Update the Rust code to embed the new files:

1. **Model File:**

   * Ensure `ransomware_model_mlp.onnx` is in the root directory.
   * The file is embedded using `include_bytes!` in `lib.rs`.

2. **Scaler Parameters:**

   * Open `scaler_parameters.json`
   * Copy all contents and replace the string inside:

     ```rust
     const SCALER_PARAMS_JSON: &str = r#"..."#;
     ```

3. **Model Metadata:**

   * Open `model_metadata.json`
   * Copy all contents and replace the string inside:

     ```rust
     const MODEL_METADATA_JSON: &str = r#"..."#;
     ```

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

---

## 📌 Notes

* The project is designed with upgrade hooks (`pre_upgrade`, `post_upgrade`) to ensure resilience.
* The model supports inference for any valid Bitcoin address based on transaction patterns.
* Prediction output is probabilistic and should be used as one of several indicators for ransomware activity.

---

## 📜 License

This project is open-sourced under the MIT License. See [LICENSE](LICENSE) for details.


# 🌟 Fradium - The Trust Layer for Web3 Transactions

![Fradium Cover](https://raw.githubusercontent.com/FradiumOfficial/fradium/refs/heads/main/docs/images/cover.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Internet Computer](https://img.shields.io/badge/Internet%20Computer-Protocol-blue?logo=internet-computer&logoColor=white)](https://internetcomputer.org/)
[![Motoko](https://img.shields.io/badge/Motoko-Agent-red)](https://internetcomputer.org/docs/current/motoko/main/motoko)

Fradium is a security and analytics platform built fully onchain and designed to work seamlessly across multiple blockchain networks including Bitcoin, Ethereum, Solana, Internet Computer, and others network., Fradium enables real-time address analysis, transaction insights, and threat detection across different ecosystems.

The platform provides a complete set of tools including a decentralized wallet app, browser extension, and community-driven reporting system. Users can analyze, report, and transact with greater confidence. Suspicious addresses are identified through AI models trained on high-quality datasets, and results are continuously improved through community contributions and verified reports. With token incentives and transparent voting, Fradium empowers users to actively participate in securing the Web3 space.

🌟 **Built for WCHL 2025 Hackathon** - [View on DoraHacks](https://dorahacks.io/buidl/28746)

## 🎯 Why Fradium?

Fradium addresses urgent challenges in Web3 security and adoption:

- Despite ranking **#3 globally in crypto adoption** with **356% YoY growth**, Crypto global scams reaching **$2.5B in 2023**, saw **332K wallet drainer victims**, and over **$40.9B** was sent to illicit addresses.
- These risks are driven by **low blockchain literacy** and lack of awareness around smart contract and wallet vulnerabilities.
- Traditional wallets and explorers provide **limited protection or context**, leaving users exposed to phishing, scams, and malicious addresses.

Our solution introduces **Fradium**, a fully on-chain security and analytics platform that provides real-time address analysis, transaction insights, and AI-powered threat detection across multiple blockchains. With decentralized reporting, tokenized incentives, and transparent governance, Fradium empowers users to transact with confidence while actively contributing to securing the Web3 ecosystem.

## 📚 Complete Resources

- Mainnet: https://t4sse-tyaaa-aaaae-qfduq-cai.icp0.io
- Video Demo: https://youtu.be/-j6LzwI1Df8
- Pitch Deck: https://drive.google.com/file/d/1x5Ow79NvpL58VqSLkqNf8o9VOg_UfAKm/view?usp=sharing
- Docs: https://fradium.gitbook.io/docs
- Extension Chrome store: [Chrome store](https://chromewebstore.google.com/detail/fradium-the-trust-layer-f/bkkhicfomfaagfhnlechfapddmdfabdp)

## 🎉 What’s New in the Regional Round

### 🔹 Fradium Wallet – Browser Extension

Fradium now comes as a **lightweight browser extension** that runs directly in your browser.
No extra setup, no heavy installs — just seamless access to your wallet wherever you browse.

**Key highlights:**

- Real-time address scanning and safety checks
- Multi-chain token support in one unified UI
- On-chain evidence links for flagged entities

### 🔍 ICP AI Address Analyzer

Introducing **ICP AI Address Analyzer**, an advanced AI-powered tool built specifically for the Internet Computer ecosystem.
Unlike generic scanners, this analyzer is trained to **understand and evaluate ICP addresses**, including those following the **ICRC-1 token standard**.

With it, users can:

- **Scan and analyze ICP addresses** with full ICRC-1 support
- **Detect risks** such as scam clusters, drainer proximity, or suspicious transaction histories
- **Generate explanations backed by on-chain data** for transparency and trust
- **Empower safer decision-making** before sending or signing any transaction

📖 For more details, see [technical explanation](#-how-the-fradium-ai-threat-detection-works-white-box-view).

### 🎨 Redesigned User Interface

We’ve completely **redesigned the Fradium UI** to deliver a modern, cleaner, and more intuitive experience.
[See the new interface →](#fradium-interface)

### 🧪 Beta Testing with Real Users (SUS Framework)

To ensure Fradium is not just powerful but also **usable**, we ran **beta tests with real users**, applying the **System Usability Scale (SUS)** framework.
This gave us concrete feedback on clarity, efficiency, and user confidence.

| ![Image 1](docs/images/testing/fieldwork.png) ![Image 2](docs/images/testing/experience.png) | ![Image 2](docs/images/testing/complex.png) ![Image 2](docs/images/testing/confident.png) |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |

| [![Watch the video](https://img.youtube.com/vi/9H5q75SkUJg/maxresdefault.jpg)](https://youtu.be/9H5q75SkUJg) |
| ------------------------------------------------------------------------------------------------------------ |

🎥 Above is a short video recap of the beta testing process and user feedback:
[Watch the video](https://youtu.be/9H5q75SkUJg)

---

## 🌟 Features of Fradium

### Fradium Wallet App (Cross-Chain & On-Chain)

- Manage multiple blockchain assets in a single interface.
- Supports major networks like Bitcoin, Ethereum, Solana, and ICP.
- Wallet addresses are generated on-chain with secure identity binding.
- Send and receive tokens across supported networks.
- Each recipient address is analyzed in real time before sending.
- Transaction History & Scan Logs

### Fradium Wallet Extension

- Simple browser tool to keep your Web3 activity safe
- Automatically checks recipient addresses before you send
- Gives clear risk explanations with reasons and evidence
- Supports many coins with cross-chain token support in one place
- Keeps scan history logs that you can review anytime in the web app

### Multi-Chain Analytics Engine (AI onchain detection)

- Fradium AI detects threats using high-quality, evolving datasets.
- Analyzes address behavior across chains in real time.
- Continuously improved through community and machine learning feedback.

### Fradium Community Report

- Report suspicious addresses and review reports from others.
- Submit supporting evidence to back your report.
- Earn $FRADIUM tokens through voting and contribution validation.
- Voting & Governance (Proof of Credible Contribution - PoCC)
- Stake your tokens and vote on submitted reports.
- Contributions are publicly tracked and rewarded.

### $FRADIUM Token System

- Utility and governance token within the Fradium ecosystem.
- Used for staking, voting, and rewarding credible reports.
- All token actions are handled securely on-chain.

---

## 📃 How the Fradium AI Threat Detection Works (White-Box View):

- **Real-Time Address Analysis**: Constantly analyzes blockchain addresses across multiple chains (Bitcoin, Ethereum, Solana, ICP) as transactions occur.
- **Advanced Feature Engineering**: Extracts 100+ behavioral and transactional features, including:

  - _Transaction Patterns_: Frequency, timing, and amount distributions of address activity.
  - _Network Relationships_: Address clustering, interaction patterns, and connection analysis.
  - _Behavioral Signatures_: UTXO spending patterns, smart contract interactions, and gas usage.
  - _Risk Indicators_: Known scam patterns, suspicious activity flags, and anomaly detection.

- **Multi-Chain Intelligence**: Builds comprehensive threat profiles by analyzing chain-specific behaviors and cross-chain patterns, modeling different attack vectors and fraud techniques.
- **Predictive Modeling**: Uses Neural Networks (MLP) via ONNX to predict threat levels, highlighting the most influential features driving security assessments.

#### What the AI Prioritizes:

Our model has learned that the most critical predictors of malicious activity are:

- **Transaction Clustering Patterns** – How addresses group together and interact with known threat actors has the strongest impact on threat scoring.
- **Behavioral Anomalies** – Deviations from normal spending/interaction patterns significantly affect risk assessment.
- **Network Position & Gas Usage** – How addresses position themselves in the network and their resource consumption patterns.
- **Temporal Analysis** – Timing patterns, activity bursts, and coordination with other suspicious addresses.

Other factors such as transaction amounts, contract interactions, and validator patterns still contribute, but with less influence compared to the above.

| Technical Architecture | Model Performance                                 |
| ---------------------- | ------------------------------------------------- |
| **ML Framework**       | Neural Networks (MLP) via ONNX                    |
| **Inference Engine**   | tract-onnx on Internet Computer                   |
| **Model Training**     | Python (scikit-learn)                             |
| **Deployment**         | Embedded ONNX models in Wasm canisters            |
| **Processing**         | On-chain inference for trustless predictions      |
| **Learning**           | Continuous improvement through community feedback |

#### Multi-Chain Coverage:

- **Bitcoin Detection**: Analyzes UTXO patterns, transaction clustering, and spending behaviors
- **Ethereum Detection**: Examines smart contract interactions, ERC-20 token flows, and gas usage patterns
- **Solana Detection**: Evaluates program interactions, token account behaviors, and validator patterns
- \*\*ICP Detection: Monitors canister interaction patterns, cycles consumption behavior, principal authentication analysis, and inter-canister communication patterns

| Features Importance                     | Confusion Matrix                         |
| --------------------------------------- | ---------------------------------------- |
| ![Image 1](docs/images/ai/features.png) | ![Image 2](docs/images/ai/confusion.png) |

| Precision Recall                         | True/False Positive                | Training Loss                           |
| ---------------------------------------- | ---------------------------------- | --------------------------------------- |
| ![Image 1](docs/images/ai/precision.png) | ![Image 2](docs/images/ai/roc.png) | ![Image 3](docs/images/ai/training.png) |

📖 For more details, see the [technical explanation](src/ai/README.md).

---

## 🚀 Build and Deployment Instructions

### Prerequisites

- [ ] Install the [IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/index.mdx) v0.27.0. If the IC SDK is already installed with an old version, install 0.27.0 with [`dfxvm`](https://internetcomputer.org/docs/building-apps/developer-tools/dev-tools-overview#dfxvm).
- [ ] Confirm the IC SDK has been installed with the correct version with `dfx --version`.
- [ ] Install [candid-extractor](https://crates.io/crates/candid-extractor)
- [ ] On **macOS**, an `llvm` version that supports the `wasm32-unknown-unknown` target is required. This is because the `zstd` crate (used, for example, to decode `base64+zstd`-encoded responses from Solana's [`getAccountInfo`](https://solana.com/de/docs/rpc/http/getaccountinfo)) depends on LLVM during compilation. The default LLVM bundled with Xcode does not support `wasm32-unknown-unknown`. To fix this, install the [Homebrew version](https://formulae.brew.sh/formula/llvm), using `brew install llvm`.

Begin by opening a terminal window.

### Install MOPS

[Install](https://docs.mops.one/quick-start#2-install-mops-cli) the MOPS package
manager, e.g., by running

```bash
curl -fsSL cli.mops.one/install.sh | sh
```

### Install cargo:

```sh
curl https://sh.rustup.rs -sSf | sh
```

### Install Bitcoin Locally with Regtest

Fradium includes Bitcoin functionality. For testing and development, you can run a local Bitcoin regtest instance, allowing you to mine blocks instantly, issue fake BTC, and test transfers securely.

To set up your local Bitcoin regtest environment, follow this official guide:

👉 [Install bitcoin on local machine](https://internetcomputer.org/docs/build-on-btc/btc-dev-env)

The guide walks you through:

- Installing bitcoind
- Creating bitcoin.conf and bitcoin_data directory
- Running bitcoind

Once bitcoind is running successfully on your local machine, you can proceed to set up and deploy the application.

### Setup Application:

- Start local Internet Computer replica

  ```sh
   cd fradium/
   dfx start --clean --background
  ```

- Deploy applications

  ```sh
   dfx deploy
  ```

- Run the script to mint Fradium tokens to the backend

  ```sh
   chmod +x ./scripts/fradium.mint_backend.sh
   ./script/fradium.mint_backend.sh
  ```

## 🏗️ Architecture Overview

Fradium is built fully on-chain, combining multi-chain analytics, AI inference, and community governance into a seamless security layer for Web3. The architecture ensures every transaction is checked before execution, supported by AI models running inside Internet Computer canisters.

### 🔹 System Architecture

The high-level design of Fradium, showing how cross-chain data flows into the analytics engine, how AI models run on-chain, and how users interact via wallet, extension, and reporting modules.

![Fradium Architecture Diagram](https://github.com/FradiumOfficial/fradium/blob/main/docs/images/architecture.png?raw=true)

### 🔹 User Flow

Illustrates the journey of a user interacting with Fradium — from scanning an address, receiving an AI-powered risk score, to community-driven reporting and DAO voting for validation.

![User Flow Diagram](https://github.com/FradiumOfficial/fradium/blob/main/docs/images/userflow.png?raw=true)

## 🔥 Complex Features Implemented

- **Chain fusion Technology**: Unified integration with multiple blockchain networks, allowing address lookups, transaction insights, and security checks across different ecosystems from a single platform.
- **AI On-Chain Address Analyzer**: Advanced machine learning models trained on complex datasets of blockchain activity, converted into **ONNX format** and deployed directly on Internet Computer canisters for real-time, trustless threat detection.
- **Fradium Wallet Extension**: A browser-based companion tool that adds pre-send safety checks, risk explanations, and cross-chain token support, helping users stay safe while interacting with dApps, wallets, and explorers.
- **LLM On-Chain Interaction**: Large Language Model successfully deployed inside an ICP canister, enabling intelligent on-chain AI interaction without relying on off-chain servers.
- **DAO-Driven Community Reporting & Voting**: A fully on-chain governance system where users can report suspicious addresses, validate evidence, and participate in decentralized voting—forming a security-focused DAO that strengthens collective trust in Web3.
- **Custom $FRADIUM Token**: Native utility and governance token built with **ICRC-1 and ICRC-2 standards**, powering staking, voting, and rewarding credible community contributions.

# **Fradium Roadmap**

### Phase 1 – Ecosystem Foundation

- Launch browser extension for **address analysis & transaction safety**
- Develop & deploy **Web Wallet App** with **Solana** and **Bitcoin** transaction support
- Deploy **community-driven reporting system** (voting + contribution tracking)
- Launch **\$FRADIUM token** with full **ICRC-1** & **ICRC-2** standard support
- Release browser extension on **Chrome Web Store** and **Firefox Add-ons**
- Integrate **AI detection** for **Ethereum** & **Bitcoin** address analysis

---

### Phase 2 – Expanding Accessibility

- Develop **cross-platform browser extension wallet**
- Enable **Ethereum transaction support** & **ERC20 token management**
- Expand **AI detection** to support **Solana** address analysis

---

### Phase 3 – Full Multi-Chain Experience & Market Fit

- Launch **integrated browser extension wallet** for **unified UX**
- Enable full support for **ICP native tokens** (ckBTC, ckETH, other chain-key assets)
- Expand **AI Analyzer** to cover all **ICRC-standard** tokens on ICP (ICRC-1 & ICRC-2)
- **Launch AI Agent Assistant**:
  - Use natural language prompts to transfer, receive, analyze addresses, and access all wallet features
  - Make Fradium accessible even for non-technical users through conversational interaction
- **Focus on Market Fit**:

  - Conduct **beta testing** with real users
  - Collect **user testimonials** to validate trust & usability
  - Run **structured feedback sessions** to identify improvement areas
  - Continuously **optimize features** based on real-world usage

### Phase 4 – Decentralized Governance & Advanced Integration

- Integrate Fradium into the **SNS (Service Nervous System)** → decentralized ownership & governance
- Research & prototype **Fradium SDK/API** → allow third-party apps to access AI & security tools
- Integrate with ICPSwap for real-time token swap
- Integrate fiat on-ramp providers using Moonpay

## 📃 License

Distributed under the MIT License. See `LICENSE.txt` for more information.

## 🍀 Our Teams

- Wildan Syukri Niam (Frontend Developer)
- Bintang Alfath Gavin Alinski (Product Developer)
- Ghina Rosvita Maharani (UI/UX Designer)
- Arga Adolf Lumunon (AI Engineer)
- Yazid Al Ghozali (Extension Developer)

# 🔍 Fradium Analyzer — Ethereum Smart Contract Security Scanner

A lightweight Flask-based API to analyze Ethereum smart contracts using [Mythril](https://github.com/ConsenSys/mythril), with contract source fetched from Etherscan and flattened via Hardhat.

---

## 🚀 Run Locally with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/NusantaraGuard/fradium.git
cd fradium/mythril
```

---

### 2. Create Environment Config

```bash
cp .env.example .env
```

Edit `.env` and set your Etherscan API Key:

```env
ETHERSCAN_API_KEY=your_etherscan_api_key
```

---

### 3. Start the Application with Docker Compose

```bash
docker compose up --build
```

The Flask app will be available at:  
👉 `http://localhost:5000/analyze`

---

## 📡 API Usage

### Endpoint: `POST /analyze`

**Example Request:**

```bash
curl -X POST http://localhost:5000/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0xD533a949740bb3306d119CC777fa900bA034cd52"}'
```

**Example Response:**

```json
{
  "report": {
    "summary": {
      "total_issues": 1,
      "high": 1,
      "medium": 0,
      "low": 0,
      "info": 0
    },
    "issues": [
      {
        "title": "Delegatecall to user-supplied address",
        "description": "...",
        "contract": "ERC1967Proxy",
        "function": "fallback",
        "severity": "High",
        "swc_id": "112",
        "lineno": 601,
        "code": "delegatecall(...)"
      }
    ],
    "status": "ok"
  }
}
```

---

## ⚙️ Project Requirements

This project requires only **Docker** and **Docker Compose** installed on your system. No need to install Python or Node.js manually.

---

## 📁 Directory Overview

```
.
├── analyzer/               # Python modules (fetch, flatten, analyze)
├── contracts/              # Optional local contracts
├── app.py                  # Flask app
├── Dockerfile              # Docker build instructions
├── docker-compose.yml      # Compose file
├── requirements.txt        # Python dependencies
├── package.json            # Hardhat config
├── hardhat.config.js       # Hardhat configuration
├── .env                    # Your secret config
└── .env.example            # Example environment file
```

---

## 🙌 Acknowledgements

- [Mythril](https://github.com/ConsenSys/mythril)
- [Hardhat](https://hardhat.org)
- [solc-select](https://github.com/crytic/solc-select)
- [Etherscan API](https://docs.etherscan.io)

---

## 📝 License

MIT License © 2025 Fradium Team

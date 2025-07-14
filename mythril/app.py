import warnings
warnings.filterwarnings("ignore", message="pkg_resources is deprecated as an API")

import os
import json
import re
import requests
import subprocess
import shutil
from packaging import version as v
from flask import Flask, request, jsonify

app = Flask(__name__)
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY")
ETHERSCAN_URL = "https://api.etherscan.io/api"
CONTRACT_DIR = "./contracts"
FLATTENED_FILE = "./flattened.sol"

if not ETHERSCAN_API_KEY:
    raise RuntimeError("ETHERSCAN_API_KEY not set. Check your .env file.")

def is_valid_eth_address(address):
    return isinstance(address, str) and re.fullmatch(r"0x[a-fA-F0-9]{40}", address) is not None

def fetch_contract_files(address):
    params = {
        "module": "contract",
        "action": "getsourcecode",
        "address": address,
        "apikey": ETHERSCAN_API_KEY
    }
    res = requests.get(ETHERSCAN_URL, params=params).json()

    # Check error dari Etherscan
    if "result" not in res or not res["result"]:
        raise Exception("Failed to fetch contract from Etherscan.")
    
    result = res["result"][0]

    if not result or result.get("SourceCode") in ("", None):
        raise Exception("No contract source code found for this address.")

    source_code = result["SourceCode"]
    contract_name = result.get("ContractName") or "Contract"

    if os.path.exists(CONTRACT_DIR):
        shutil.rmtree(CONTRACT_DIR)
    os.makedirs(CONTRACT_DIR, exist_ok=True)

    main_contract_path = None

    # Handle multi-file vs single-file
    if source_code.strip().startswith("{{") or source_code.strip().startswith("{"):
        try:
            json_data = json.loads(source_code.strip()[1:-1] if source_code.strip().startswith("{{") else source_code)
            sources = json_data.get("sources", {})
            if not sources:
                raise Exception("Multi-file contract structure found, but no sources detected.")

            for filename, filedata in sources.items():
                full_path = os.path.join(CONTRACT_DIR, filename)
                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                with open(full_path, "w") as f:
                    f.write(filedata["content"])

                if filename.lower().endswith(f"{contract_name.lower()}.sol"):
                    main_contract_path = full_path

            if not main_contract_path:
                main_contract_path = os.path.join(CONTRACT_DIR, list(sources.keys())[0])
            return main_contract_path
        except Exception as e:
            raise Exception(f"Error parsing multi-file source code: {str(e)}")
    else:
        filepath = os.path.join(CONTRACT_DIR, f"{contract_name}.sol")
        with open(filepath, "w") as f:
            f.write(source_code)
        return filepath

def flatten_contract(filepath):
    result = subprocess.run(["npx", "hardhat", "flatten", filepath], capture_output=True, text=True, cwd=".")
    if result.returncode != 0:
        raise Exception(f"Flatten error: {result.stderr}")
    with open(FLATTENED_FILE, "w") as f:
        f.write(result.stdout)
    return result.stdout  # return content too

def extract_solidity_version(code):
    # cari semua pragma
    matches = re.findall(r"pragma solidity\s+[\^>=]*\s*(\d+\.\d+\.\d+);", code)
    if not matches:
        return None

    # ambil versi tertinggi
    versions = sorted(matches, key=lambda s: v.parse(s), reverse=True)
    return versions[0]

def switch_solc_version(version):
    subprocess.run(["solc-select", "install", version], capture_output=True)
    subprocess.run(["solc-select", "use", version], capture_output=True)
    result = subprocess.run(["solc", "--version"], capture_output=True, text=True)
    print("[DEBUG] Active solc version:", result.stdout)

def analyze_with_mythril(solc_version=None):
    env = os.environ.copy()
    env["PYTHONWARNINGS"] = "ignore"

    mythril_cmd = ["myth", "analyze", FLATTENED_FILE, "-o", "json"]
    if solc_version:
        mythril_cmd += ["--solv", solc_version]

    result = subprocess.run(
        mythril_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    combined_output = result.stdout + "\n" + result.stderr

    # Bersihkan warning `pkg_resources`
    clean_output = "\n".join([
        line for line in combined_output.splitlines()
        if "pkg_resources is deprecated" not in line
    ])

    try:
        data = json.loads(clean_output)
    except Exception:
        raise Exception(f"Mythril error (invalid JSON): {clean_output}")

    if not data.get("success"):
        raise Exception(f"Mythril error: {clean_output}")

    return data

def format_report(data):
    if not data.get("success"):
        return {
            "summary": {
                "total_issues": 0,
                "high": 0,
                "medium": 0,
                "low": 0,
                "info": 0
            },
            "issues": [],
            "status": "error",
            "message": "Mythril analysis failed."
        }

    issues = data.get("issues", [])
    severity_count = {"High": 0, "Medium": 0, "Low": 0, "Informational": 0}

    formatted_issues = []
    for issue in issues:
        severity = issue.get("severity", "Unknown")
        if severity in severity_count:
            severity_count[severity] += 1

        formatted_issues.append({
            "title": issue.get("title"),
            "description": issue.get("description"),
            "contract": issue.get("contract"),
            "function": issue.get("function"),
            "severity": severity,
            "swc_id": issue.get("swc-id"),
            "lineno": issue.get("lineno"),
            "code": issue.get("code")
        })

    return {
        "summary": {
            "total_issues": len(issues),
            "high": severity_count["High"],
            "medium": severity_count["Medium"],
            "low": severity_count["Low"],
            "info": severity_count["Informational"]
        },
        "issues": formatted_issues,
        "status": "ok"
    }

def fix_import_paths(file_path):
    with open(file_path, "r") as f:
        code = f.read()

    # Ganti semua import palsu @openzeppelin/contracts-v4.4 jadi versi normal
    code = re.sub(
        r'@openzeppelin/contracts-v4\.4',
        '@openzeppelin/contracts',
        code
    )

    with open(file_path, "w") as f:
        f.write(code)

@app.route("/", methods=["GET"])
def check():
    return jsonify({"message": "ITS WORK!"})

@app.route("/analyze", methods=["POST"])
def analyze():
    address = request.json.get("address")
    if not address:
        return jsonify({"error": "Missing address"}), 400

    if not is_valid_eth_address(address):
        return jsonify({"error": "Invalid Ethereum address format."}), 400
        
    try:
        contract_path = fetch_contract_files(address)
        fix_import_paths(contract_path)
        flattened_code = flatten_contract(contract_path)

        version = extract_solidity_version(flattened_code)
        if not version:
            raise Exception("Solidity version pragma not found.")

        print("[DEBUG] pragma version:", version)  

        switch_solc_version(version)
        raw_report = analyze_with_mythril(version)
        report = format_report(raw_report)

        return jsonify({"report": report})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Cleanup folder dan file flatten
        if os.path.exists(FLATTENED_FILE):
            os.remove(FLATTENED_FILE)
        if os.path.exists(CONTRACT_DIR):
            shutil.rmtree(CONTRACT_DIR)

if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)

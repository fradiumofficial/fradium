from dotenv import load_dotenv
load_dotenv()

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

def install_sol_merger():
    """Install sol-merger locally if not exists"""
    try:
        result = subprocess.run(["npx", "sol-merger", "--version"], capture_output=True, text=True, cwd=".")
        if result.returncode == 0:
            return True
    except:
        pass
    
    try:
        print("[DEBUG] Installing sol-merger...")
        result = subprocess.run(["npm", "install", "sol-merger"], capture_output=True, text=True, cwd=".")
        return result.returncode == 0
    except:
        return False

def flatten_with_sol_merger(filepath):
    """Try flattening with sol-merger which handles cyclic dependencies better"""
    try:
        result = subprocess.run(
            ["npx", "sol-merger", filepath, "--export-plugin", "Flattened"], 
            capture_output=True, 
            text=True, 
            cwd="."
        )
        
        if result.returncode == 0 and result.stdout.strip():
            with open(FLATTENED_FILE, "w") as f:
                f.write(result.stdout)
            return result.stdout
        else:
            raise Exception(f"sol-merger error: {result.stderr}")
    except Exception as e:
        raise Exception(f"sol-merger failed: {str(e)}")

def analyze_without_flattening(main_contract_path):
    """Analyze contract directly without flattening to avoid cyclic dependency issues"""
    env = os.environ.copy()
    env["PYTHONWARNINGS"] = "ignore"

    # Try analyzing the main contract file directly
    mythril_cmd = ["myth", "analyze", main_contract_path, "-o", "json", "-t", "5", "--execution-timeout", "3"]
    print(mythril_cmd)
    
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
        return data
    except Exception:
        raise Exception(f"Mythril direct analysis error: {clean_output}")

def flatten_contract(filepath):
    """Enhanced flattening with multiple fallback strategies"""
    
    # Strategy 1: Try hardhat flatten first
    result = subprocess.run(["npx", "hardhat", "flatten", filepath], capture_output=True, text=True, cwd=".")
    
    if result.returncode == 0:
        with open(FLATTENED_FILE, "w") as f:
            f.write(result.stdout)
        return result.stdout
    
    # Check specific error types
    error_msg = result.stderr.lower()
    
    # Strategy 2: Handle missing dependencies
    if "is not installed" in error_msg and "try installing it using npm" in error_msg:
        missing_deps = parse_missing_dependencies(result.stderr)
        
        if missing_deps:
            print(f"[DEBUG] Found missing dependencies: {missing_deps}")
            
            # Try to install missing dependencies
            all_installed = True
            for dep in missing_deps:
                if not install_missing_dependency(dep):
                    all_installed = False
                    break
            
            if all_installed:
                # Try flattening again after installing dependencies
                print("[DEBUG] Retrying flatten after installing dependencies...")
                retry_result = subprocess.run(
                    ["npx", "hardhat", "flatten", filepath], 
                    capture_output=True, 
                    text=True, 
                    cwd="."
                )
                if retry_result.returncode == 0:
                    with open(FLATTENED_FILE, "w") as f:
                        f.write(retry_result.stdout)
                    return retry_result.stdout
    
    # Strategy 3: Handle cyclic dependencies with sol-merger
    if "cyclic dependencies" in error_msg or "hh603" in error_msg:
        print("[DEBUG] Detected cyclic dependencies, trying sol-merger...")
        
        if install_sol_merger():
            try:
                return flatten_with_sol_merger(filepath)
            except Exception as sol_merger_error:
                print(f"[DEBUG] sol-merger failed: {sol_merger_error}")
                # Continue to Strategy 4
        
        # Strategy 4: Analyze without flattening
        print("[DEBUG] Trying direct analysis without flattening...")
        raise Exception("SKIP_FLATTENING")  # Signal to use direct analysis
    
    # If all strategies fail, raise the original error
    raise Exception(f"Flatten error: {result.stderr}")

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

    mythril_cmd = ["myth", "analyze", FLATTENED_FILE, "-o", "json", "-t", "10", "--execution-timeout", "3"]
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

def install_missing_dependency(package_name):
    """Install missing npm package for contract analysis"""
    try:
        print(f"[DEBUG] Installing missing package: {package_name}")
        result = subprocess.run(
            ["npm", "install", package_name], 
            capture_output=True, 
            text=True, 
            cwd="."
        )
        if result.returncode == 0:
            print(f"[DEBUG] Successfully installed {package_name}")
            return True
        else:
            print(f"[DEBUG] Failed to install {package_name}: {result.stderr}")
            return False
    except Exception as e:
        print(f"[DEBUG] Error installing {package_name}: {str(e)}")
        return False

def parse_missing_dependencies(error_output):
    """Extract missing package names from Hardhat error"""
    import_pattern = r"The library (@[\w\-\/]+)"
    matches = re.findall(import_pattern, error_output)
    return list(set(matches))  # remove duplicates

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
        
        try:
            flattened_code = flatten_contract(contract_path)
            version = extract_solidity_version(flattened_code)
            
            if not version:
                raise Exception("Solidity version pragma not found.")

            print("[DEBUG] pragma version:", version)  
            switch_solc_version(version)
            print("[DEBUG] Analyzing with Mythril...")
            raw_report = analyze_with_mythril(version)
            
        except Exception as flatten_error:
            if "SKIP_FLATTENING" in str(flatten_error):
                print("[DEBUG] Skipping flattening due to cyclic dependencies...")
                print("[DEBUG] Analyzing contract directly...")
                
                # Read the main contract to get version
                with open(contract_path, "r") as f:
                    contract_code = f.read()
                
                version = extract_solidity_version(contract_code)
                if version:
                    print(f"[DEBUG] Found version in main contract: {version}")
                    switch_solc_version(version)
                
                # Use direct analysis without flattening
                raw_report = analyze_without_flattening(contract_path)
            else:
                # Re-raise other flattening errors
                raise flatten_error

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
    app.run(debug=False, host="0.0.0.0", port=5001)

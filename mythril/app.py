import json
import subprocess
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

INFURA_ID = os.getenv("INFURA_ID")

@app.route('/analyze', methods=['POST'])
def analyze_contract():
    data = request.get_json()
    address = data.get("address")

    if not address:
        return jsonify({
            "success": False,
            "message": "Contract address is required",
            "issues": None
        }), 400

    try:
        command = [
            "myth", "analyze",
            "-a", address,
            "-o", "json",
            "-t", "3",
            "--execution-timeout", "20"
        ]

        env = os.environ.copy()
        env["INFURA_ID"] = INFURA_ID

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )

        # Ambil hanya baris JSON dari stdout
        lines = result.stdout.splitlines()
        json_str = ""
        for line in lines:
            if line.strip().startswith("{") or line.strip().startswith("["):
                json_str = line
                break

        if not json_str:
            return jsonify({
                "success": False,
                "message": "No valid JSON output from Mythril",
                "issues": None
            }), 500

        parsed_result = json.loads(json_str)

        # 🔍 Ringkas issue jika ada
        issues = []
        for issue in parsed_result.get("issues", []):
            issues.append({
                "swc-id": issue.get("swc-id"),
                "title": issue.get("title"),
                "description": issue.get("description"),
                "severity": issue.get("severity"),
                "function": issue.get("function"),
                "contract": issue.get("contract"),
                "swc-url": f"https://swcregistry.io/docs/SWC-{issue.get('swc-id')}"
            })

        return jsonify({
            "success": True,
            "message": "No issues found" if len(issues) == 0 else "Analysis complete",
            "issues": issues
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "issues": None
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001)

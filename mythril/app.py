import json
import subprocess
import os
from flask import Flask, request, jsonify

app = Flask(__name__)
INFURA_ID = os.getenv("INFURA_ID")

@app.route('/analyze', methods=['POST'])
def analyze_contract():
    data = request.get_json()
    address = data.get("address")

    if not address:
        return jsonify({"error": "Contract address is required"}), 400

    try:
        command = ["myth", "analyze", "-a", address, "-o", "json", "-t", "10"]
        env = os.environ.copy()
        env["INFURA_ID"] = INFURA_ID

        result = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=env
        )

        # Filter hanya JSON di output stdout
        lines = result.stdout.splitlines()
        json_str = ""
        for line in lines:
            if line.strip().startswith("{") or line.strip().startswith("["):
                json_str = line
                break

        if not json_str:
            return jsonify({"error": "No valid JSON output from Mythril", "raw_output": result.stdout}), 500

        parsed_result = json.loads(json_str)
        return jsonify(parsed_result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5000)

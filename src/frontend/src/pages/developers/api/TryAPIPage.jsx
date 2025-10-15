import React, { useState } from "react";
import { motion } from "framer-motion";
import { Code, Copy, Play, AlertCircle, CheckCircle, ExternalLink, Terminal, Globe } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";

const TryAPIPage = () => {
  const [testAddress, setTestAddress] = useState("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  const [canisterId, setCanisterId] = useState("your-canister-id.ic0.app");
  const [customBody, setCustomBody] = useState("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const testAPI = async () => {
    // setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetch(`http://u6s2n-gx777-77774-qaaba-cai.localhost:4943/analyze-address`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          address: "gguu5-p553t-bgosy-nmprz-lwxz6-betjf-q77g3-t57ri-5o53q-nkuho-7qe",
        },
      });

      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.log("Failed to fetch:", error);
    }
    return;
  };

  // Determine the correct URL for examples
  const getExampleUrl = () => {
    if (canisterId.includes("localhost") || canisterId.includes("127.0.0.1")) {
      return `http://${canisterId}/http_request_update`;
    } else if (canisterId.includes(".ic0.app")) {
      return `https://${canisterId}/http_request_update`;
    } else {
      return `http://localhost:4943/http_request_update`;
    }
  };

  const exampleUrl = getExampleUrl();

  const curlCommand = `curl -X POST "${exampleUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "method": "POST",
    "url": "/analyze-address",
    "headers": [
      ["Content-Type", "application/json"],
      ["Host", "${canisterId}.localhost"]
    ],
    "body": "${customBody}",
    "certificate_version": null
  }'`;

  const javascriptExample = `const httpRequest = {
  method: "POST",
  url: "/analyze-address",
  headers: [
    ["Content-Type", "application/json"],
    ["Host", "${canisterId}.localhost"]
  ],
  body: "${customBody}",
  certificate_version: null
};

const response = await fetch('${exampleUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(httpRequest),
});

const responseBlob = await response.blob();
const responseText = await responseBlob.text();
const data = JSON.parse(responseText);
console.log(data);`;

  const pythonExample = `import requests
import json

# Create HTTP request structure
http_request = {
    "method": "POST",
    "url": "/analyze-address",
    "headers": [
        ["Content-Type", "application/json"],
        ["Host", "${canisterId}.localhost"]
    ],
    "body": "${customBody}",
    "certificate_version": None
}

# Make request to http_request_update endpoint
response = requests.post(
    "${exampleUrl}",
    headers={"Content-Type": "application/json"},
    json=http_request
)

# Parse response
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code} - {response.text}")`;

  const [activeExample, setActiveExample] = useState("curl");

  return (
    <div className="min-h-screen bg-white">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Code className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Documentations</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Test and explore the Fradium API endpoints. Try the analyze-address endpoint to analyze Bitcoin addresses.</p>
        </motion.div>

        {/* API Documentation */}
        <motion.div variants={itemVariants} className="bg-slate-50 rounded-xl p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">API Documentation</h2>
          </div>

          {/* Endpoint Info */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">POST</span>
                <code className="text-lg font-mono text-slate-900">/http_request_update</code>
              </div>
              <p className="text-slate-600 mb-4">Analyzes a Bitcoin address using the HTTP request update endpoint. This endpoint accepts a structured HTTP request object.</p>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                  <div className="bg-slate-100 rounded p-3 font-mono text-sm space-y-2 text-black">
                    <div>{"{"}</div>
                    <div className="ml-4">"method": "POST",</div>
                    <div className="ml-4">"url": "/analyze-address",</div>
                    <div className="ml-4">"headers": [</div>
                    <div className="ml-8">["Content-Type", "application/json"],</div>
                    <div className="ml-8">["Host", "canister-id.localhost"]</div>
                    <div className="ml-4">],</div>
                    <div className="ml-4">"body": "Bitcoin address",</div>
                    <div className="ml-4">"certificate_version": null</div>
                    <div>{"}"}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Response Format:</h4>
                  <div className="bg-slate-100 rounded p-3 font-mono text-sm space-y-2 text-black">
                    <div>{"{"}</div>
                    <div className="ml-4">"success": true,</div>
                    <div className="ml-4">"data": {"{"}</div>
                    <div className="ml-8">"address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",</div>
                    <div className="ml-8">"risk_score": 75,</div>
                    <div className="ml-8">"analysis": "High risk address detected",</div>
                    <div className="ml-8">"timestamp": 1703123456789</div>
                    <div className="ml-4">{"}"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interactive Test */}
        <motion.div variants={itemVariants} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-green-600" />
            <h2 className="text-2xl font-bold text-slate-900">Interactive Test</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Canister ID:</label>
              <input type="text" value={canisterId} onChange={(e) => setCanisterId(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-black" placeholder="u6s2n-gx777-77774-qaaba-cai" />
              <p className="text-xs text-slate-500 mt-1">
                For localhost: use just the canister ID (e.g., u6s2n-gx777-77774-qaaba-cai)
                <br />
                For production: use full domain (e.g., abc123.ic0.app)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Request Body:</label>
              <textarea value={customBody} onChange={(e) => setCustomBody(e.target.value)} className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm h-20 resize-none text-black" placeholder="Enter Bitcoin address or custom body..." />
              <p className="text-xs text-slate-500 mt-1">Enter the Bitcoin address or custom body content to send</p>
            </div>

            <LightButton onClick={testAPI} disabled={isLoading || !canisterId || !customBody} leftIcon={isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play className="w-4 h-4" />} className="w-full">
              {isLoading ? "Analyzing..." : "Test API"}
            </LightButton>

            {/* Response Display */}
            {response && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-slate-900">Response:</h3>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <pre className="text-sm text-slate-800 whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
                </div>
              </div>
            )}

            {error && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <h3 className="font-semibold text-slate-900">Error:</h3>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                  {error.includes("CanisterIdNotFound") && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">
                        <strong>Troubleshooting:</strong> Make sure your canister is deployed and running. For localhost development, ensure dfx is running with <code>dfx start</code> and your canister is deployed with <code>dfx deploy</code>.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Code Examples */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3">
            <Terminal className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Code Examples</h2>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
            {[
              { id: "curl", label: "cURL" },
              { id: "javascript", label: "JavaScript" },
              { id: "python", label: "Python" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveExample(tab.id)} className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeExample === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Code Display */}
          <div className="bg-slate-900 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white capitalize">{activeExample}</h3>
              <LightButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const examples = { curl: curlCommand, javascript: javascriptExample, python: pythonExample };
                  copyToClipboard(examples[activeExample], activeExample);
                }}
                leftIcon={<Copy className="w-4 h-4" />}
                className="text-slate-300 hover:text-white">
                {copiedText === activeExample ? "Copied!" : "Copy"}
              </LightButton>
            </div>
            <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
              {activeExample === "curl" && curlCommand}
              {activeExample === "javascript" && javascriptExample}
              {activeExample === "python" && pythonExample}
            </pre>
          </div>
        </motion.div>

        {/* Additional Info */}
        <motion.div variants={itemVariants} className="bg-blue-50 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-slate-900">Important Notes</h3>
          </div>
          <ul className="space-y-2 text-slate-700">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                Enter your actual canister ID in the <strong>Canister ID</strong> field above
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                Customize the <strong>Request Body</strong> with your Bitcoin address or any custom content
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>
                Use <code className="bg-blue-100 px-1 rounded">/http_request_update</code> endpoint for HTTP requests
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>The request body must be a structured HTTP request object</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Response is returned as a blob that needs to be decoded</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Code examples will update automatically with your inputs</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Rate limiting may apply for production usage</span>
            </li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TryAPIPage;

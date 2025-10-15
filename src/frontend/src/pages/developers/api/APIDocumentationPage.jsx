import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Code, Copy, Terminal, Globe } from "lucide-react";
import LightButton from "@/core/components/ui/LightButton.jsx";

const APIDocumentationPage = () => {
  const [canisterId, setCanisterId] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [copiedText, setCopiedText] = useState(null);

  // Get canister ID and set base URL dynamically
  useEffect(() => {
    const getCanisterInfo = () => {
      // Get canister ID from environment or use default
      const canisterIdFromEnv = import.meta.env.VITE_CANISTER_ID_BACKEND || "u6s2n-gx777-77774-qaaba-cai";
      setCanisterId(canisterIdFromEnv);

      // Determine base URL based on environment
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        setBaseUrl(`http://${canisterIdFromEnv}.localhost:4943`);
      } else {
        setBaseUrl(`https://${canisterIdFromEnv}.ic0.app`);
      }
    };

    getCanisterInfo();
  }, []);

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

  // Code examples for the new API structure
  const curlCommand = `curl -X POST "${baseUrl}/analyze-address" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -d '{
    "address": "gguu5-p553t-bgosy-nmprz-lwxz6-betjf-q77g3-t57ri-5o53q-nkuho-7qe"
  }'`;

  const javascriptExample = `const response = await fetch('${baseUrl}/analyze-address', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify({
    address: "gguu5-p553t-bgosy-nmprz-lwxz6-betjf-q77g3-t57ri-5o53q-nkuho-7qe"
  })
});

const data = await response.json();
console.log(data);`;

  const pythonExample = `import requests
import json

response = requests.post(
    '${baseUrl}/analyze-address',
    headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_TOKEN'
    },
    json={
        'address': 'gguu5-p553t-bgosy-nmprz-lwxz6-betjf-q77g3-t57ri-5o53q-nkuho-7qe'
    }
)

data = response.json()
print(data)`;

  const [activeTab, setActiveTab] = useState("request");
  const [activeExample, setActiveExample] = useState("curl");

  return (
    <div className="min-h-screen bg-transparent">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full px-0 space-y-8">
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-4 px-6">
          <h1 className="text-3xl font-bold text-slate-900">API Documentation</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">Fradium API endpoints for cryptocurrency address analysis. Use your API token to authenticate requests.</p>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants} className="space-y-6">
          {/* API Endpoint Info */}
          <div className="space-y-6 px-6">
            {/* Base URL Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">Base URL</h2>
              <div className="p-4 border border-blue-200 rounded-lg bg-blue-50/30">
                <code className="text-lg font-mono text-slate-900">{baseUrl || "Loading..."}</code>
                <p className="text-sm text-slate-600 mt-2">{window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" ? "Local development URL" : "Production URL"}</p>
              </div>
            </div>

            {/* Analyze Address Endpoint */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">POST</span>
                <code className="text-lg font-mono text-slate-900">/analyze-address</code>
              </div>

              <p className="text-slate-900">Analyzes a cryptocurrency address for safety and risk assessment using community consensus.</p>

              {/* Tab Navigation */}
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                {[
                  { id: "request", label: "Request" },
                  { id: "examples", label: "Code Examples" },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 px-4 py-2 text-xs font-medium rounded-md transition-colors ${activeTab === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "request" && (
            <div className="space-y-6 px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Request Body:</h4>
                  <div className="bg-slate-100 rounded p-3 font-mono text-sm space-y-2 text-black">
                    <div>{"{"}</div>
                    <div className="ml-4">"address": "gguu5-p553t-bgosy-nmprz-lwxz6-betjf-q77g3-t57ri-5o53q-nkuho-7qe"</div>
                    <div>{"}"}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Response:</h4>
                  <div className="bg-slate-100 rounded p-3 font-mono text-sm space-y-2 text-black">
                    <div>{"{"}</div>
                    <div className="ml-4">"success": true,</div>
                    <div className="ml-4">"data": {"{"}</div>
                    <div className="ml-8">"is_safe": true</div>
                    <div className="ml-4">{"}"}</div>
                    <div>{"}"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "examples" && (
            <div className="space-y-6 px-6">
              <h2 className="text-2xl font-bold text-slate-900">Code Examples</h2>

              {/* Language Tab Navigation */}
              <div className="flex space-x-1 bg-slate-100 rounded-lg p-1">
                {[
                  { id: "curl", label: "cURL" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "python", label: "Python" },
                ].map((tab) => (
                  <button key={tab.id} onClick={() => setActiveExample(tab.id)} className={`flex-1 px-4 py-2 text-xs font-medium rounded-md transition-colors ${activeExample === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}>
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
                    className="text-white hover:text-white">
                    {copiedText === activeExample ? "Copied!" : "Copy"}
                  </LightButton>
                </div>
                <pre className="text-sm text-slate-300 whitespace-pre-wrap overflow-x-auto">
                  {activeExample === "curl" && curlCommand}
                  {activeExample === "javascript" && javascriptExample}
                  {activeExample === "python" && pythonExample}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default APIDocumentationPage;

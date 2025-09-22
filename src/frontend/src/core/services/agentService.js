import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { detectAddressNetwork, getBalance as fetchTokenBalance, getFeeInfo, sendTokenToBackend, formatAmount } from "@/core/lib/tokenUtils.js";
import { jsonStringify } from "@/core/lib/canisterUtils.js";
import { AIAnalyzeService } from "@/core/services/ai/aiAnalyze.js";

// Disable LangChain verbose logging
if (typeof window !== "undefined") {
  // Browser environment
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;

  console.log = (...args) => {
    const message = args.join(" ");
    if (!message.includes("[langchain]") && !message.includes("LangChain") && !message.includes("AgentExecutor")) {
      originalConsoleLog.apply(console, args);
    }
  };

  console.warn = (...args) => {
    const message = args.join(" ");
    if (!message.includes("[langchain]") && !message.includes("LangChain") && !message.includes("AgentExecutor")) {
      originalConsoleWarn.apply(console, args);
    }
  };

  console.error = (...args) => {
    const message = args.join(" ");
    if (!message.includes("[langchain]") && !message.includes("LangChain") && !message.includes("AgentExecutor")) {
      originalConsoleError.apply(console, args);
    }
  };
}

/**
 * Agent Service for Fradium AI Assistant
 * Using LangChain with Gemini AI for tool calling
 */
export class AgentService {
  constructor() {
    this.model = null;
    this.agentExecutor = null;
    this.isInitialized = false;
    this.walletContext = null; // Store wallet context reference
    this.authContext = null; // Store auth context (identity)
    this.pendingTransfer = null; // Ephemeral transfer state for interactive flow
    this.pendingBalanceRequest = false; // Awaiting token for balance check
    this.pendingAddressRequest = false; // Awaiting token for address query
  }

  /**
   * Set wallet context for accessing user's addresses
   */
  setWalletContext(walletContext) {
    this.walletContext = walletContext;
  }

  /**
   * Set auth context for accessing user's principal (from AuthProvider)
   */
  setAuthContext(authContext) {
    this.authContext = authContext;
  }

  /**
   * Initialize agent with Gemini AI
   */
  async initialize() {
    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY not found in environment variables");
      }

      // Initialize Gemini model
      this.model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash-lite",
        apiKey: apiKey,
        temperature: 0.1,
        maxOutputTokens: 2048,
      });

      // Define tools for agent
      const tools = this.createTools();

      // Create prompt template
      const prompt = ChatPromptTemplate.fromMessages([
        ["system", this.getSystemPrompt()],
        ["placeholder", "{chat_history}"],
        ["human", "{input}"],
        ["placeholder", "{agent_scratchpad}"],
      ]);

      // Create agent
      const agent = await createToolCallingAgent({
        llm: this.model,
        tools,
        prompt,
      });

      // Create agent executor
      this.agentExecutor = new AgentExecutor({
        agent,
        tools,
        verbose: true,
        maxIterations: 3,
        earlyStoppingMethod: "generate",
      });

      this.isInitialized = true;
      console.log("Agent Service initialized successfully");
    } catch (error) {
      console.error("Error initializing Agent Service:", error);
      throw error;
    }
  }

  /**
   * Create tools for agent
   */
  createTools() {
    return [
      new DynamicStructuredTool({
        name: "get_my_balance",
        description: "Get token balance for the current user's wallet addresses. Supports any token in tokenConfig (BTC, Bitcoin, ETH, Ethereum, SOL, Solana, ICP, Internet Computer, ckBTC). This tool automatically uses the user's wallet addresses from WalletProvider. Examples: 'check my bitcoin balance', 'get my ETH balance', 'what's my ICP balance'.",
        schema: z.object({
          token: z.string().describe("Token symbol or name (e.g., ETH, Bitcoin, ICP). Required to specify which token balance to check."),
        }),
        func: async ({ token: tokenQuery }) => {
          try {
            if (!this.walletContext) {
              return jsonStringify({
                success: false,
                error: "Wallet context not available",
                message: "Please make sure you are logged in and your wallet is connected.",
              });
            }

            const { addresses, getAddressesLoadingState } = this.walletContext;

            // Check if addresses are still loading
            if (getAddressesLoadingState && getAddressesLoadingState()) {
              return jsonStringify({
                success: false,
                error: "Addresses loading",
                message: "Please wait while your wallet addresses are being loaded...",
              });
            }

            // Determine which address to use based on token
            let targetAddress = "";
            if (tokenQuery) {
              const q = tokenQuery.trim().toLowerCase();
              if (q.includes("bitcoin") || q.includes("btc")) {
                targetAddress = addresses?.bitcoin || "";
              } else if (q.includes("ethereum") || q.includes("eth")) {
                targetAddress = addresses?.ethereum || "";
              } else if (q.includes("solana") || q.includes("sol")) {
                targetAddress = addresses?.solana || "";
              } else if (q.includes("icp") || q.includes("internet computer")) {
                targetAddress = addresses?.icp_principal || "";
              } else if (q.includes("ckbtc")) {
                targetAddress = addresses?.ckbtc || "";
              }
            }

            if (!targetAddress) {
              return jsonStringify({
                success: false,
                error: "No address found",
                message: `No wallet address found for token "${tokenQuery}". Please make sure your wallet addresses are loaded.`,
              });
            }

            // Detect network from address
            const network = detectAddressNetwork(targetAddress);

            // Resolve target token
            let token = null;
            if (tokenQuery && tokenQuery.trim().length > 0) {
              const q = tokenQuery.trim().toLowerCase();
              // exact symbol or full name
              token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === q || t.name.toLowerCase() === q);
              // startsWith / contains on name as fallback
              if (!token) {
                token = TOKENS_CONFIG.find((t) => t.name.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q));
              }
              // alias mapping
              if (!token) {
                const aliasToSymbol = {
                  bitcoin: "BTC",
                  btc: "BTC",
                  "btc testnet": "BTC",
                  ethereum: "ETH",
                  ether: "ETH",
                  eth: "ETH",
                  solana: "SOL",
                  sol: "SOL",
                  icp: "ICP",
                  "internet computer": "ICP",
                  fradium: "FRADIUM",
                  ckbtc: "ckBTC",
                  "ck-btc": "ckBTC",
                  "ck btc": "ckBTC",
                };
                const mapped = aliasToSymbol[q];
                if (mapped) {
                  token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === mapped.toLowerCase());
                }
              }
              if (!token) {
                return jsonStringify({
                  success: false,
                  error: "Unknown token",
                  message: `Token "${tokenQuery}" is not supported. Please use a valid token symbol or name.`,
                });
              }
            } else {
              const supportedTokens = TOKENS_CONFIG.filter((t) => t.chain === network);
              if (supportedTokens.length === 0) {
                return jsonStringify({
                  success: false,
                  error: "Unsupported network",
                  message: `Network ${network} is not supported`,
                });
              }
              token = supportedTokens[0];
            }

            // Principal is required only for ICRC tokens (Internet Computer)
            // Pull principal from AuthProvider if available via authContext
            let principal = null;
            try {
              const idFromAuth = this.authContext?.identity || this.walletContext?.identity;
              if (idFromAuth && typeof idFromAuth.getPrincipal === "function") {
                principal = idFromAuth.getPrincipal();
              }
            } catch (_e) {}
            let balance;
            try {
              console.log("token", token);
              console.log("principal", principal);
              balance = await fetchTokenBalance(token.id, principal, true);
              console.log("balance", balance);
            } catch (e) {
              return jsonStringify({
                success: false,
                address: targetAddress,
                network: network,
                currency: token.symbol,
                tokenName: token.name,
                error: e?.message || "Failed to fetch balance",
                message: `Failed to get ${token.symbol} balance: ${e?.message || "Unknown error"}`,
              });
            }

            return jsonStringify({
              success: true,
              address: targetAddress,
              network: network,
              balance: balance,
              currency: token.symbol,
              tokenName: token.name,
              message: `Your ${token.symbol} balance is ${balance} ${token.symbol}`,
            });
          } catch (error) {
            console.error("Error getting balance:", error);
            return jsonStringify({
              success: false,
              error: error.message,
              message: `Failed to get balance for token ${tokenQuery}`,
            });
          }
        },
      }),
      new DynamicStructuredTool({
        name: "get_balance",
        description: "Get token balance for a specific wallet address. Supports any token in tokenConfig (BTC, Bitcoin, ETH, Ethereum, SOL, Solana, ICP, Internet Computer, ckBTC). Requires an address to be provided. Examples: 'check balance mvE3KG9ShMqP2F42dgj941jUbumnHEekJy', 'get ETH balance 0x123...'.",
        schema: z.object({
          address: z.string().describe("Wallet address to get balance from. Required."),
          token: z.string().optional().describe("Token symbol or name (e.g., ETH, Bitcoin, ICP). Optional - will auto-detect from address if not provided."),
        }),
        func: async ({ address, token: tokenQuery }) => {
          try {
            if (!address) {
              return jsonStringify({
                success: false,
                error: "No address provided",
                message: "Please provide a wallet address to check balance. Use 'get_my_balance' tool if you want to check your own wallet balance.",
              });
            }

            // Detect network from address
            const network = detectAddressNetwork(address);

            // Resolve target token
            let token = null;
            if (tokenQuery && tokenQuery.trim().length > 0) {
              const q = tokenQuery.trim().toLowerCase();
              // exact symbol or full name
              token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === q || t.name.toLowerCase() === q);
              // startsWith / contains on name as fallback
              if (!token) {
                token = TOKENS_CONFIG.find((t) => t.name.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q));
              }
              // alias mapping
              if (!token) {
                const aliasToSymbol = {
                  bitcoin: "BTC",
                  btc: "BTC",
                  "btc testnet": "BTC",
                  ethereum: "ETH",
                  ether: "ETH",
                  eth: "ETH",
                  solana: "SOL",
                  sol: "SOL",
                  icp: "ICP",
                  "internet computer": "ICP",
                  fradium: "FRADIUM",
                  ckbtc: "ckBTC",
                  "ck-btc": "ckBTC",
                  "ck btc": "ckBTC",
                };
                const mapped = aliasToSymbol[q];
                if (mapped) {
                  token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === mapped.toLowerCase());
                }
              }
              if (!token) {
                return jsonStringify({
                  success: false,
                  error: "Unknown token",
                  message: `Token \"${tokenQuery}\" is not supported. Please use a valid token symbol or name.`,
                });
              }
            } else {
              const supportedTokens = TOKENS_CONFIG.filter((t) => t.chain === network);
              if (supportedTokens.length === 0) {
                return jsonStringify({
                  success: false,
                  error: "Unsupported network",
                  message: `Network ${network} is not supported`,
                });
              }
              token = supportedTokens[0];
            }

            // Principal is required only for ICRC tokens (Internet Computer)
            // Pull principal from AuthProvider if available via authContext
            let principal = null;
            try {
              const idFromAuth = this.authContext?.identity || this.walletContext?.identity;
              if (idFromAuth && typeof idFromAuth.getPrincipal === "function") {
                principal = idFromAuth.getPrincipal();
              }
            } catch (_e) {}
            let balance;
            try {
              balance = await fetchTokenBalance(token.id, principal, true);
            } catch (e) {
              return jsonStringify({
                success: false,
                address: targetAddress,
                network: network,
                currency: token.symbol,
                tokenName: token.name,
                error: e?.message || "Failed to fetch balance",
                message: `Failed to get ${token.symbol} balance: ${e?.message || "Unknown error"}`,
              });
            }

            return jsonStringify({
              success: true,
              address: address,
              network: network,
              balance: balance,
              currency: token.symbol,
              tokenName: token.name,
              message: `Balance for ${token.symbol} at ${address} is ${balance} ${token.symbol}`,
            });
          } catch (error) {
            console.error("Error getting balance:", error);
            return jsonStringify({
              success: false,
              error: error.message,
              message: `Failed to get balance for address ${address}`,
            });
          }
        },
      }),
      new DynamicStructuredTool({
        name: "get_my_address",
        description: "Get wallet address for the current user for a specific token/network. Supports Bitcoin, Ethereum, Solana, ICP (principal/account), ckBTC (BTC deposit), and FRADIUM (ICRC) addresses. Examples: 'show my BTC address', 'what's my Ethereum address', 'get my ICP principal', 'show my Fradium address'.",
        schema: z.object({
          token: z.string().describe("Token symbol or name (e.g., BTC, Bitcoin, ETH, Ethereum, SOL, Solana, ICP, Internet Computer, ckBTC). Required to specify which address to show."),
        }),
        func: async ({ token: tokenQuery }) => {
          try {
            if (!this.walletContext) {
              return jsonStringify({
                success: false,
                error: "Wallet context not available",
                message: "Please make sure you are logged in and your wallet is connected.",
              });
            }

            const { addresses, getAddressesLoadingState } = this.walletContext;

            // Check if addresses are still loading
            if (getAddressesLoadingState && getAddressesLoadingState()) {
              return jsonStringify({
                success: false,
                error: "Addresses loading",
                message: "Please wait while your wallet addresses are being loaded...",
              });
            }

            // Determine which address to show based on token
            let targetAddress = "";
            let addressType = "";

            if (tokenQuery) {
              const q = tokenQuery.trim().toLowerCase();
              if (q.includes("bitcoin") || q.includes("btc")) {
                targetAddress = addresses?.bitcoin || "";
                addressType = "Bitcoin";
              } else if (q.includes("ethereum") || q.includes("eth")) {
                targetAddress = addresses?.ethereum || "";
                addressType = "Ethereum";
              } else if (q.includes("solana") || q.includes("sol")) {
                targetAddress = addresses?.solana || "";
                addressType = "Solana";
              } else if (q.includes("icp") || q.includes("internet computer")) {
                targetAddress = addresses?.icp_principal || "";
                addressType = "ICP Principal";
              } else if (q.includes("fradium") || q.includes("fadm") || q.includes("fradi")) {
                // FRADIUM is an ICRC token on ICP, use ICP principal for receive
                targetAddress = addresses?.icp_principal || "";
                addressType = "FRADIUM (ICRC)";
              } else if (q.includes("ckbtc")) {
                targetAddress = addresses?.ckbtc || "";
                addressType = "ckBTC Bitcoin";
              }
            }

            if (!targetAddress) {
              return jsonStringify({
                success: false,
                error: "No address found",
                message: `No wallet address found for token "${tokenQuery}". Please make sure your wallet addresses are loaded and you have addresses for this token.`,
              });
            }

            // Find token info for better response
            let token = null;
            if (tokenQuery && tokenQuery.trim().length > 0) {
              const q = tokenQuery.trim().toLowerCase();
              // exact symbol or full name
              token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === q || t.name.toLowerCase() === q);
              // startsWith / contains on name as fallback
              if (!token) {
                token = TOKENS_CONFIG.find((t) => t.name.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q));
              }
              // alias mapping
              if (!token) {
                const aliasToSymbol = {
                  bitcoin: "BTC",
                  btc: "BTC",
                  "btc testnet": "BTC",
                  ethereum: "ETH",
                  ether: "ETH",
                  eth: "ETH",
                  solana: "SOL",
                  sol: "SOL",
                  icp: "ICP",
                  "internet computer": "ICP",
                  ckbtc: "ckBTC",
                  "ck-btc": "ckBTC",
                  "ck btc": "ckBTC",
                };
                const mapped = aliasToSymbol[q];
                if (mapped) {
                  token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === mapped.toLowerCase());
                }
              }
            }

            const tokenName = token ? token.name : addressType;
            const tokenSymbol = token ? token.symbol : tokenQuery;

            return jsonStringify({
              success: true,
              address: targetAddress,
              addressType: addressType,
              tokenName: tokenName,
              tokenSymbol: tokenSymbol,
              message: `Your ${tokenName} (${tokenSymbol}) address is: ${targetAddress}`,
            });
          } catch (error) {
            console.error("Error getting address:", error);
            return jsonStringify({
              success: false,
              error: error.message,
              message: `Failed to get address for token ${tokenQuery}`,
            });
          }
        },
      }),
      new DynamicStructuredTool({
        name: "analyze_address",
        description: "Analyze a wallet address for security risks and suspicious activity. Supports Bitcoin, Ethereum, Solana, and Internet Computer addresses. Uses AI analysis and community voting to determine if an address is safe or potentially dangerous. Examples: 'analyze address mvE3KG9ShMqP2F42dgj941jUbumnHEekJy', 'check if 0x123... is safe', 'analyze this Bitcoin address'.",
        schema: z.object({
          address: z.string().describe("Wallet address to analyze for security risks. Required."),
        }),
        func: async ({ address }) => {
          try {
            if (!address || typeof address !== "string" || address.trim().length === 0) {
              return jsonStringify({
                success: false,
                error: "Invalid address",
                message: "Please provide a valid wallet address to analyze.",
              });
            }

            const trimmedAddress = address.trim();

            // Detect network to validate support
            const network = detectAddressNetwork(trimmedAddress);
            if (!AIAnalyzeService.isNetworkSupported(network)) {
              return jsonStringify({
                success: false,
                error: "Unsupported network",
                message: `Network ${network} is not supported for analysis. Supported networks: Bitcoin, Ethereum, Solana, Internet Computer.`,
              });
            }

            // Perform analysis using AIAnalyzeService
            const analysisResult = await AIAnalyzeService.analyzeAddress(trimmedAddress);

            if (!analysisResult.success) {
              return jsonStringify({
                success: false,
                error: "Analysis failed",
                message: "Failed to analyze the address. Please try again later.",
              });
            }

            const result = analysisResult.result;
            const isSafe = result.isSafe;
            const riskLevel = result.riskLevel;
            const confidence = result.confidence;
            const description = result.description;

            // Format security checks for better readability
            const securityChecks = result.securityChecks || [];
            const securityChecksText = securityChecks.length > 0 ? securityChecks.map((check) => `• ${check}`).join("\n") : "No specific security checks available";

            // Format stats
            const stats = result.stats || {};
            const statsText = [`Transactions analyzed: ${stats.transactions || "N/A"}`, `Risk score: ${stats.riskScore || "N/A"}`, `Confidence: ${confidence}%`, `Analysis source: ${analysisResult.analysisSource || "Unknown"}`].join("\n");

            const statusEmoji = isSafe ? "✅" : "⚠️";
            const statusText = isSafe ? "SAFE" : "POTENTIALLY UNSAFE";

            return jsonStringify({
              success: true,
              address: trimmedAddress,
              network: analysisResult.network,
              isSafe: isSafe,
              riskLevel: riskLevel,
              confidence: confidence,
              status: statusText,
              statusEmoji: statusEmoji,
              description: description,
              securityChecks: securityChecksText,
              stats: statsText,
              analysisSource: analysisResult.analysisSource,
              finalStatus: analysisResult.finalStatus,
              message: `${statusEmoji} Address Analysis Result:\n\n${statusText} (${riskLevel} Risk)\n\n${description}\n\nSecurity Checks:\n${securityChecksText}\n\nStatistics:\n${statsText}`,
            });
          } catch (error) {
            console.error("Error analyzing address:", error);
            return jsonStringify({
              success: false,
              error: error.message,
              message: `Failed to analyze address ${address}: ${error.message}`,
            });
          }
        },
      }),
      new DynamicStructuredTool({
        name: "send_token",
        description: "Interactive token transfer flow. Step 1: analyze destination address. Step 2: present confirmation with fee and analysis summary; user must type 'confirm send' to proceed. Step 3: if exactly 'confirm send' and state is pending, execute transfer; otherwise reset state. All natural language responses must be generated by the model; the tool only returns JSON state updates.",
        schema: z.object({
          step: z.enum(["init", "confirm", "execute"]).describe("Flow step: init -> confirm -> execute"),
          token: z.string().describe("Token symbol or name (e.g., ETH, Bitcoin, ICP)."),
          destination: z.string().optional().describe("Destination address (required for init)"),
          amount: z.number().optional().describe("Amount to send (required for init)"),
          userInput: z.string().optional().describe("User free text to check for 'confirm send' during confirm/execute steps"),
        }),
        func: async ({ step, token: tokenQuery, destination, amount, userInput }) => {
          try {
            // Pull principal for ICRC transfers
            let principal = null;
            try {
              const idFromAuth = this.authContext?.identity || this.walletContext?.identity;
              if (idFromAuth && typeof idFromAuth.getPrincipal === "function") {
                principal = idFromAuth.getPrincipal();
              }
            } catch (_e) {}

            if (step === "init") {
              // Resolve token details for init
              const q = tokenQuery?.trim().toLowerCase() || "";
              let token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === q || t.name.toLowerCase() === q);
              if (!token) {
                token = TOKENS_CONFIG.find((t) => t.name.toLowerCase().startsWith(q) || t.name.toLowerCase().includes(q));
              }
              if (!token) {
                return jsonStringify({ success: false, error: "Unknown token", message: `Unsupported token: ${tokenQuery}` });
              }

              if (!destination || typeof amount !== "number" || amount <= 0) {
                return jsonStringify({ success: false, error: "Invalid parameters", message: "Destination and positive amount are required." });
              }

              const detected = detectAddressNetwork(destination.trim());
              const supported = token.chain === detected || detected !== "Unknown";

              // Run AI analysis
              const analysis = await AIAnalyzeService.analyzeAddress(destination.trim());

              // Build fee info
              const feeInfo = getFeeInfo(token);

              // Persist pending transfer state so confirm/execute can reuse
              this.pendingTransfer = {
                tokenId: token.id,
                tokenSymbol: token.symbol,
                tokenName: token.name,
                chain: token.chain,
                destination: destination.trim(),
                amount,
                detectedNetwork: detected,
                feeInfo,
              };

              // Build confirmation payload (LLM must render messaging)
              return jsonStringify({
                success: true,
                state: "awaiting_confirmation",
                token: { id: token.id, symbol: token.symbol, name: token.name, chain: token.chain },
                destination: destination.trim(),
                amount,
                detectedNetwork: detected,
                isSupported: supported,
                feeInfo,
                analysis,
                instructions: "Ask the model to render a confirmation bubble. The user must type exactly 'confirm send' to proceed, otherwise reset.",
              });
            }

            if (step === "confirm") {
              const accepted = typeof userInput === "string" && userInput.trim().toLowerCase() === "confirm send";
              return jsonStringify({ success: true, state: accepted ? "ready_to_execute" : "reset", accepted });
            }

            if (step === "execute") {
              // Use persisted pending transfer if explicit params missing
              let execDestination = destination?.trim();
              let execAmount = amount;
              let execTokenId = undefined;

              if (this.pendingTransfer) {
                execDestination = this.pendingTransfer.destination;
                execAmount = this.pendingTransfer.amount;
                execTokenId = this.pendingTransfer.tokenId;
              }

              // If tokenId still undefined, try resolving from tokenQuery
              if (!execTokenId && tokenQuery) {
                const tq = tokenQuery.trim().toLowerCase();
                const tokenResolved = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === tq || t.name.toLowerCase() === tq);
                if (tokenResolved) execTokenId = tokenResolved.id;
              }

              if (!execDestination || typeof execAmount !== "number" || execAmount <= 0) {
                return jsonStringify({ success: false, error: "Missing parameters", message: "Destination and amount are required to execute transfer. Please start over." });
              }
              if (!execTokenId) {
                return jsonStringify({ success: false, error: "Missing token", message: "Token is required to execute transfer. Please start over." });
              }

              try {
                // Normalize execAmount to number with safe precision
                const normalizedAmount = typeof execAmount === "string" ? Number(execAmount) : execAmount;
                if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
                  return jsonStringify({ success: false, state: "failed", error: "Invalid amount", message: "Amount must be a positive number." });
                }

                const result = await sendTokenToBackend(execTokenId, execDestination, normalizedAmount, principal);
                this.pendingTransfer = null;
                return jsonStringify({ success: true, state: "completed", tx: result, message: "Transfer executed." });
              } catch (e) {
                this.pendingTransfer = null;
                return jsonStringify({ success: false, state: "failed", error: e?.message || "Transfer failed" });
              }
            }

            return jsonStringify({ success: false, error: "Invalid step" });
          } catch (error) {
            console.error("Error in send_token flow:", error);
            return jsonStringify({ success: false, error: error.message || "Unknown error" });
          }
        },
      }),
    ];
  }

  /**
   * System prompt for agent
   */
  getSystemPrompt() {
    return `You are Fradium AI Assistant, an AI assistant that helps users with various blockchain and cryptocurrency related tasks.

Your main tasks:
1. Help users get wallet balance information
2. Provide accurate and easy-to-understand information
3. Answer questions in the same language as the user's input
4. Always use available tools to get accurate data

Important rules:
- Always use get_balance tool when users request balance information
- Respond in the same language as the user's input
- If there's an error, explain clearly what happened
- Always format responses well and informatively

Available tools:
- get_my_balance: Get token balance for the current user's wallet addresses. Use this when the user says "my" (e.g., "check my BTC balance", "get my ETH balance"). Requires token parameter.
- get_balance: Get token balance for a specific wallet address. Use this when the user provides an address (e.g., "check balance mvE3KG9ShMqP2F42dgj941jUbumnHEekJy"). Requires address parameter, token is optional.
- get_my_address: Get wallet address for the current user for a specific token/network. Use this when the user wants to see their address (e.g., "show my BTC address", "what's my Ethereum address", "get my ICP principal"). Requires token parameter.
- analyze_address: Analyze a wallet address for security risks and suspicious activity. Use this when the user wants to check if an address is safe (e.g., "analyze address mvE3KG9ShMqP2F42dgj941jUbumnHEekJy", "check if 0x123... is safe", "analyze this Bitcoin address"). Requires address parameter.

Tool usage guidelines:
- If the user says "my" and wants balance (e.g., "check my BTC balance"), use get_my_balance with the token parameter.
- If the user says "my" and wants address (e.g., "show my BTC address"), use get_my_address with the token parameter.
- If the user provides an address and wants balance (e.g., "check balance mvE3KG9ShMqP2F42dgj941jUbumnHEekJy"), use get_balance with the address parameter.
- If the user provides an address and wants security analysis (e.g., "analyze address mvE3KG9ShMqP2F42dgj941jUbumnHEekJy"), use analyze_address with the address parameter.
- If the user provides both address and token for balance, use get_balance with both parameters.
- Always prefer using the tool over guessing values.

Remember: You are part of the Fradium ecosystem that helps users understand and use blockchain safely.`;
  }

  /**
   * Process chat message with agent
   * @param {string} message - Message from user
   * @param {Array} chatHistory - Previous chat history
   * @returns {Promise<Object>} Response from agent
   */
  async processMessage(message, chatHistory = []) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.agentExecutor) {
        throw new Error("Agent not initialized");
      }

      // Lightweight pre-intent handling for multi-turn support
      // 1) Pending balance request -> try to resolve token from this message
      if (this.pendingBalanceRequest) {
        const tok = this.extractTokenFromText(message);
        if (tok) {
          // Build a short JSON that agent can transform into a nice bubble
          try {
            const principal = this.authContext?.identity?.getPrincipal?.();
            const raw = await fetchTokenBalance(tok.id, principal, true);
            const bal = this.formatBalanceForToken(tok, raw);
            this.pendingBalanceRequest = false;
            return {
              success: true,
              response: `Here is your ${tok.name} (${tok.symbol}) balance:\n\n<pre>\n${bal} ${tok.symbol}\n</pre>`,
            };
          } catch (e) {
            this.pendingBalanceRequest = false;
            return {
              success: false,
              response: `Sorry, I couldn't fetch your ${tok.symbol} balance: ${e?.message || "Unknown error"}`,
            };
          }
        }
        // still no token -> keep waiting
        return {
          success: true,
          response: "Please specify which token (e.g., ICP, BTC, ETH, SOL, ckBTC).",
        };
      }

      // Detect simple intent: "check my balance" without token -> set pending and ask follow-up
      const simple = message.trim().toLowerCase();
      if (/^(check|show|get)\s+my\s+balance$/.test(simple)) {
        this.pendingBalanceRequest = true;
        return {
          success: true,
          response: "Which token would you like me to check? (e.g., ICP, BTC, ETH, SOL, ckBTC)",
        };
      }

      // Address request multi-turn: e.g., "what's my address" -> ask which token
      if (/^(what'?s|whats|show|get)\s+my\s+(address|addr)$/i.test(message.trim())) {
        this.pendingAddressRequest = true;
        return { success: true, response: "Which token address do you want? (e.g., ICP, FRADIUM, BTC, ETH, SOL, ckBTC)" };
      }

      // If awaiting address token
      if (this.pendingAddressRequest) {
        const tok = this.extractTokenFromText(message);
        if (tok && this.walletContext) {
          const { addresses, getAddressesLoadingState } = this.walletContext;
          if (getAddressesLoadingState && getAddressesLoadingState()) {
            return { success: true, response: "Please wait while your wallet addresses are being loaded..." };
          }
          const { address, label } = this.getMyAddressForToken(tok, addresses);
          this.pendingAddressRequest = false;
          if (!address) {
            return { success: false, response: `Sorry, I couldn't find your ${label} address. Please ensure your wallet is connected and addresses are loaded.` };
          }
          return { success: true, response: `Your ${label} address is:\n\n<pre>\n${address}\n</pre>` };
        }
        // still waiting for token clarification
        return { success: true, response: "Please specify the token (e.g., ICP, FRADIUM, BTC, ETH, SOL, ckBTC)." };
      }

      // Process message with agent (LLM will use tools for complex flows)
      const result = await this.agentExecutor.invoke({ input: message, chat_history: chatHistory });

      return {
        success: true,
        response: result.output,
        toolCalls: result.intermediateSteps || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        error: error.message,
        response: "Sorry, an error occurred while processing your message. Please try again.",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Get balance using tool
   * @param {string} address - Wallet address
   * @returns {Promise<Object>} Balance information
   */
  async getBalance(address) {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const tools = this.createTools();
      const getBalanceTool = tools.find((tool) => tool.name === "get_balance");

      if (!getBalanceTool) {
        throw new Error("Tool get_balance not found");
      }

      const result = await getBalanceTool.func({ address });
      const parsed = JSON.parse(result);
      if (parsed && parsed.success && typeof parsed.balance !== "undefined") {
        parsed.balance = formatAmount(parsed.balance);
        if (typeof parsed.message === "string") {
          // Optionally reflect formatted amount in message if present
          // Try to replace the first number-like occurrence with formatted value (non-destructive fallback)
          try {
            const formatted = parsed.balance;
            parsed.message = parsed.message.replace(/(\d+(?:\.\d+)?)/, formatted);
          } catch (_e) {}
        }
      }
      return parsed;
    } catch (error) {
      console.error("Error getting balance:", error);
      return {
        success: false,
        error: error.message,
        message: `Failed to get balance for address ${address}`,
      };
    }
  }

  /**
   * Check if agent is ready
   * @returns {boolean} Status agent
   */
  isReady() {
    return this.isInitialized && this.agentExecutor !== null;
  }

  /**
   * Reset agent state
   */
  reset() {
    this.model = null;
    this.agentExecutor = null;
    this.isInitialized = false;
    this.pendingTransfer = null;
    this.pendingBalanceRequest = false;
    this.pendingAddressRequest = false;
  }

  /**
   * Try to extract token by name/symbol aliases from free text
   */
  extractTokenFromText(text) {
    if (!text || typeof text !== "string") return null;
    const lower = text.toLowerCase();
    // alias mapping
    const aliasToSymbol = {
      bitcoin: "BTC",
      btc: "BTC",
      "btc testnet": "BTC",
      ethereum: "ETH",
      ether: "ETH",
      eth: "ETH",
      solana: "SOL",
      sol: "SOL",
      icp: "ICP",
      "internet computer": "ICP",
      fradium: "FRADIUM",
      ckbtc: "ckBTC",
      "ck-btc": "ckBTC",
      "ck btc": "ckBTC",
      fradium: "FRADIUM",
    };

    // exact alias hit
    for (const [alias, sym] of Object.entries(aliasToSymbol)) {
      const re = new RegExp(`(^|\\b)${alias}(\\b|$)`);
      if (re.test(lower)) {
        const tok = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === sym.toLowerCase());
        if (tok) return tok;
      }
    }

    // symbol or name occurrence
    for (const t of TOKENS_CONFIG) {
      const symRe = new RegExp(`(^|\\b)${t.symbol.toLowerCase()}(\\b|$)`);
      const nameRe = new RegExp(`(^|\\b)${t.name.toLowerCase()}(\\b|$)`);
      if (symRe.test(lower) || nameRe.test(lower)) return t;
    }
    return null;
  }

  /**
   * Format balance into human-readable units based on token type/decimals
   */
  formatBalanceForToken(token, rawBalance) {
    try {
      const asNumber = typeof rawBalance === "string" ? Number(rawBalance) : Number(rawBalance);
      if (!Number.isFinite(asNumber)) return String(rawBalance);
      if (token?.type === "native" && Number.isFinite(token?.decimals)) {
        const denom = Math.pow(10, Number(token.decimals));
        const val = asNumber / denom;
        // Use up to 8 decimals for readability, trim trailing zeros
        return (Math.abs(val) < 1 ? val.toFixed(Math.min(8, Number(token.decimals) || 8)) : val.toLocaleString(undefined, { maximumFractionDigits: 8 })).toString();
      }
      // ICRC and others are already in display units upstream
      return asNumber.toString();
    } catch (_e) {
      return String(rawBalance);
    }
  }

  /**
   * Resolve user's own address by token symbol mapping
   */
  getMyAddressForToken(token, addresses) {
    const sym = token.symbol.toUpperCase();
    switch (sym) {
      case "BTC":
        return { address: addresses?.bitcoin || "", label: "Bitcoin" };
      case "ETH":
        return { address: addresses?.ethereum || "", label: "Ethereum" };
      case "SOL":
        return { address: addresses?.solana || "", label: "Solana" };
      case "ICP":
        return { address: addresses?.icp_principal || "", label: "ICP Principal" };
      case "CKBTC":
        return { address: addresses?.ckbtc || "", label: "ckBTC Bitcoin" };
      case "FRADIUM":
        // FRADIUM is ICRC; use ICP principal for receive
        return { address: addresses?.icp_principal || "", label: "FRADIUM (ICRC)" };
      default:
        return { address: "", label: token.name };
    }
  }
}

// Export singleton instance
export const agentService = new AgentService();

// Export class for testing
export default AgentService;

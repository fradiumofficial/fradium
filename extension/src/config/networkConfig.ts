// Since process.env doesn't work reliably in extensions, use hardcoded values
const NETWORK = 'ic'; // Change this to 'ic' for mainnet

const CANISTER_IDS = {
  local: {
    ransomware_detector: 'uxrrr-q7777-77774-qaaaq-cai',
    backend: 'uzt4z-lp777-77774-qaabq-cai',
    ai: 'z7777-77777-77777-77777-77777-77777-77777-77777-cai',
    chatbot: 'yex4f-ptvpu-wckot-gxopq',
    evm_rpc: '7hfb6-caaaa-aaaar-qadga-cai',
    fradium_token: '7rq7r-z4amu-tkz2f-seniq',
    fradium_token_index: 'tuazr-5eaga-fonru-kovdq',
    frontend: 'uesf6-tygxb-dmawu-52vpa',
    internet_identity: 'gest2-lmzlb-2j7ly-rxkqq',
    llm: 'xsug3-6nh7b-3d6rb-gmccq',
    wallet: 'v3x23-lyaaa-aaaam-aej2a-cai',
    sol_rpc: 'tghme-zyaaa-aaaar-qarca-cai',
    default: 'yex4f-ptvpu-wckot-gxopq'
  },
  ic: {
    ransomware_detector: 'zkoni-faaaa-aaaar-qbsaa-cai',
    backend: 'oqcob-6iaaa-aaaar-qbr7q-cai',
    ai: 'zkoni-faaaa-aaaar-qbsaa-cai',
    chatbot: 'yex4f-ptvpu-wckot-gxopq',
    evm_rpc: '7hfb6-caaaa-aaaar-qadga-cai',
    fradium_token: '7rq7r-z4amu-tkz2f-seniq',
    fradium_token_index: 'tuazr-5eaga-fonru-kovdq',
    frontend: 'uesf6-tygxb-dmawu-52vpa',
    internet_identity: 'gest2-lmzlb-2j7ly-rxkqq',
    llm: 'xsug3-6nh7b-3d6rb-gmccq',
    wallet: 'v3x23-lyaaa-aaaam-aej2a-cai',
    sol_rpc: 'tghme-zyaaa-aaaar-qarca-cai',
    default: 'yex4f-ptvpu-wckot-gxopq'
  }
} as const;


export const getCanisterId = (name: keyof typeof CANISTER_IDS.local): string => {
  console.log(`Fetching canister ID for: ${name} on network: ${NETWORK}`);
  return CANISTER_IDS[NETWORK][name] || '';
};

export const CANISTER_HOST = NETWORK === 'ic' 
  ? 'https://ic0.app'
  : 'http://127.0.0.1:4943';

// Fallback hosts for IC network
export const IC_HOSTS = [
  'https://ic0.app',
  'https://icp0.io',
  'https://icp-api.io'
];

export const getNetworkConfig = () => ({
  network: NETWORK,
  host: CANISTER_HOST,
  canisterIds: CANISTER_IDS[NETWORK]
});

// Helper untuk mendapatkan URL canister langsung
export const getCanisterUrl = (canisterId: string): string => {
  return NETWORK === 'ic' 
    ? `https://${canisterId}.icp0.io`
    : `${CANISTER_HOST}/?canisterId=${canisterId}`;
};

// Helper untuk API calls ke canister
export const getApiUrl = (canisterId: string, method?: string): string => {
  const baseUrl = getCanisterUrl(canisterId);
  return method ? `${baseUrl}/api/${method}` : `${baseUrl}/api`;
};

// Helper untuk mencoba koneksi dengan fallback hosts
export const createAgentWithFallback = async (): Promise<string> => {
  if (NETWORK !== 'ic') {
    return CANISTER_HOST;
  }

  for (const host of IC_HOSTS) {
    try {
      // Test koneksi ke host
      const response = await fetch(`${host}/api/v2/status`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        console.log(`Successfully connected to IC host: ${host}`);
        return host;
      }
    } catch (error) {
      console.warn(`Failed to connect to ${host}:`, error);
      continue;
    }
  }

  // Fallback ke host default
  console.warn('All IC hosts failed, using default host');
  return CANISTER_HOST;
};

// Bitcoin faucet configuration
export const BITCOIN_CONFIG = {
  // Enable/disable faucet for new addresses (should be false in production)
  ENABLE_FAUCET: false,
  
  // Maximum balance allowed for new addresses (in satoshi)
  MAX_NEW_ADDRESS_BALANCE: 0,
  
  // Environment detection
  isDevelopment: () => {
    // Treat extension context as development to avoid overly strict production guards
    const isExtension = typeof window !== 'undefined' && window.location && (window.location.protocol === 'chrome-extension:' || window.location.protocol === 'moz-extension:');
    return isExtension ||
           window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.hostname.includes('dev') ||
           window.location.hostname.includes('test') ||
           window.location.hostname.includes('staging');
  },
  
  isProduction: () => {
    return !BITCOIN_CONFIG.isDevelopment();
  }
} as const;

export default {
  NETWORK,
  CANISTER_IDS,
  CANISTER_HOST,
  IC_HOSTS,
  getCanisterId,
  getNetworkConfig,
  getCanisterUrl,
  getApiUrl,
  createAgentWithFallback,
  BITCOIN_CONFIG
};



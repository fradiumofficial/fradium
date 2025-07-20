// Since process.env doesn't work reliably in extensions, use hardcoded values
const NETWORK = 'local'; // Change this to 'ic' for mainnet

const CANISTER_IDS = {
  local: {
    ransomware_detector: 'uxrrr-q7777-77774-qaaaq-cai',
    backend: 'uzt4z-lp777-77774-qaabq-cai',
    internet_identity: 'ufxgi-4p777-77774-qaadq-cai',
  },
  ic: {
    ransomware_detector: '', // Add mainnet canister IDs here when deploying
    backend: '',
    internet_identity: 'ufxgi-4p777-77774-qaadq-cai', // Official II canister
  }
};

export const getCanisterId = (name: keyof typeof CANISTER_IDS.local): string => {
  return CANISTER_IDS[NETWORK][name] || '';
};

export const CANISTER_HOST = NETWORK === 'local' 
  ? 'http://127.0.0.1:4943' 
  : 'https://icp-api.io';

export const getNetworkConfig = () => ({
  network: NETWORK,
  host: CANISTER_HOST,
  canisterIds: CANISTER_IDS[NETWORK]
});
import { useState, useEffect } from "react";
import TopLeft from "../../../assets/top_left.svg";
import TopRight from "../../../assets/top_right.svg";
import ProfileHeader from "../../../components/ui/header";
import {
  EyeClosedIcon,
  EyeIcon,
  MoveUpRight,
  MoveDownLeft,
  Search,
  Settings2,
} from "lucide-react";
import { useWallet } from "@/lib/walletContext";
import { useNetwork } from "@/modules/all_network/networkContext";
import type { WalletAddress } from "@/icp/services/backend_service";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
}

function Home() {
  const [ tokens, setTokens ] = useState<TokenBalance[]>([]);
  const [ filteredTokens, setFilteredTokens ] = useState<TokenBalance[]>([]);
  const [ currentNetworkValue, setCurrentNetworkValue ] = useState<string>("$0.00");
  const { 
    userWallet, 
    isLoading, 
    hideBalance, 
    setHideBalance, 
    getNetworkValue,
    networkValues
  } = useWallet();
  const { selectedNetwork, getNetworkDisplayName, getNetworkTokenType } = useNetwork();


  const toggleVisibility = () => setHideBalance(!hideBalance);

  const handleWalletClick = () => {
    // Navigate to wallet home page
    // navigate(ROUTES.WALLET_HOME);
  };

  const handleSendClick = () => {
    // Navigate to wallet home page for send functionality
    // navigate(ROUTES.WALLET_HOME);
  };

  const handleReceiveClick = () => {
    // Navigate to wallet home page for receive functionality
    // navigate(ROUTES.WALLET_HOME);
  };

  useEffect(() => {
    // Load wallet data from the wallet context
    const loadWalletData = async () => {
      if (!userWallet || !userWallet.addresses) {
        setTokens([]);
        return;
      }
      
      console.log("Home: Loading wallet data for addresses:", userWallet.addresses);
      
      // Create token balances based on wallet addresses
      const walletTokens: TokenBalance[] = [];
      
      userWallet.addresses.forEach((addr: WalletAddress) => {
        let symbol = '';
        let name = '';
        let icon = '';
        
        if ('Bitcoin' in addr.token_type) {
          symbol = 'BTC';
          name = 'Bitcoin';
          icon = '/assets/tokens/bitcoin.svg';
        } else if ('Ethereum' in addr.token_type) {
          symbol = 'ETH';
          name = 'Ethereum';
          icon = '/assets/tokens/eth.svg';
        } else if ('Solana' in addr.token_type) {
          symbol = 'SOL';
          name = 'Solana';
          icon = '/assets/tokens/solana.svg';
        } else if ('Fradium' in addr.token_type) {
          symbol = 'FUM';
          name = 'Fradium';
          icon = '/assets/tokens/fum.svg';
        }
        
        if (symbol) {
          const networkKey = name as keyof typeof networkValues;
          walletTokens.push({
            symbol,
            name,
            balance: '0.00', // In real implementation, you'd fetch actual balances
            usdValue: networkValues[networkKey] ? networkValues[networkKey].toFixed(2) : '0.00',
            icon
          });
        }
      });
      
      setTokens(walletTokens);
    };

    if (userWallet && !isLoading) {
      loadWalletData();
    }
  }, [userWallet, isLoading, networkValues]);

  // Filter tokens and calculate network value based on selected network
  useEffect(() => {
    const filterTokensAndCalculateValue = () => {
      if (selectedNetwork === "all") {
        setFilteredTokens(tokens);
        setCurrentNetworkValue(getNetworkValue("All Networks"));
      } else {
        const networkType = getNetworkTokenType(selectedNetwork);
        const filtered = tokens.filter(token => token.name === networkType);
        setFilteredTokens(filtered);
        
        // Calculate value for specific network
        const networkDisplayName = getNetworkDisplayName(selectedNetwork);
        setCurrentNetworkValue(getNetworkValue(networkDisplayName));
      }
    };

    filterTokensAndCalculateValue();
  }, [tokens, selectedNetwork, getNetworkValue, getNetworkDisplayName, getNetworkTokenType]);

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      {/* Header Sections */}
      <ProfileHeader />

      <div className="flex flex-col items-center space-y-4">
        <div className="w-[327px] h-[215px] bg-[#1F2025] cursor-pointer hover:bg-[#2A2B30] transition-colors" onClick={handleWalletClick}>
          <div className="flex flex-row justify-between">
            <img src={TopLeft} alt="Top Left" />
            <img src={TopRight} alt="Top Right" />
          </div>
          <div className="flex justify-center items-center">
            <div className="font-sans flex-col items-start">
              <div className="flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {hideBalance ? "••••" : currentNetworkValue}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent wallet navigation when toggling visibility
                    toggleVisibility();
                  }}
                  className="ml-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle balance visibility"
                >
                  {hideBalance ? <EyeClosedIcon /> : <EyeIcon />}
                </button>
              </div>
              
              {/* Wallet Status */}
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#9BE4A0]">Loading wallet...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <span className="text-sm text-[#9BE4A0]">Wallet loaded</span>
                </div>
              )}
              
              <div className="flex flex-row">
                <div className="basis-64 m-1">
                  <div className="flex flex-row w-[145px] h-[60px] bg-white/10 justify-center items-center gap-4">
                    <div>
                      <h1 className="text-white font-bold text-[16px]">Send</h1>
                    </div>
                    <div className="w-[50px] bg-[#823EFD]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendClick();
                        }}
                        className="
                        w-[50px] h-[45px] flex items-center 
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E39E]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0
                        active:translate-y-0 active:translate-x-0
                        transition-transform duration-150 ease-in-out"
                      >
                        <MoveUpRight className="text-black" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="basis-64 m-1">
                  <div className="flex flex-row w-[145px] h-[60px] bg-white/10 justify-center items-center gap-4">
                    <div>
                      <h1 className="text-white font-bold text-[16px]">Receive</h1>
                    </div>
                    <div className="w-[50px] bg-[#823EFD]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReceiveClick();
                        }}
                        className="
                        w-[50px] h-[45px] flex items-center 
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E39E]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0
                        active:translate-y-0 active:translate-x-0
                        transition-transform duration-150 ease-in-out"
                      >
                        <MoveDownLeft className="text-black" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row justify-between mt-[20px]">
            <div className="flex flex-col-1">
              <h1 className="text-[16px] font-semibold">Tokens</h1>
            </div>
            <div className="flex flex-col-2">
              <Search />
              <Settings2 />
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-2 mt-[10px]">
            {filteredTokens.map((token) => (
              <div
                key={token.symbol}
                className="flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <img src={token.icon} alt={token.name} className="w-8 h-8" />
                  <div>
                    <div className="text-white font-medium">{token.symbol}</div>
                    <div className="text-white/50 text-sm">{token.name}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-white font-medium">{token.balance}</div>
                  <div className="text-white/50 text-sm">${token.usdValue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

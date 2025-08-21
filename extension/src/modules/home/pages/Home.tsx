import { useState, useEffect, useCallback } from "react";
import TopLeft from "../../../assets/top_left.svg";
import TopRight from "../../../assets/top_right.svg";
import ProfileHeader from "../../../components/ui/header";
import bitoinIcon from "@/../public/assets/tokens/bitcoin.svg";
import ethIcon from "@/../public/assets/tokens/eth.svg";
import solanaIcon from "@/../public/assets/tokens/solana.svg";
import fumIcon from "@/../public/assets/tokens/fum.svg";
import {
  EyeClosedIcon,
  EyeIcon,
  MoveUpRight,
  MoveDownLeft,
  Search,
  Settings2,
} from "lucide-react";
import { useWallet } from "@/lib/contexts/walletContext";
import { useNetwork } from "@/modules/all_network/networkContext";
import type { WalletAddress } from "@/icp/services/backend_service";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
  isLoading?: boolean; // Add loading state for individual tokens
}

interface TokenPrice {
  usd: number;
}

interface PriceResponse {
  [key: string]: TokenPrice;
}


function Home() {
  const [ tokens, setTokens ] = useState<TokenBalance[]>([]);
  const [ filteredTokens, setFilteredTokens ] = useState<TokenBalance[]>([]);
  const [ currentNetworkValue, setCurrentNetworkValue ] = useState<string>("$0.00");
  const [ tokenPrices, setTokenPrices ] = useState<Record<string, number>>({});
  const [ isBalancesLoading, setIsBalancesLoading ] = useState(true); // Add loading state for balances
  const [ hasFetchedBalances, setHasFetchedBalances ] = useState(false); // Track if balances have been fetched
  const { 
    userWallet, 
    isLoading, 
    hideBalance, 
    setHideBalance, 
    getNetworkValue,
    networkValues,
    networkFilters
  } = useWallet();
  const { selectedNetwork, getNetworkDisplayName, getNetworkTokenType } = useNetwork();
  const navigate = useNavigate();

  const toggleVisibility = () => setHideBalance(!hideBalance);

  const handleWalletClick = () => {
    // Navigate to wallet home page
    // navigate(ROUTES.WALLET_HOME);
  };

  const handleSendClick = () => {
    // Navigate to wallet home page for send functionality
    navigate(ROUTES.SEND);
  };

  const handleReceiveClick = () => {
    // Navigate to wallet home page for receive functionality
    navigate(ROUTES.RECEIVE);
  };

  // Fetch current token prices from CoinGecko
  const fetchTokenPrices = useCallback(async () => {
    try {
      console.log('Home: Fetching token prices...');
      const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd');
      const data: PriceResponse = await response.json();
      
      const prices = {
        Bitcoin: data.bitcoin?.usd || 0,
        Ethereum: data.ethereum?.usd || 0,
        Solana: data.solana?.usd || 0,
        Fradium: 1.0 // Placeholder price for Fradium
      };
      
      console.log('Home: Token prices fetched:', prices);
      setTokenPrices(prices);
    } catch (error) {
      console.error('Home: Error fetching token prices:', error);
      // Set default prices if API fails
      setTokenPrices({
        Bitcoin: 45000,
        Ethereum: 3000,
        Solana: 100,
        Fradium: 1.0
      });
    }
  }, []);

  // Calculate token balance from USD value and current price
  const calculateTokenBalance = useCallback((usdValue: number, tokenPrice: number): string => {
    // If token price is 0, return default format
    if (tokenPrice === 0) return '0.00';
    
    const balance = usdValue / tokenPrice;
    
    // Format to 6 decimal places then remove trailing zeros
    let formattedBalance = balance.toFixed(6);
    
    // Remove trailing zeros and unnecessary decimal point
    formattedBalance = formattedBalance.replace(/\.?0+$/, '');
    
    // If the result is empty or just a dot, return 0.00
    if (!formattedBalance || formattedBalance === '0' || formattedBalance === '.') {
      return '0.00';
    }
    
    // If no decimal point, add .00 for consistency
    if (!formattedBalance.includes('.')) {
      return formattedBalance + '.00';
    }
    
    // If only one decimal place, add one more zero
    const parts = formattedBalance.split('.');
    if (parts[1] && parts[1].length === 1) {
      return formattedBalance + '0';
    }
    
    return formattedBalance;
  }, []);

  // Check if balances are still loading
  const checkBalancesLoading = useCallback(() => {

    const hasWallet = !!userWallet;
    const hasPrices = Object.keys(tokenPrices).length > 0;
    const hasReceivedBalances = Object.values(networkValues).some(value => value !== 0);
    
    const shouldShowLoading = hasWallet && hasPrices && (!hasFetchedBalances || !hasReceivedBalances);
    
    console.log('Home: Balance loading check:', {
      hasWallet,
      hasPrices,
      hasReceivedBalances,
      hasFetchedBalances,
      shouldShowLoading,
      networkValues
    });
    
    setIsBalancesLoading(shouldShowLoading);
  }, [networkValues, tokenPrices, userWallet, hasFetchedBalances]);

  // Fetch token prices on component mount
  useEffect(() => {
    fetchTokenPrices();
  }, [fetchTokenPrices]);

  // Check balance loading state when dependencies change
  useEffect(() => {
    checkBalancesLoading();
  }, [checkBalancesLoading]);

  // Detect when balances have been fetched
  useEffect(() => {
    if (Object.keys(networkValues).length > 0 && !hasFetchedBalances) {
      console.log('Home: Detected that balances have been fetched, updating state');
      setHasFetchedBalances(true);
    }
  }, [networkValues, hasFetchedBalances]);

  // Load wallet data from the wallet context
  const loadWalletData = useCallback(async () => {
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
      let isEnabled = false;
      
      if ('Bitcoin' in addr.token_type) {
        symbol = 'BTC';
        name = 'Bitcoin';
        icon = bitoinIcon;
        isEnabled = networkFilters?.Bitcoin ?? true;
      } else if ('Ethereum' in addr.token_type) {
        symbol = 'ETH';
        name = 'Ethereum';
        icon = ethIcon;
        isEnabled = networkFilters?.Ethereum ?? true;
      } else if ('Solana' in addr.token_type) {
        symbol = 'SOL';
        name = 'Solana';
        icon = solanaIcon;
        isEnabled = networkFilters?.Solana ?? true;
      } else if ('Fradium' in addr.token_type) {
        symbol = 'FUM';
        name = 'Fradium';
        icon = fumIcon;
        isEnabled = networkFilters?.Fradium ?? true;
      }
      
      // Only add token if the network is enabled
      if (symbol && isEnabled) {
        const networkKey = name as keyof typeof networkValues;
        let usdValue = networkValues[networkKey] || 0;
        const tokenPrice = tokenPrices[name] || 0;
        
        const isTokenLoading = Object.keys(tokenPrices).length > 0 && 
                              (!hasFetchedBalances || (usdValue === 0 && !hasFetchedBalances));
        
        // Calculate actual token balance from USD value and current price
        const tokenBalance = calculateTokenBalance(usdValue, tokenPrice);
        
        console.log(`Home: ${name} - USD: $${usdValue}, Price: $${tokenPrice}, Balance: ${tokenBalance}, Loading: ${isTokenLoading}`);
        
        walletTokens.push({
          symbol,
          name,
          balance: tokenBalance,
          usdValue: usdValue.toFixed(2),
          icon,
          isLoading: isTokenLoading
        });
      }
    });
    
    setTokens(walletTokens);
  }, [userWallet, networkValues, networkFilters, tokenPrices, calculateTokenBalance, hasFetchedBalances]);

  useEffect(() => {
    if (userWallet && !isLoading && Object.keys(tokenPrices).length > 0) {
      loadWalletData();
    }
  }, [userWallet, isLoading, tokenPrices, loadWalletData]);

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
              ) : isBalancesLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#9BE4A0]">Fetching balances...</span>
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
            <div className="flex flex-col-2 items-center space-x-2">
              <Search />
              <Settings2 />
            </div>
          </div>

          {/* Token List */}
          <div className="space-y-2 mt-[10px]">
            {filteredTokens.length === 0 && isBalancesLoading ? (
              // Show loading state when no tokens but balances are loading
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <div className="w-8 h-8 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white/50 text-sm">Loading token balances...</span>
              </div>
            ) : filteredTokens.length === 0 ? (
              // Show empty state when no tokens and not loading
              <div className="flex flex-col items-center justify-center py-8">
                <span className="text-white/50 text-sm">No tokens available</span>
              </div>
            ) : (
              // Show token list
              filteredTokens.map((token) => (
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
                    <div className="text-white font-medium">
                      {isBalancesLoading ? (
                        <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        token.balance
                      )}
                    </div>
                    <div className="text-white/50 text-sm">
                      {isBalancesLoading ? (
                        <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        `$${token.usdValue}`
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

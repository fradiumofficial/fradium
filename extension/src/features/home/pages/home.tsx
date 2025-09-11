import { Search, Settings2, RefreshCw } from "lucide-react";
import { CDN } from "~lib/constant/cdn";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useWallet } from "~lib/context/walletContext";
import { useNetwork } from "~features/network/context/networkContext";
import { useAuth } from "~lib/context/authContext";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
  isLoading?: boolean;
  hasError?: boolean;
  networkKey: string;
}

function Home() {
  const { getNetworkValue, principalText, walletActor, isAuthenticated } = useWallet() as any
  const { identity } = useAuth();
  const { selectedNetwork } = useNetwork();
  const navigate = useNavigate();
  const toggleVisibility = () => setHideBalance(!hideBalance);

  // Token configuration
  const tokenConfig: TokenBalance[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.bitcoin,
      isLoading: false,
      hasError: false,
      networkKey: "btc"
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.eth,
      isLoading: false,
      hasError: false,
      networkKey: "eth"
    },
    {
      symbol: "SOL",
      name: "Solana",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.solana,
      isLoading: false,
      hasError: false,
      networkKey: "sol"
    },
    {
      symbol: "FUM",
      name: "Fradium",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.fum,
      isLoading: false,
      hasError: false,
      networkKey: "fra"
    }
  ];

  const [principal, setPrincipal] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>(tokenConfig);
  const [canisterError, setCanisterError] = useState<string | null>(null);
  const [canisterOutOfCycles, setCanisterOutOfCycles] = useState(false);
  const [isFetchingBalances, setIsFetchingBalances] = useState(false);

  useEffect(() => {
    setPrincipal(principalText || null);
  }, [principalText]);

  // Get decimal places for each network
  const getDecimalPlaces = useCallback((networkKey: string) => {
    switch (networkKey) {
      case "btc": return 8; // Satoshi to BTC
      case "eth": return 18; // Wei to ETH
      case "sol": return 9;  // Lamports to SOL
      case "fra": return 8;  // FUM decimals
      default: return 8;
    }
  }, []);

  // Helper function to detect out of cycles error
  const isOutOfCyclesError = useCallback((error: any): boolean => {
    if (!error) return false;

    const errorMessage = error.message || error.toString();
    const rejectMessage = error.reject_message || '';

    return (
      errorMessage.includes('IC0504') ||
      errorMessage.includes('out of cycles') ||
      rejectMessage.includes('out of cycles') ||
      errorMessage.includes('Reject code: 5') ||
      rejectMessage.includes('Reject code: 5')
    );
  }, []);

  // Helper function to handle balance fetch errors
  const handleBalanceError = useCallback((error: any, tokenSymbol: string) => {
    console.error(`Error fetching ${tokenSymbol} balance:`, error);

    if (isOutOfCyclesError(error)) {
      setCanisterOutOfCycles(true);
      setCanisterError('Wallet canister is currently out of cycles. Please try again later or contact support.');
      return;
    }

    // For other errors, just set error on the specific token
    setTokenBalances(prev => prev.map(token =>
      token.symbol === tokenSymbol
        ? { ...token, isLoading: false, hasError: true }
        : token
    ));
  }, [isOutOfCyclesError]);

  // Fetch Bitcoin balance
  const fetchBitcoinBalance = useCallback(async () => {
    if (!isAuthenticated || !walletActor || !identity || canisterOutOfCycles) return;

    setTokenBalances(prev => prev.map(token => 
      token.networkKey === "btc" 
        ? { ...token, isLoading: true, hasError: false }
        : token
    ));

    try {
      const btcBalance = await walletActor.bitcoin_balance();
      const btcValue = Number(btcBalance) / 100000000; // Convert satoshi to BTC
      const balanceValue = btcValue.toFixed(getDecimalPlaces("btc"));

      setTokenBalances(prev => prev.map(token => 
        token.networkKey === "btc" 
          ? { 
              ...token, 
              balance: balanceValue, 
              usdValue: "$0.00", 
              isLoading: false, 
              hasError: false 
            }
          : token
      ));
    } catch (error) {
      handleBalanceError(error, "BTC");
    }
  }, [isAuthenticated, walletActor, identity, getDecimalPlaces, canisterOutOfCycles]);

  // Fetch Ethereum balance
  const fetchEthereumBalance = useCallback(async () => {
    if (!isAuthenticated || !walletActor || !identity || canisterOutOfCycles) return;

    setTokenBalances(prev => prev.map(token => 
      token.networkKey === "eth" 
        ? { ...token, isLoading: true, hasError: false }
        : token
    ));

    try {
      const ethBalance = await walletActor.ethereum_balance();
      const balanceValue = ethBalance; // Already formatted as string

      setTokenBalances(prev => prev.map(token => 
        token.networkKey === "eth" 
          ? { 
              ...token, 
              balance: balanceValue, 
              usdValue: "$0.00", 
              isLoading: false, 
              hasError: false 
            }
          : token
      ));
    } catch (error) {
      handleBalanceError(error, "ETH");
    }
  }, [isAuthenticated, walletActor, identity, canisterOutOfCycles]);

  // Fetch Solana balance
  const fetchSolanaBalance = useCallback(async () => {
    if (!isAuthenticated || !walletActor || !identity || canisterOutOfCycles) return;

    setTokenBalances(prev => prev.map(token => 
      token.networkKey === "sol" 
        ? { ...token, isLoading: true, hasError: false }
        : token
    ));

    try {
      const solBalance = await walletActor.solana_balance();
      const solValue = Number(solBalance) / 1000000000; // Convert lamports to SOL
      const balanceValue = solValue.toFixed(getDecimalPlaces("sol"));

      setTokenBalances(prev => prev.map(token => 
        token.networkKey === "sol" 
          ? { 
              ...token, 
              balance: balanceValue, 
              usdValue: "$0.00", 
              isLoading: false, 
              hasError: false 
            }
          : token
      ));
    } catch (error) {
      handleBalanceError(error, "SOL");
    }
  }, [isAuthenticated, walletActor, identity, getDecimalPlaces, canisterOutOfCycles]);

  // Fetch Fradium balance
  const fetchFradiumBalance = useCallback(async () => {
    if (!isAuthenticated || !walletActor || !identity || canisterOutOfCycles) return;

    setTokenBalances(prev => prev.map(token => 
      token.networkKey === "fra" 
        ? { ...token, isLoading: true, hasError: false }
        : token
    ));

    try {
      // Fradium balance - would need to be implemented
      const balanceValue = "0.00";

      setTokenBalances(prev => prev.map(token => 
        token.networkKey === "fra" 
          ? { 
              ...token, 
              balance: balanceValue, 
              usdValue: "$0.00", 
              isLoading: false, 
              hasError: false 
            }
          : token
      ));
    } catch (error) {
      handleBalanceError(error, "FUM");
    }
  }, [isAuthenticated, walletActor, identity, canisterOutOfCycles]);

  // Reset canister error state (for manual retry)
  const resetCanisterError = useCallback(() => {
    setCanisterError(null);
    setCanisterOutOfCycles(false);
  }, []);

  // Fetch all token balances individually
  const fetchAllBalances = useCallback(async (force = false) => {
    if (!isAuthenticated || !walletActor || canisterOutOfCycles) {
      setTokenBalances(tokenConfig);
      return;
    }

    // Prevent multiple concurrent fetch operations
    if (isFetchingBalances && !force) {
      return;
    }

    setIsFetchingBalances(true);

    try {
      // Call all fetch functions in parallel - each will update its own loading state
      await Promise.all([
        fetchBitcoinBalance(),
        fetchEthereumBalance(),
        fetchSolanaBalance(),
        fetchFradiumBalance()
      ]);
    } catch (error) {
      console.error("Error in parallel balance fetching:", error);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isAuthenticated, walletActor, canisterOutOfCycles, isFetchingBalances, fetchBitcoinBalance, fetchEthereumBalance, fetchSolanaBalance, fetchFradiumBalance, tokenConfig]);

  // Reset error state when authentication changes
  useEffect(() => {
    if (isAuthenticated) {
      resetCanisterError();
    }
  }, [isAuthenticated, resetCanisterError]);

  // Fetch balances when component mounts or authentication changes
  useEffect(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  // Refresh balances when component becomes visible (useful for when returning from other pages)
  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      // Clear existing timeout
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }

      // Only fetch if document becomes visible and user is authenticated
      if (!document.hidden && isAuthenticated && walletActor && !isFetchingBalances) {
        // Add debounce to prevent spam calls
        visibilityTimeout = setTimeout(() => {
          fetchAllBalances(false); // Don't force, respect the prevention logic
        }, 1000); // 1 second debounce
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (visibilityTimeout) {
        clearTimeout(visibilityTimeout);
      }
    };
  }, [isAuthenticated, walletActor, fetchAllBalances, isFetchingBalances]);

  // Filter tokens based on selected network
  const filteredTokens = useMemo(() => {
    if (selectedNetwork === "all") {
      return tokenBalances;
    }

    const networkMap = {
      btc: "btc",
      eth: "eth", 
      sol: "sol",
      fra: "fra"
    };

    const targetNetwork = networkMap[selectedNetwork as keyof typeof networkMap];
    if (!targetNetwork) return tokenBalances;

    return tokenBalances.filter(token => token.networkKey === targetNetwork);
  }, [selectedNetwork, tokenBalances]);

  // Navigation handlers - disabled during balance loading
  const handleAnalyzeAddress = () => {
    navigate(ROUTES.ANALYZE_ADDRESS);
  };
  const handleReceiveClick = () => {
    navigate(ROUTES.RECEIVE);
  };
  const handleSendClick = () => {
    navigate(ROUTES.SEND);
  };
  const handleAccountSettings = () => {
    navigate(ROUTES.ACCOUNT);
  };

  return (
    <div className="w-[375px] text-white shadow-md overflow-hidden">
      {/* Content Container */}
      <div className="flex flex-col items-start p-[20px_20px_16px] gap-3 w-[375px] h-[224px] flex-none order-2 flex-grow-0 z-[2]">
        {/* Card */}
        <div className="box-border flex flex-col items-center p-[20px_16px_16px] gap-5 w-[335px] h-[188px] bg-gradient-to-br from-[#7C72FE] via-[#5A52C6] via-[#534BBA] to-[#433BA6] shadow-[0px_0px_0px_1px_#7C77C4,0px_5px_18px_-4px_rgba(74,66,170,0.6)] rounded-[28px] flex-none order-0 self-stretch flex-grow-0">
          {/* Text Section */}
          <div className="flex flex-col items-center p-0 gap-[10px] w-[200px] h-[87px] flex-none order-0 flex-grow-0">
            {/* Total Portfolio Value */}
            <div className="w-[135px] h-[21px] font-['General Sans'] font-medium text-[14px] leading-[150%] flex items-center letter-[-0.01em] text-white flex-none order-0 flex-grow-0">
              Total Portfolio Value
            </div>
            
            {/* Amount and Description */}
            <div className="flex flex-col items-center p-0 gap-[6px] w-[186px] h-[56px] flex-none order-1 flex-grow-0">
              {/* Balance Amount */}
              <div className="w-[86px] h-8 font-['General Sans'] font-semibold text-[32px] leading-8 flex items-center text-white flex-none order-0 flex-grow-0">
                {hideBalance ? "••••" : selectedNetwork === "all" ? getNetworkValue("All Networks") : getNetworkValue(selectedNetwork)}
              </div>
              
              {/* Description */}
              <div className="w-[200px] h-[18px] font-['General Sans'] font-medium text-[12px] leading-[150%] flex items-center letter-[-0.01em] text-white flex-none order-1 flex-grow-0">
                Top up your wallet to start using it!
              </div>
            </div>
          </div>

          {/* Button Section */}
          <div className="flex flex-row items-start p-0 gap-2 w-[303px] h-[45px] flex-none order-1 self-stretch flex-grow-0">
            {/* Receive Button */}
            <button 
              onClick={handleReceiveClick}
              className="box-border flex flex-row justify-between items-center p-[12px_12px_12px_16px] gap-2 w-[147.5px] h-[45px] bg-gradient-to-r from-white/[0.003] via-white/[0.112] to-white/[0.15] backdrop-blur-[10px] rounded-full flex-none order-0 flex-grow-1 hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-row items-center p-0 gap-[6px] mx-auto w-[126px] h-[21px] flex-none order-0 flex-grow-0">
                <div className="w-5 h-5 flex-none order-0 flex-grow-0 relative">
                  <img src={CDN.icons.qrCode} alt="QR Code" className="w-[15px] h-[15px] absolute left-[calc(50%-15px/2)] top-[calc(50%-15px/2)]" />
                </div>
                <div className="w-[100px] h-[21px] font-['General Sans'] font-medium text-[16px] leading-[130%] text-white flex-none order-1 flex-grow-0">
                  Receive
                </div>
              </div>
              <div className="mx-auto w-5 h-5 flex-none order-1 flex-grow-0 relative">
                <img src={CDN.icons.sendCoin} alt="Receive" className="w-[11.67px] h-[11.67px] absolute left-[calc(50%-11.67px/2+51.92px)] top-[calc(50%-11.67px/2+0.17px)] rotate-180" />
              </div>
            </button>

            {/* Send Button */}
            <button 
              onClick={handleSendClick}
              className="box-border flex flex-row justify-between items-center p-[12px_12px_12px_16px] gap-2 w-[147.5px] h-[45px] bg-gradient-to-r from-white/[0.003] via-white/[0.112] to-white/[0.15] backdrop-blur-[10px] rounded-full flex-none order-1 flex-grow-1 hover:bg-white/20 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-row items-center p-0 gap-[6px] mx-auto w-[126px] h-[21px] flex-none order-0 flex-grow-0">
                <div className="w-5 h-5 flex-none order-0 flex-grow-0 relative">
                  <img src={CDN.icons.sendToken} alt="Send" className="w-[16.67px] h-[16.67px] absolute left-[calc(50%-16.67px/2+0px)] top-[calc(50%-16.67px/2+0px)]" />
                </div>
                <div className="w-[100px] h-[21px] font-['General Sans'] font-medium text-[16px] leading-[130%] text-white flex-none order-1 flex-grow-0">
                  Send
                </div>
              </div>
              <div className="mx-auto w-5 h-5 flex-none order-1 flex-grow-0 relative">
                <img src={CDN.icons.callReceived} alt="Send" className="w-[11.67px] h-[11.67px] absolute left-[calc(50%-11.67px/2+51.92px)] top-[calc(50%-11.67px/2+0.17px)] rotate-180" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tokens Section */}
      <div className="box-border flex flex-col items-start p-[12px_20px_20px] gap-2 w-[375px] h-[271px] flex-none order-3 self-stretch flex-grow-0 z-[3]">
        {/* Header */}
        <div className="flex flex-row justify-between items-center p-0 gap-[38px] w-[335px] h-6 flex-none order-0 self-stretch flex-grow-0">
          {/* Tokens Title */}
          <div className="mx-auto w-[55px] h-6 font-['General Sans'] font-semibold text-[16px] leading-[150%] flex items-center text-white flex-none order-0 flex-grow-0">
            Tokens
          </div>
          
          {/* Icon Section */}
          <div className="mx-auto flex flex-row items-center p-0 gap-3 w-[84px] h-5 flex-none order-1 flex-grow-0">
            <button
              onClick={handleAnalyzeAddress}
              disabled={isFetchingBalances}
              className={`w-5 h-5 flex-none order-0 flex-grow-0 relative ${
                isFetchingBalances
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer'
              }`}
              title={isFetchingBalances ? "Please wait..." : "Analyze address"}
            >
              <Search className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleAccountSettings}
              disabled={isFetchingBalances}
              className={`w-5 h-5 flex-none order-1 flex-grow-0 relative ${
                isFetchingBalances
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer'
              }`}
              title={isFetchingBalances ? "Please wait..." : "Account settings"}
            >
              <Settings2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => fetchAllBalances(true)}
              disabled={isFetchingBalances}
              className={`w-5 h-5 flex-none order-2 flex-grow-0 relative ${
                isFetchingBalances
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-white/10 cursor-pointer'
              }`}
              title={isFetchingBalances ? "Loading balances..." : "Refresh balances"}
            >
              <RefreshCw className={`w-5 h-5 text-white ${isFetchingBalances ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col items-center p-0 gap-1 w-[335px] h-[207px] flex-none order-1 self-stretch flex-grow-0">
          {/* Content */}
          <div className="flex flex-col items-start p-0 w-[335px] h-[207px] flex-none order-0 self-stretch flex-grow-0">
            {filteredTokens.map((token, index) => (
              <div key={token.symbol}>
                {/* Token Item */}
                <div className="box-border flex flex-row justify-between items-center p-[12px_0px] gap-4 w-[335px] h-[69px] flex-none order-0 self-stretch flex-grow-0">
                  {/* Content */}
                  <div className="mx-auto flex flex-row items-center p-0 gap-4 w-[242px] h-[45px] flex-none order-0 flex-grow-0">
                    {/* Token Icon */}
                    <div className="w-10 h-10 flex-none order-0 flex-grow-0 relative">
                      <img src={token.icon} alt={token.name} className="w-full h-full rounded-full" />
                    </div>
                    
                    {/* Token Info */}
                    <div className="flex flex-col items-start p-0 w-[183px] h-[45px] flex-none order-1 flex-grow-0">
                      {/* Token Symbol and Name */}
                      <div className="flex flex-row items-center p-0 gap-2 w-[96px] h-6 flex-none order-0 flex-grow-0">
                        <div className="w-8 h-6 font-['General Sans'] font-medium text-[16px] leading-[150%] flex items-center text-white flex-none order-0 flex-grow-0">
                          {token.symbol}
                        </div>
                        <div className="w-1 h-1 bg-white/50 rounded-full flex-none order-1 flex-grow-0"></div>
                        <div className="w-11 h-[21px] font-['General Sans'] font-normal text-[14px] leading-[150%] flex items-center text-white/50 flex-none order-2 flex-grow-0">
                          {token.name}
                        </div>
                      </div>
                      
                      {/* Network Info */}
                      <div className="flex flex-row items-center p-0 gap-2 w-[183px] h-[21px] flex-none order-1 flex-grow-0">
                        <div className="w-11 h-[21px] font-['General Sans'] font-normal text-[14px] leading-[150%] flex items-center text-white/50 flex-none order-0 flex-grow-0">
                          {token.name}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Balance */}
                  <div className="flex flex-col items-end p-0 pr-4 w-[80px] h-[45px] flex-none order-1 flex-grow-0">
                    {token.isLoading ? (
                      <div className="flex items-center justify-center w-full">
                        <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="w-full h-6 font-['General Sans'] font-medium text-[16px] leading-[150%] flex items-end justify-end text-white flex-none order-0 flex-grow-0">
                          {token.balance}
                        </div>
                        <div className="w-full h-[21px] font-['General Sans'] font-medium text-[14px] leading-[150%] flex items-end justify-end text-white/50 flex-none order-1 flex-grow-0">
                          {token.usdValue}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Separator Line */}
                {index < filteredTokens.length - 1 && (
                  <div className="w-[335px] h-0 border border-white/10 flex-none order-1 self-stretch flex-grow-0"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

import { EyeClosedIcon, EyeIcon, MoveUpRight, MoveDownLeft, Search, Settings2, RefreshCw } from "lucide-react";
import ProfileHeader from "~components/header";
import { CDN } from "~lib/constant/cdn";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
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

  // Fetch Bitcoin balance - using useRef to prevent recreation cascades
  const fetchBitcoinBalance = useRef(async () => {
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
  });

  // Fetch Ethereum balance - using useRef to prevent recreation cascades
  const fetchEthereumBalance = useRef(async () => {
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
  });

  // Fetch Solana balance - using useRef to prevent recreation cascades
  const fetchSolanaBalance = useRef(async () => {
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
  });

  // Fetch Fradium balance - using useRef to prevent recreation cascades
  const fetchFradiumBalance = useRef(async () => {
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
  });

  // Reset canister error state (for manual retry)
  const resetCanisterError = useCallback(() => {
    setCanisterError(null);
    setCanisterOutOfCycles(false);
  }, []);

  // Fetch all token balances individually - stable reference to prevent recreation cascades
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
      // Call all fetch functions in parallel using stable references - each will update its own loading state
      await Promise.all([
        fetchBitcoinBalance.current(),
        fetchEthereumBalance.current(),
        fetchSolanaBalance.current(),
        fetchFradiumBalance.current()
      ]);
    } catch (error) {
      console.error("Error in parallel balance fetching:", error);
    } finally {
      setIsFetchingBalances(false);
    }
  }, [isAuthenticated, walletActor, canisterOutOfCycles, isFetchingBalances, tokenConfig]);

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
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      {/* Header Sections */}
      <ProfileHeader />

      <div className="flex flex-col items-center space-y-4">
        <div className="w-[327px] h-[215px] bg-[#1F2025] cursor-pointer hover:bg-[#2A2B30] transition-colors" onClick={() => {}}>
          <div className="flex flex-row justify-between">
            <img src={CDN.images.topLeft} alt="Top Left" />
            <img src={CDN.images.topRight} alt="Top Right" />
          </div>
          <div className="flex justify-center items-center">
            <div className="font-sans flex-col items-start">
              <div className="flex items-center justify-center">
                <span className="text-white text-4xl font-bold">
                  {hideBalance ? "••••" : selectedNetwork === "all" ? getNetworkValue("All Networks") : getNetworkValue(selectedNetwork)}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent wallet navigation when toggling visibility
                    toggleVisibility();
                  }}
                  className="ml-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle balance visibility">
                  {hideBalance ? <EyeClosedIcon /> : <EyeIcon />}
                </button>
              </div>

              {/* Wallet Status */}
              <div className="flex flex-col items-center justify-center gap-1 my-2">
                <span className="text-xs text-[#9BE4A0]/70">{principal ? `${principal.slice(0, 6)}...${principal.slice(-4)}` : "Not connected"}</span>
              </div>

              <div className="flex flex-row">
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
                        className={`
                        w-[50px] h-[45px] flex items-center
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E39E]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0 active:translate-y-0 active:translate-x-0
                        transition-all duration-150 ease-in-out`}
                        title={isFetchingBalances ? "Please wait for balance loading..." : "Receive tokens"}>
                        <MoveDownLeft className="text-black" />
                      </button>
                    </div>
                  </div>
                </div>
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
                        className={`
                        w-[50px] h-[45px] flex items-center
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E4A0]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0 active:translate-y-0 active:translate-x-0
                        transition-all duration-150 ease-in-out`}
                        title={isFetchingBalances ? "Please wait for balance loading..." : "Send tokens"}>
                        <MoveUpRight className="text-black" />
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
              <button
                onClick={() => fetchAllBalances(true)}
                disabled={isFetchingBalances}
                className={`p-1 rounded transition-opacity ${
                  isFetchingBalances
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
                title={isFetchingBalances ? "Loading balances..." : "Refresh balances"}
              >
                <RefreshCw className={`w-4 h-4 ${isFetchingBalances ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={handleAnalyzeAddress}
                disabled={isFetchingBalances}
                className={`p-1 rounded transition-opacity ${
                  isFetchingBalances
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
                title={isFetchingBalances ? "Please wait..." : "Analyze address"}
              >
                <Search />
              </button>
              <button
                onClick={handleAccountSettings}
                disabled={isFetchingBalances}
                className={`p-1 rounded transition-opacity ${
                  isFetchingBalances
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
                title={isFetchingBalances ? "Please wait..." : "Account settings"}
              >
                <Settings2 />
              </button>
            </div>
          </div>

          {/* Global Loading Indicator */}
          {isFetchingBalances && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-blue-400 text-sm">Loading token balances...</span>
              </div>
            </div>
          )}

          {/* Canister Error Message */}
          {canisterError && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-red-400 text-sm">{canisterError}</span>
                </div>
                <button
                  onClick={() => {
                    resetCanisterError();
                    fetchAllBalances(true); // Force retry
                  }}
                  className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-400 text-xs rounded transition-colors"
                  disabled={isFetchingBalances}
                >
                  {isFetchingBalances ? 'Retrying...' : 'Retry'}
                </button>
              </div>
            </div>
          )}

          {/* Token List */}
          <div className="space-y-2 mt-[10px]">
            {filteredTokens.length === 0 ? (
              // Show empty state when no tokens
              <div className="flex flex-col items-center justify-center py-8">
                <span className="text-white/50 text-sm">No tokens available</span>
              </div>
            ) : (
              // Show token list with individual loading states
              filteredTokens.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <img src={token.icon} alt={token.name} className="w-8 h-8" />
                    <div>
                      <div className="text-white font-medium flex flex-row">
                        {token.symbol}
                        {token.hasError && (
                          <div className="text-red-400 text-xs px-2">- Error fetching balance</div>
                        )}
                      </div>
                      <div className="text-white/50 text-sm">{token.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    {token.isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="text-white font-medium">{token.balance}</div>
                        <div className="text-white/50 text-sm">{token.usdValue}</div>
                      </>
                    )}
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

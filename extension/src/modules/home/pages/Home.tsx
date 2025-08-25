import { useState, useEffect, useCallback } from "react";
import TopLeft from "../../../assets/top_left.svg";
import TopRight from "../../../assets/top_right.svg";
import ProfileHeader from "../../../components/ui/header";
import bitoinIcon from "@/../public/assets/tokens/bitcoin.svg";
import ethIcon from "@/../public/assets/tokens/eth.svg";
import solanaIcon from "@/../public/assets/tokens/solana.svg";
import fumIcon from "@/../public/assets/tokens/fum.svg";
import { EyeClosedIcon, EyeIcon, MoveUpRight, MoveDownLeft, Search, Settings2 } from "lucide-react";
import { useWallet } from "@/lib/contexts/walletContext";
import { useAuth } from "@/lib/contexts/authContext";
import { useNetwork } from "@/modules/all_network/networkContext";
import type { WalletAddress } from "@/icp/services/backend_service";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";

// Service imports - using existing service files
import { getBitcoinBalances } from "@/icp/services/bitcoin_service";
import { getSolanaBalances } from "@/icp/services/solana_service";
import { getEthereumBalances } from "@/icp/services/ethereum_service";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
  isLoading?: boolean;
  hasError?: boolean;
}

interface TokenPrice {
  usd: number;
}

interface PriceResponse {
  [key: string]: TokenPrice;
}

// Token types - using const instead of enum to avoid syntax error
const TokenType = {
  BITCOIN: "Bitcoin",
  ETHEREUM: "Ethereum",
  SOLANA: "Solana",
  FUM: "Fradium",
  UNKNOWN: "Unknown",
} as const;

function Home() {
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [filteredTokens, setFilteredTokens] = useState<TokenBalance[]>([]);
  const [currentNetworkValue, setCurrentNetworkValue] = useState<string>("$0.00");
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [isBalancesLoading, setIsBalancesLoading] = useState(true);

  // New state for balance management - similar to asset-page.jsx
  const [tokenBalances, setTokenBalances] = useState<Record<string, { balances: Record<string, number>; errors: Record<string, string> }>>({});
  const [tokenAmountValues, setTokenAmountValues] = useState<Record<string, { amount: string; value: string; isLoading: boolean }>>({});

  const { userWallet, isLoading, hideBalance, setHideBalance, getNetworkValue, networkFilters, updateNetworkValues } = useWallet();

  // Get identity from auth context for authenticated balance fetching
  const { identity } = useAuth();
  const { selectedNetwork, getNetworkDisplayName, getNetworkTokenType } = useNetwork();
  const navigate = useNavigate();

  // Validate identity availability
  useEffect(() => {
    if (!identity) {
      console.warn("Home: No authenticated identity available - balance fetching will be limited");
    } else {
      console.log("Home: Authenticated identity available:", identity.getPrincipal().toText());
    }
  }, [identity]);

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

  // ================= BALANCE MANAGEMENT FUNCTIONS - Similar to asset-page.jsx =================

  // Get addresses for specific token type
  const getAddressesForToken = useCallback(
    (tokenType: string): string[] => {
      if (!userWallet?.addresses) return [];

      return userWallet.addresses
        .filter((addressObj) => {
          const addressTokenType = Object.keys(addressObj.token_type)[0];
          return addressTokenType === tokenType;
        })
        .map((addressObj) => addressObj.address);
    },
    [userWallet?.addresses]
  );

  // Get balances for specific token type - using existing service functions with identity
  const getBalance = useCallback(
    async (tokenType: string, addresses: string[]) => {
      const balances: Record<string, number> = {};
      const errors: Record<string, string> = {};

      try {
        switch (tokenType) {
          case TokenType.BITCOIN:
            const bitcoinResult = await getBitcoinBalances(addresses, identity);
            return bitcoinResult;

          case TokenType.SOLANA:
            const solanaResult = await getSolanaBalances(addresses, identity);
            return solanaResult;

          case TokenType.ETHEREUM:
            const ethereumResult = await getEthereumBalances(addresses);
            return ethereumResult;

          case TokenType.FUM:
            // Placeholder for FUM - not implemented yet
            for (const address of addresses) {
              balances[address] = 0;
            }
            return { balances, errors };

          default:
            for (const address of addresses) {
              balances[address] = 0;
            }
            return { balances, errors };
        }
      } catch (error) {
        console.error(`Error getting ${tokenType} balances:`, error);
        for (const address of addresses) {
          balances[address] = 0;
          errors[address] = error instanceof Error ? error.message : "Unknown error";
        }
        return { balances, errors };
      }
    },
    [identity]
  );

  // Helper function to convert base units to readable amounts
  const getAmountToken = useCallback((tokenType: string, baseAmount: number): string => {
    switch (tokenType) {
      case TokenType.BITCOIN:
        return (baseAmount / 100000000).toFixed(8).replace(/\.?0+$/, "");
      case TokenType.SOLANA:
        return (baseAmount / 1000000000).toFixed(9).replace(/\.?0+$/, "");
      case TokenType.ETHEREUM:
      case TokenType.FUM:
        return (baseAmount / 1e18).toFixed(18).replace(/\.?0+$/, "");
      default:
        return baseAmount.toString();
    }
  }, []);

  // Helper function to get USD price for token amount
  const getPriceUSD = useCallback(
    async (tokenType: string, baseAmount: number): Promise<string> => {
      try {
        const amount = getAmountToken(tokenType, baseAmount);
        const numericAmount = parseFloat(amount) || 0;

        let price = 0;
        switch (tokenType) {
          case TokenType.BITCOIN:
            price = tokenPrices.Bitcoin || 0;
            break;
          case TokenType.ETHEREUM:
            price = tokenPrices.Ethereum || 0;
            break;
          case TokenType.SOLANA:
            price = tokenPrices.Solana || 0;
            break;
          case TokenType.FUM:
            price = tokenPrices.Fradium || 0;
            break;
          default:
            price = 0;
        }

        const usdValue = numericAmount * price;
        return `$${usdValue.toFixed(2)}`;
      } catch (error) {
        console.error(`Error calculating USD price for ${tokenType}:`, error);
        return "$0.00";
      }
    },
    [tokenPrices, getAmountToken]
  );

  // Fetch all balances - similar to asset-page.jsx
  const fetchAllBalances = useCallback(async () => {
    if (!userWallet?.addresses) return;

    // Validate identity is available for authenticated calls
    if (!identity) {
      console.error("Home: No identity available - cannot fetch authenticated balances");
      setIsBalancesLoading(false);
      return;
    }

    console.log("Home: Starting to fetch all balances...");
    console.log("Home: Using identity:", `Authenticated (${identity.getPrincipal().toText()})`);
    setIsBalancesLoading(true);

    const supportedTokens = [TokenType.BITCOIN, TokenType.ETHEREUM, TokenType.SOLANA, TokenType.FUM];

    try {
      for (const tokenType of supportedTokens) {
        if (networkFilters[tokenType as keyof typeof networkFilters]) {
          const addresses = getAddressesForToken(tokenType);

          if (addresses.length > 0) {
            try {
              console.log(`Home: Fetching ${tokenType} balances for addresses:`, addresses);
              console.log(`Home: ${tokenType} - Using identity: Authenticated (${identity.getPrincipal().toText()})`);

              // Special handling for Solana to ensure authenticated calls
              if (tokenType === TokenType.SOLANA) {
                console.log(`Home: Solana - Ensuring authenticated identity for canister calls`);
              }

              const balanceResult = await getBalance(tokenType, addresses);

              setTokenBalances((prev) => ({
                ...prev,
                [tokenType]: balanceResult,
              }));

              const totalAmountInToken = Object.values(balanceResult.balances).reduce((sum, v) => sum + v, 0);

              // Get readable amount and USD value
              const amount = getAmountToken(tokenType, totalAmountInToken);
              const value = await getPriceUSD(tokenType, totalAmountInToken);

              // Validate amount and value before saving
              const finalAmount = amount && amount !== "0" ? amount : "0";
              const finalValue = value && value !== "$NaN" && value !== "$0.00" ? value : "$0.00";

              const amountValueResult = {
                amount: finalAmount,
                value: finalValue,
                isLoading: false,
              };

              setTokenAmountValues((prev) => ({
                ...prev,
                [tokenType]: amountValueResult,
              }));

              console.log(`Home: ${tokenType} - Amount: ${finalAmount}, Value: ${finalValue}`);
            } catch (error) {
              console.error(`Error fetching ${tokenType} data:`, error);

              // Special error handling for Solana authentication issues
              if (tokenType === TokenType.SOLANA && error instanceof Error) {
                if (error.message.includes("anonymous principal is not allowed") || error.message.includes("requires authenticated identity")) {
                  console.error(`Home: Solana authentication error - this should not happen with proper identity`);
                }
              }
            }
          } else {
            // No addresses for this token type
            setTokenBalances((prev) => ({
              ...prev,
              [tokenType]: { balances: {}, errors: {} },
            }));
            setTokenAmountValues((prev) => ({
              ...prev,
              [tokenType]: { amount: "0", value: "$0.00", isLoading: false },
            }));
          }
        }
      }
    } finally {
      setIsBalancesLoading(false);
      console.log("Home: Finished fetching all balances");
    }
  }, [userWallet?.addresses, networkFilters, getAddressesForToken, getBalance, getAmountToken, getPriceUSD, identity]);

  // Get total portfolio value
  const getTotalPortfolioValue = useCallback((): number => {
    let total = 0;

    for (const tokenType in tokenAmountValues) {
      const amountValue = tokenAmountValues[tokenType];
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        total += numericValue;
      }
    }

    return total;
  }, [tokenAmountValues]);

  // Update network values when token amounts change
  useEffect(() => {
    const networkValues = {
      "All Networks": getTotalPortfolioValue(),
      Bitcoin: 0,
      Ethereum: 0,
      Solana: 0,
      Fradium: 0,
    };

    for (const [tokenType, amountValue] of Object.entries(tokenAmountValues)) {
      if (amountValue?.value && typeof amountValue.value === "string") {
        const numericValue = parseFloat(amountValue.value.replace("$", "").replace(",", "")) || 0;
        networkValues[tokenType as keyof typeof networkValues] = numericValue;
      }
    }

    console.log("Home: Updating network values:", networkValues);
    updateNetworkValues(networkValues);
  }, [tokenAmountValues, updateNetworkValues, getTotalPortfolioValue]);

  // Fetch current token prices from CoinGecko
  const fetchTokenPrices = useCallback(async () => {
    try {
      console.log("Home: Fetching token prices...");
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd");
      const data: PriceResponse = await response.json();

      const prices = {
        Bitcoin: data.bitcoin?.usd || 0,
        Ethereum: data.ethereum?.usd || 0,
        Solana: data.solana?.usd || 0,
        Fradium: 1.0, // Placeholder price for Fradium
      };

      console.log("Home: Token prices fetched:", prices);
      setTokenPrices(prices);
    } catch (error) {
      console.error("Home: Error fetching token prices:", error);
      // Set default prices if API fails
      setTokenPrices({
        Bitcoin: 45000,
        Ethereum: 3000,
        Solana: 100,
        Fradium: 1.0,
      });
    }
  }, []);

  // Load wallet data from the wallet context - Updated to use new balance system
  const loadWalletData = useCallback(async () => {
    if (!userWallet || !userWallet.addresses) {
      setTokens([]);
      return;
    }

    console.log("Home: Loading wallet data for addresses:", userWallet.addresses);

    // Create token balances based on wallet addresses
    const walletTokens: TokenBalance[] = [];

    userWallet.addresses.forEach((addr: WalletAddress) => {
      let symbol = "";
      let name = "";
      let icon = "";
      let isEnabled = false;

      if ("Bitcoin" in addr.token_type) {
        symbol = "BTC";
        name = "Bitcoin";
        icon = bitoinIcon;
        isEnabled = networkFilters?.Bitcoin ?? true;
      } else if ("Ethereum" in addr.token_type) {
        symbol = "ETH";
        name = "Ethereum";
        icon = ethIcon;
        isEnabled = networkFilters?.Ethereum ?? true;
      } else if ("Solana" in addr.token_type) {
        symbol = "SOL";
        name = "Solana";
        icon = solanaIcon;
        isEnabled = networkFilters?.Solana ?? true;
      } else if ("Fradium" in addr.token_type) {
        symbol = "FUM";
        name = "Fradium";
        icon = fumIcon;
        isEnabled = networkFilters?.Fradium ?? true;
      }

      // Only add token if the network is enabled
      if (symbol && isEnabled) {
        const amountValueResult = tokenAmountValues[name] || { amount: "0", value: "$0.00", isLoading: false };
        const balanceResult = tokenBalances[name] || { balances: {}, errors: {} };

        const isTokenLoading = amountValueResult.isLoading || isBalancesLoading;
        const hasError = Object.keys(balanceResult.errors || {}).length > 0;

        console.log(`Home: ${name} - Amount: ${amountValueResult.amount}, Value: ${amountValueResult.value}, Loading: ${isTokenLoading}, HasError: ${hasError}`);

        walletTokens.push({
          symbol,
          name,
          balance: amountValueResult.amount || "0",
          usdValue: amountValueResult.value || "$0.00",
          icon,
          isLoading: isTokenLoading,
          hasError,
        });
      }
    });

    setTokens(walletTokens);
  }, [userWallet, tokenAmountValues, tokenBalances, networkFilters, isBalancesLoading]);

  // Fetch token prices on component mount
  useEffect(() => {
    fetchTokenPrices();
  }, [fetchTokenPrices]);

  // Fetch balances when wallet is available and prices are loaded
  useEffect(() => {
    if (userWallet && !isLoading && Object.keys(tokenPrices).length > 0 && identity) {
      console.log("Home: Starting balance fetch with authenticated identity...");
      fetchAllBalances();
    }
  }, [userWallet, isLoading, tokenPrices, fetchAllBalances, identity]);

  // Load wallet data when balances change
  useEffect(() => {
    if (userWallet && Object.keys(tokenAmountValues).length > 0) {
      loadWalletData();
    }
  }, [userWallet, tokenAmountValues, loadWalletData]);

  // Filter tokens and calculate network value based on selected network
  useEffect(() => {
    const filterTokensAndCalculateValue = () => {
      if (selectedNetwork === "all") {
        setFilteredTokens(tokens);
        setCurrentNetworkValue(getNetworkValue("All Networks"));
      } else {
        const networkType = getNetworkTokenType(selectedNetwork);
        const filtered = tokens.filter((token) => token.name === networkType);
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
                <span className="text-white text-4xl font-bold">{hideBalance ? "••••" : currentNetworkValue}</span>

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
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#9BE4A0]">Loading wallet...</span>
                </div>
              ) : isBalancesLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-[#9BE4A0] my-2">Fetching balances...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 my-2">{identity && <span className="text-xs text-[#9BE4A0]/70">Authenticated as : {identity.getPrincipal().toText().slice(0, 8)}...</span>}</div>
              )}

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
                        className="
                        w-[50px] h-[45px] flex items-center 
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E39E]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0
                        active:translate-y-0 active:translate-x-0
                        transition-transform duration-150 ease-in-out">
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
                        className="
                        w-[50px] h-[45px] flex items-center 
                        justify-center gap-2
                        font-bold text-white
                        bg-[#99E4A0]
                        border-2 border-gray-800
                        transform -translate-y-1 translate-x-1
                        hover:-translate-y-0 hover:translate-x-0
                        active:translate-y-0 active:translate-x-0
                        transition-transform duration-150 ease-in-out">
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
                <div key={token.symbol} className="flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <img src={token.icon} alt={token.name} className="w-8 h-8" />
                    <div>
                      <div className="text-white font-medium flex flex-row">
                        {token.symbol}
                        {/* {token.hasError && (
                          <div className="text-red-400 text-xs px-2">- Error fetching balance</div>
                        )} */}
                      </div>

                      <div className="text-white/50 text-sm">{token.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-white font-medium">{token.isLoading ? <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div> : token.balance}</div>
                    <div className="text-white/50 text-sm">{token.isLoading ? <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div> : token.usdValue}</div>
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

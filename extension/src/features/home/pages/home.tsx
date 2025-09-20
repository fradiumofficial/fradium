// Icons replaced with CDN assets to match design
import { CDN } from "~lib/constant/cdn";
import React, { useMemo, useCallback, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useWallet } from "~lib/context/walletContext";
import { useNetwork } from "~features/network/context/networkContext";
import { Search, Settings2 } from "lucide-react";
import AllNetwork from "~features/network/pages/all_network";

function Home() {
  const {
    balances,
    balanceLoading,
    balanceErrors,
    isRefreshingBalances,
    refreshAllBalances,
    usdPrices,
    usdPriceLoading,
    usdPriceErrors,
    hideBalance,
    extensionTokens,
    networkFilters,
    isAuthenticated,
    walletActor,
    fetchAllBalances,
    fetchAllUSDPrices,
    fetchWalletAddresses
  } = useWallet() as any;

  const { selectedNetwork } = useNetwork();
  const navigate = useNavigate();

  // Search functionality state
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Dropdown and settings state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [hideZeroValue, setHideZeroValue] = useState(false);
  const [isNetworkPopupOpen, setIsNetworkPopupOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter tokens based on selected network, network filters, and search query
  const filteredTokens = useMemo(() => {
    let tokens = extensionTokens;

    // First filter by network selection
    if (selectedNetwork === "all") {
      // When "all" is selected, filter based on networkFilters
      tokens = tokens.filter(token => {
        switch (token.networkKey) {
          case "btc": return networkFilters?.Bitcoin ?? true;
          case "eth": return networkFilters?.Ethereum ?? true;
          case "sol": return networkFilters?.Solana ?? true;
          case "fra": return networkFilters?.Fradium ?? true;
          case "icp": return networkFilters?.ICP ?? true;
          case "ckbtc": return networkFilters?.ckBTC ?? true;
          case "cketh": return networkFilters?.ckETH ?? true;
          default: return true;
        }
      });
    } else {
      // Filter by selected network
      const networkMap = {
        btc: "btc",
        eth: "eth",
        sol: "sol",
        fra: "fra",
        icp: "icp",
        ckbtc: "ckbtc",
        cketh: "cketh"
      };

      const targetNetwork = networkMap[selectedNetwork as keyof typeof networkMap];
      if (targetNetwork) {
        // Check if the selected network is enabled in filters
        const isNetworkEnabled = (() => {
          switch (selectedNetwork) {
            case "btc": return networkFilters?.Bitcoin ?? true;
            case "eth": return networkFilters?.Ethereum ?? true;
            case "sol": return networkFilters?.Solana ?? true;
            case "fra": return networkFilters?.Fradium ?? true;
            case "icp": return networkFilters?.ICP ?? true;
            case "ckbtc": return networkFilters?.ckBTC ?? true;
            case "cketh": return networkFilters?.ckETH ?? true;
            default: return true;
          }
        })();

        if (!isNetworkEnabled) return [];
        tokens = tokens.filter(token => token.networkKey === targetNetwork);
      }
    }

    // Then filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      tokens = tokens.filter(token =>
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query)
      );
    }

    // Filter by hide zero value setting
    if (hideZeroValue) {
      tokens = tokens.filter(token => {
        const balance = balances[token.id] || "0";
        const numericBalance = parseFloat(balance);
        return numericBalance > 0;
      });
    }

    return tokens;
  }, [selectedNetwork, extensionTokens, networkFilters, searchQuery, hideZeroValue, balances]);

  // Debug logging untuk melihat tokens yang tersedia
  console.log("Extension Tokens:", extensionTokens);
  console.log("Selected Network:", selectedNetwork);
  console.log("Filtered Tokens:", filteredTokens);

  // Total USD across filtered tokens using balances and usdPrices
  const totalUsd = useMemo(() => {
    try {
      return (filteredTokens || []).reduce((sum: number, token: any) => {
        const balanceStr = balances?.[token.id] ?? "0";
        const price = usdPrices?.[token.id] ?? 0;
        const qty = parseFloat(balanceStr);
        if (!isFinite(qty) || qty <= 0 || !isFinite(price) || price <= 0) return sum;
        return sum + qty * price;
      }, 0);
    } catch {
      return 0;
    }
  }, [filteredTokens, balances, usdPrices]);

  // Helper function to format balance display per token (ETH uses up to 6 decimals, trim zeros)
  const formatTokenBalance = useCallback((tokenId: string, balance: string) => {
    if (hideBalance) return "••••";

    const numericBalance = parseFloat(balance);
    if (!isFinite(numericBalance)) return "0.00";
    if (numericBalance === 0) return "0.00";

    const smallThreshold = 0.000001; // 1e-6
    const maxFrac = tokenId === "ethereum" ? 6 : 4;

    if (numericBalance < smallThreshold) {
      const th = smallThreshold.toLocaleString("en-US", { maximumFractionDigits: maxFrac });
      return `<${th}`;
    }

    return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(numericBalance);
  }, [hideBalance]);

  // Helper function to format USD value
  const formatUSDValue = useCallback((tokenId: string, balance: string) => {
    if (hideBalance) return "••••";

    const usdPrice = usdPrices[tokenId];
    const isPriceLoading = usdPriceLoading[tokenId];
    const hasPriceError = usdPriceErrors[tokenId];

    if (isPriceLoading || hasPriceError || !usdPrice) {
      return "$0.00";
    }

    const numericBalance = parseFloat(balance);
    if (isNaN(numericBalance) || numericBalance === 0) {
      return "$0.00";
    }

    const usdValue = numericBalance * usdPrice;

    // Format USD value
    if (usdValue < 0.01) return "<$0.01";
    if (usdValue < 1) return `$${usdValue.toFixed(4)}`;
    if (usdValue < 1000) return `$${usdValue.toFixed(2)}`;
    return `$${usdValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }, [usdPrices, usdPriceLoading, usdPriceErrors, hideBalance]);

  // Navigation handlers
  const handleReceiveClick = () => {
    navigate(ROUTES.RECEIVE);
  };
  const handleSendClick = () => {
    navigate(ROUTES.SEND);
  };

  // Search handlers
  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded) {
      // Clear search when collapsing
      setSearchQuery("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsSearchExpanded(false);
      setSearchQuery("");
    }
  };

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchExpanded(false);
        setSearchQuery("");
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchExpanded]);

  // Dropdown handlers
  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleHideZeroValueToggle = () => {
    setHideZeroValue(!hideZeroValue);
    setIsDropdownOpen(false);
  };

  const handleManageNetwork = () => {
    setIsNetworkPopupOpen(true);
    setIsDropdownOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Retry balance fetching for a specific token
  const handleRetryBalance = useCallback((tokenId: string) => {
    // This will trigger a refresh of all balances
    refreshAllBalances();
  }, [refreshAllBalances]);

  // Determine if any token balance is currently loading
  const isAnyBalanceLoading = useMemo(() => {
    return (extensionTokens || []).some((t: any) => balanceLoading?.[t.id]);
  }, [extensionTokens, balanceLoading]);

  // Detect initial loading before first balances arrive from canisters
  const hasAnyBalanceLoaded = useMemo(() => {
    return (extensionTokens || []).some((t: any) => balances?.[t.id] !== undefined);
  }, [extensionTokens, balances]);

  const isInitialLoading = useMemo(() => {
    return !hasAnyBalanceLoaded && (isAnyBalanceLoading || isRefreshingBalances);
  }, [hasAnyBalanceLoaded, isAnyBalanceLoading, isRefreshingBalances]);

  // Kick off initial fetches when authenticated actor is ready and nothing has loaded yet
  React.useEffect(() => {
    if (!isAuthenticated || !walletActor) return;

    const anyLoaded = (extensionTokens || []).some((t: any) => balances?.[t.id] !== undefined);
    const anyLoading = (extensionTokens || []).some((t: any) => balanceLoading?.[t.id]);

    if (!anyLoaded && !anyLoading) {
      // Fire in parallel, context functions already handle per-token loading state
      Promise.allSettled([
        fetchWalletAddresses?.(),
        fetchAllBalances?.(),
        fetchAllUSDPrices?.(),
      ]).catch(() => {});
    }
  }, [isAuthenticated, walletActor, extensionTokens, balances, balanceLoading, fetchWalletAddresses, fetchAllBalances, fetchAllUSDPrices]);

  const getNetworkSubtitle = useCallback((token: any) => {
    switch ((token?.symbol || "").toUpperCase()) {
      case "BTC":
        return "Bitcoin";
      case "ETH":
        return "Ethereum";
      case "FUM":
        return "Internet Computer";
      case "ICP":
        return "Internet Computer";
      case "CKBTC":
        return "Internet Computer";
      case "CKETH":
        return "Internet Computer";
      default:
        return token?.name || "";
    }
  }, []);

  // Calculate USD breakdown for currently filtered tokens
  const usdBreakdown = useMemo(() => {
    const breakdown = (filteredTokens || []).map(token => {
      const balance = balances[token.id] || "0";
      const usdPrice = usdPrices[token.id];
      const numericBalance = parseFloat(balance);

      if (!usdPrice || isNaN(numericBalance) || numericBalance === 0) {
        return {
          symbol: token.symbol,
          usdValue: 0,
          percentage: 0
        };
      }

      const usdValue = numericBalance * usdPrice;
      return {
        symbol: token.symbol,
        usdValue,
        percentage: 0 // Will be calculated after total
      };
    });

    // Calculate total and percentages
    const totalUSD = breakdown.reduce((sum, item) => sum + item.usdValue, 0);

    // Debug logging for USD breakdown
    console.log("USD Breakdown:", breakdown);
    console.log("Total USD:", totalUSD);

    return breakdown.map(item => ({
      ...item,
      percentage: totalUSD > 0 ? (item.usdValue / totalUSD) * 100 : 0
    }));
  }, [filteredTokens, balances, usdPrices]);

  // Format USD value for display
  const formatUSDDisplay = useCallback((value: number) => {
    if (hideBalance) return "••••";

    if (value === 0) return "$0.00";
    if (value < 0.01) return "<$0.01";
    if (value < 1) return `$${value.toFixed(4)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  }, [hideBalance]);

  return (
    <div className="w-[375px] text-white shadow-md overflow-hidden">
      {/* Content Container */}
      <div className="flex flex-col items-start p-[20px_20px_16px] gap-3 w-[375px] h-[224px] flex-none order-2 flex-grow-0 z-[2]">
        {/* Card */}
        <div className="box-border flex flex-col items-center p-[20px_16px_16px] gap-5 w-[335px] h-[188px] bg-gradient-to-br from-[#7C72FE] via-[#5A52C6] via-[#534BBA] to-[#433BA6] shadow-[0px_0px_0px_1px_#7C77C4,0px_5px_18px_-4px_rgba(74,66,170,0.6)] rounded-[28px] flex-none order-0 self-stretch flex-grow-0">
          {/* Text Section */}
          <div className="flex flex-col items-center p-0 gap-[10px] w-full h-[87px] flex-none order-0 flex-grow-0">
            {/* Total Portfolio Value */}
            <div className="w-[135px] h-[21px] font-['General Sans'] font-medium text-[14px] leading-[150%] flex items-center letter-[-0.01em] text-white flex-none order-0 flex-grow-0">
              Total Portfolio Value
            </div>
            
            {/* Amount and Breakdown */}
            <div className="flex flex-col items-center p-0 gap-[4px] w-full h-[60px] flex-none order-1 flex-grow-0">
              {/* Total USD Amount based on balances */}
              <div className="w-full h-8 font-['General Sans'] font-semibold text-[32px] leading-8 flex items-center justify-center text-white flex-none order-0 flex-grow-0 text-center">
                {isInitialLoading ? (
                  <span className="inline-block w-[160px] h-7 rounded bg-white/20 animate-pulse" />
                ) : (
                  hideBalance ? "••••" : formatUSDDisplay(totalUsd)
                )}
              </div>

              {/* USD Breakdown */}
              <div className="flex flex-row items-center justify-center gap-2 w-full flex-none order-1 flex-grow-0 text-center">
                {isInitialLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-3 bg-white/15 rounded animate-pulse" />
                    <span className="w-12 h-3 bg-white/15 rounded animate-pulse" />
                    <span className="w-1 h-1 bg-white/15 rounded" />
                    <span className="w-8 h-3 bg-white/15 rounded animate-pulse" />
                    <span className="w-12 h-3 bg-white/15 rounded animate-pulse" />
                  </div>
                ) : (
                  (() => {
                    const tokensWithValue = usdBreakdown.filter(item => item.usdValue > 0);
                    return tokensWithValue.length > 0 ? (
                      tokensWithValue
                        .slice(0, 3) // Show max 3 tokens
                        .map((item, index) => (
                          <div key={item.symbol} className="flex items-center gap-1">
                            <span className="font-['General Sans'] font-medium text-[10px] leading-tight text-white/80">
                              {item.symbol}
                            </span>
                            <span className="font-['General Sans'] font-semibold text-[10px] leading-tight text-white">
                              {formatUSDDisplay(item.usdValue)}
                            </span>
                            {index < Math.min(tokensWithValue.length, 3) - 1 && (
                              <span className="text-white/60 text-[8px]">•</span>
                            )}
                          </div>
                        ))
                    ) : (
                      <span className="font-['General Sans'] font-medium text-[10px] leading-tight text-white/70">
                        Add funds to get started
                      </span>
                    );
                  })()
                )}
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
      <div className="box-border flex flex-col items-start p-[12px_20px_20px] gap-2 w-[375px] flex-none order-3 self-stretch flex-grow-0 z-[3]">
        {/* Header */}
        <div className="flex flex-col w-full gap-3">
          {/* Title and Icons Row */}
          <div className="flex flex-row items-center justify-between w-full">
            {/* Tokens Title */}
            <div className="h-6 font-['General Sans'] font-semibold text-[16px] flex items-center text-white">
              Tokens
            </div>

            {/* Icon Section */}
            <div className="flex flex-row items-center gap-3 h-5">
              <button
                onClick={handleSearchToggle}
                disabled={isRefreshingBalances}
                className={`${
                  isRefreshingBalances
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                } transition-colors`}
                title={isSearchExpanded ? "Close search" : "Search tokens"}
              >
                <Search className="w-5 h-5 text-white" />
              </button>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleDropdownToggle}
                  disabled={isRefreshingBalances}
                  className={`${
                    isRefreshingBalances
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-white/10 cursor-pointer'
                  }`}
                  title={isRefreshingBalances ? "Please wait..." : "Settings"}
                >
                  <Settings2 className="w-5 h-5 text-white" />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 top-8 w-48 bg-white/10 backdrop-blur-[16px] border border-white/15 rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.55)] z-50">
                    <div className="py-2">
                      {/* Hide Zero Value Option */}
                      <button
                        onClick={handleHideZeroValueToggle}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          hideZeroValue ? 'bg-[#37C058] border-[#37C058]' : 'border-white/40'
                        }`}>
                          {hideZeroValue && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm">Hide Zero Value</span>
                      </button>

                      {/* Manage Network Option */}
                      <button
                        onClick={handleManageNetwork}
                        className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        <span className="text-sm">Manage Network</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => refreshAllBalances()}
                disabled={isRefreshingBalances}
                className={`${
                  isRefreshingBalances
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/10 cursor-pointer'
                }`}
                title={isRefreshingBalances ? "Loading balances..." : "Refresh balances"}
              >
                <img src={CDN.icons.refresh} alt="Refresh" className={`w-5 h-5 ${isRefreshingBalances ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expandable Search Row */}
          <div
            ref={searchContainerRef}
            className={`flex flex-col gap-2 transition-all duration-300 ease-in-out overflow-hidden ${
              isSearchExpanded ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            <div className="relative w-full">
              <div className="w-full h-[44px] box-border flex flex-col items-start p-[12px_20px] gap-4 bg-white/5 border border-white/10 rounded-[99px]">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-white/60" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search tokens..."
                  className="w-full pl-6 pr-4 font-sans font-normal text-[14px] leading-[140%] text-white/60 bg-transparent border-none outline-none"
                  autoFocus={isSearchExpanded}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/60 hover:text-white transition-colors"
                    title="Clear search"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Count */}
            {searchQuery && (
              <div className="text-xs text-white/60">
                {filteredTokens.length} token{filteredTokens.length !== 1 ? 's' : ''} found
              </div>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex flex-col items-center p-0 gap-1 w-[335px] flex-none order-1 self-stretch flex-grow-0 overflow-y-auto">
          {/* Content */}
          <div className="flex flex-col items-start p-0 w-[335px] flex-none order-0 self-stretch flex-grow-0">
            {isInitialLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index}>
                  <div className="box-border flex flex-row justify-between items-center p-[12px_0px] gap-4 w-[335px] h-[69px]">
                    <div className="mx-auto flex flex-row items-center p-0 gap-4 w-[242px] h-[45px]">
                      <div className="w-10 h-10 rounded-full bg-white/10 animate-pulse" />
                      <div className="flex flex-col items-start gap-2 w-[183px]">
                        <div className="w-24 h-4 bg-white/15 rounded animate-pulse" />
                        <div className="w-36 h-3 bg-white/10 rounded animate-pulse" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end p-0 pr-4 w-[80px] h-[45px]">
                      <div className="w-16 h-4 bg-white/15 rounded animate-pulse" />
                      <div className="w-12 h-3 bg-white/10 rounded mt-2 animate-pulse" />
                    </div>
                  </div>
                  {index < 3 && (
                    <div className="w-[335px] h-0 border border-white/10" />
                  )}
                </div>
              ))
            ) : (
            filteredTokens.map((token, index) => {
              const balance = balances[token.id] || "0.000000";
              const isLoading = balanceLoading[token.id];
              const hasError = balanceErrors[token.id];
              const usdValue = formatUSDValue(token.id, balance);

              // Debug logging untuk setiap token
              console.log(`Token ${token.symbol}:`, {
                id: token.id,
                balance,
                isLoading,
                hasError,
                usdValue
              });

              return (
                <div key={token.id}>
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
                          <div className="h-6 font-['General Sans'] font-medium text-[16px] leading-[150%] flex items-center text-white flex-none order-0 flex-grow-0">
                            {token.symbol}
                          </div>
                          <div className="w-1 h-1 bg-white/50 rounded-full flex-none order-1 flex-grow-0"></div>
                          <div className="w-[150px] h-[21px] font-['General Sans'] font-normal text-[14px] leading-[150%] flex items-center text-white/50 flex-none order-2 flex-grow-0">
                            {token.name}
                          </div>
                        </div>

                        {/* Network Info */}
                        <div className="flex flex-row items-center p-0 gap-2 w-[183px] h-[21px] flex-none order-1 flex-grow-0">
                          <div className="font-['General Sans'] font-normal text-[14px] leading-[150%] text-white/50">
                            {getNetworkSubtitle(token)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="flex flex-col items-end p-0 pr-4 w-[80px] h-[45px] flex-none order-1 flex-grow-0">
                      {isLoading ? (
                        <div className="flex flex-col items-end gap-2">
                          <div className="w-16 h-4 bg-white/15 rounded animate-pulse"></div>
                          <div className="w-12 h-3 bg-white/10 rounded animate-pulse"></div>
                        </div>
                      ) : hasError ? (
                        <div className="flex flex-col items-end">
                          <div className="w-full h-6 font-['General Sans'] font-medium text-[12px] leading-[150%] flex items-end justify-end text-red-400 flex-none order-0 flex-grow-0">
                            Error
                          </div>
                          <div
                            className="w-full h-[21px] font-['General Sans'] font-medium text-[10px] leading-[150%] flex items-end justify-end text-red-300 flex-none order-1 flex-grow-0 cursor-pointer hover:text-red-200 transition-colors"
                            onClick={() => handleRetryBalance(token.id)}
                          >
                            Retry
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-full h-6 font-['General Sans'] font-medium text-[16px] leading-[150%] flex items-end justify-end text-white flex-none order-0 flex-grow-0">
                            {formatTokenBalance(token.id, balance)}
                          </div>
                          <div className="w-full h-[21px] font-['General Sans'] font-medium text-[14px] leading-[150%] flex items-end justify-end text-white/50 flex-none order-1 flex-grow-0">
                            {usdValue}
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
              );
            }))}
          </div>

        </div>
      </div>

      {/* Network Management Popup */}
      <AllNetwork
        isOpen={isNetworkPopupOpen}
        onClose={() => setIsNetworkPopupOpen(false)}
      />
    </div>
  );
}

export default Home;

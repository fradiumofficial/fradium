import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, CreditCard, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ButtonGreen from "@/core/components/ButtonGreen.jsx";
import { generateTransakUrl, validateTransakConfig, getSupportedCurrencies, TRANSAK_CONFIG } from "@/core/config/transak";
import { getTransakQuote, getTransakFiatCurrencies } from "@/core/services/transakService";
import { useWallet } from "@/core/providers/WalletProvider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/core/components/ui/DropdownMenu";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig";

const TransakModal = ({ isOpen, onClose }) => {
  const { addresses } = useWallet();
  const [selectedToken, setSelectedToken] = useState("ETH");
  const [selectedFiatCurrency, setSelectedFiatCurrency] = useState("USD");
  const [fiatAmount, setFiatAmount] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [transakUrl, setTransakUrl] = useState("");
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteDetails, setQuoteDetails] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [fiatCurrencies, setFiatCurrencies] = useState([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);

  // Map TOKENS_CONFIG to Transak format
  const tokenOptions = TOKENS_CONFIG.filter((token) => ["BTC", "ETH", "SOL"].includes(token.symbol)).map((token) => ({
    value: token.symbol,
    label: token.name,
    symbol: token.symbol,
    imageUrl: token.imageUrl,
    network: token.chain.toLowerCase(),
    id: token.id, // Add token ID for price lookup
  }));

  // Get wallet address based on selected token
  const getWalletAddress = () => {
    const token = tokenOptions.find((t) => t.value === selectedToken);
    if (!token) return "";

    switch (token.network) {
      case "bitcoin":
        return addresses?.bitcoin || "";
      case "ethereum":
        return addresses?.ethereum || "";
      case "solana":
        return addresses?.solana || "";
      default:
        return "";
    }
  };

  // Reset all state when modal is closed
  const resetModalState = () => {
    setSelectedToken("ETH");
    setSelectedFiatCurrency("USD");
    setFiatAmount("");
    setTokenAmount("");
    setTransakUrl("");
    setIsLoadingQuote(false);
    setQuoteDetails(null);
    setApiError(null);
    setFiatCurrencies([]);
    setIsLoadingCurrencies(false);
  };

  // Validate configuration on mount and handle scroll
  useEffect(() => {
    if (isOpen) {
      // Disable page scroll when modal is open
      document.body.style.overflow = "hidden";

      // Fetch fiat currencies when modal opens
      fetchFiatCurrencies();
    } else {
      // Re-enable page scroll when modal is closed
      document.body.style.overflow = "unset";

      // Reset all state when modal is closed
      resetModalState();
    }

    // Cleanup function to restore scroll when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Fetch supported fiat currencies
  const fetchFiatCurrencies = async () => {
    setIsLoadingCurrencies(true);
    try {
      const currencies = await getTransakFiatCurrencies();
      // Filter only popular and allowed currencies
      const filteredCurrencies = currencies.filter((currency) => currency.isPopular && currency.isAllowed);
      setFiatCurrencies(filteredCurrencies);
    } catch (error) {
      console.error("Error fetching fiat currencies:", error);
      // Fallback to USD if API fails
      setFiatCurrencies([{ symbol: "USD", name: "US Dollar", isPopular: true, isAllowed: true }]);
    } finally {
      setIsLoadingCurrencies(false);
    }
  };

  // Handle token amount input - REMOVED (token amount is now read-only)

  // Fetch quote from Transak API
  const fetchTransakQuote = async (fiatAmountValue, tokenSymbol, fiatCurrency = selectedFiatCurrency) => {
    if (!fiatAmountValue || Number(fiatAmountValue) <= 0) {
      setTokenAmount("");
      return;
    }

    const selectedTokenData = tokenOptions.find((t) => t.value === tokenSymbol);
    if (!selectedTokenData) {
      setTokenAmount("");
      return;
    }

    setIsLoadingQuote(true);
    setApiError(null);
    try {
      const quote = await getTransakQuote({
        fiatCurrency: fiatCurrency,
        cryptoCurrency: tokenSymbol,
        fiatAmount: Number(fiatAmountValue),
        network: selectedTokenData.network,
      });

      if (quote && quote.response && quote.response.cryptoAmount) {
        setTokenAmount(quote.response.cryptoAmount);
        setQuoteDetails(quote.response);
        setApiError(null);
      } else if (quote && quote.error) {
        // Store detailed error information
        const errorInfo = {
          statusCode: quote.error.statusCode,
          name: quote.error.name,
          message: quote.error.message,
          timestamp: new Date().toLocaleTimeString(),
        };
        setApiError(errorInfo);
        setTokenAmount("");
        setQuoteDetails(null);

        // Error message will be displayed in the UI, no toast needed
      } else {
        const errorInfo = {
          statusCode: "UNKNOWN",
          name: "API Error",
          message: "Unable to get quote from Transak",
          timestamp: new Date().toLocaleTimeString(),
        };
        setApiError(errorInfo);
        setTokenAmount("");
        setQuoteDetails(null);
        // Error message will be displayed in the UI, no toast needed
      }
    } catch (error) {
      console.error("Error fetching Transak quote:", error);

      // Check if it's a structured error from the API
      if (error.error) {
        const errorInfo = {
          statusCode: error.error.statusCode,
          name: error.error.name,
          message: error.error.message,
          timestamp: new Date().toLocaleTimeString(),
        };
        setApiError(errorInfo);
        setTokenAmount("");
        setQuoteDetails(null);
        // Error message will be displayed in the UI, no toast needed
      } else {
        // Handle network or other errors
        const errorInfo = {
          statusCode: "NETWORK_ERROR",
          name: "Network Error",
          message: error.message || "Failed to connect to Transak API",
          timestamp: new Date().toLocaleTimeString(),
        };
        setApiError(errorInfo);
        setTokenAmount("");
        setQuoteDetails(null);
        // Error message will be displayed in the UI, no toast needed
      }
    } finally {
      setIsLoadingQuote(false);
    }
  };

  // Handle USD amount input
  const handleFiatAmountChange = (value) => {
    // Handle empty input
    if (value === "" || value === null || value === undefined) {
      setFiatAmount("");
      setTokenAmount("");
      return;
    }

    // Remove leading zeros immediately while typing
    const cleanValue = value.replace(/^0+(?=\d)/, "") || "0";
    const numericValue = Number(cleanValue);

    // If the cleaned value is different from input, update the state
    if (cleanValue !== value) {
      setFiatAmount(cleanValue);
    } else {
      setFiatAmount(value);
    }

    // Fetch quote from Transak API
    fetchTransakQuote(cleanValue, selectedToken, selectedFiatCurrency);
  };

  // Clean input values on blur to remove leading zeros
  const handleFiatAmountBlur = () => {
    if (fiatAmount !== "" && fiatAmount !== 0) {
      setFiatAmount(Number(fiatAmount));
    }
  };

  // Recalculate token amount when selected token or fiat currency changes
  useEffect(() => {
    if (fiatAmount && Number(fiatAmount) > 0) {
      fetchTransakQuote(fiatAmount, selectedToken, selectedFiatCurrency);
    }
  }, [selectedToken, selectedFiatCurrency, fiatAmount]);

  // Generate Transak URL when parameters change
  useEffect(() => {
    const walletAddress = getWalletAddress();
    const token = tokenOptions.find((t) => t.value === selectedToken);
    if (walletAddress && selectedToken && fiatAmount && Number(fiatAmount) > 0 && token) {
      const url = generateTransakUrl(walletAddress, selectedToken, Number(fiatAmount), token.network, selectedFiatCurrency);
      setTransakUrl(url);
      console.log("Transak URL generated:", url);
    }
  }, [selectedToken, selectedFiatCurrency, fiatAmount, addresses]);

  const handleOpenTransak = () => {
    const walletAddress = getWalletAddress();

    if (!walletAddress) {
      return;
    }

    if (Number(fiatAmount) < 10) {
      return;
    }

    if (!transakUrl) {
      return;
    }

    // Open Transak in new window
    const width = 500;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    window.open(transakUrl, "Transak", `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`);
  };

  if (!isOpen) return null;

  const selectedTokenData = tokenOptions.find((t) => t.value === selectedToken);

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center pt-8 pl-4 pr-4 pb-4">
        <div className="relative w-full max-w-[500px] mx-auto my-8 bg-[#171A1C] rounded-2xl border border-white/10">
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors" onClick={onClose} aria-label="Close">
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center p-4 gap-4 h-auto">
            <div className="w-full text-center text-white text-lg font-medium">Buy Crypto</div>

            <div className="w-full rounded-xl bg-[#FFFFFF08] border-white/10 p-5">
              <div className="space-y-4">
                {/* Token Selection */}
                <div>
                  <label className="block text-white/90 text-[13px] font-medium mb-2">Select Cryptocurrency</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="w-full px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white text-left focus:outline-none focus:border-[#9BE4A0] transition-all flex items-center justify-between hover:border-white/20">
                        <div className="flex items-center gap-3">
                          <img src={selectedTokenData?.imageUrl} alt={selectedTokenData?.label} className="w-6 h-6 rounded-full" />
                          <div className="flex flex-col">
                            <span className="text-white font-medium">{selectedTokenData?.label}</span>
                            <span className="text-white/50 text-xs">{selectedTokenData?.symbol}</span>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-white/50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]" align="start">
                      {tokenOptions
                        .filter((token) => token.value !== selectedToken)
                        .map((token) => (
                          <DropdownMenuItem key={token.value} onClick={() => setSelectedToken(token.value)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                            <div className="flex items-center gap-3">
                              <img src={token.imageUrl} alt={token.label} className="w-6 h-6 rounded-full" />
                              <div className="flex flex-col">
                                <span className="font-medium">{token.label}</span>
                                <span className="text-white/50 text-xs">{token.symbol}</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Amount Input */}
                <div className="space-y-3">
                  {/* Fiat Amount with Currency Selector */}
                  <div>
                    <label className="block text-white/90 text-[13px] font-medium mb-2">Amount</label>
                    <div className="flex gap-2">
                      {/* Currency Selector */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white text-left focus:outline-none focus:border-[#9BE4A0] transition-all flex items-center gap-2 hover:border-white/20 min-w-[100px]">
                            <div className="flex items-center gap-3">
                              {(() => {
                                const selectedCurrency = fiatCurrencies.find((c) => c.symbol === selectedFiatCurrency);
                                return selectedCurrency?.icon ? <div className="w-4 h-4 flex-shrink-0 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: selectedCurrency.icon }} /> : <div className="w-4 h-4 bg-white/20 rounded-full flex-shrink-0"></div>;
                              })()}
                              <span className="text-sm font-medium">{selectedFiatCurrency}</span>
                            </div>
                            <ChevronDown className="w-4 h-4 text-white/50" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px] bg-[#161B22] border-white/10 rounded-xl max-h-[300px] overflow-y-auto z-[10000]" align="start">
                          {isLoadingCurrencies ? (
                            <div className="px-4 py-3 text-white/70 text-sm">Loading currencies...</div>
                          ) : (
                            fiatCurrencies.map((currency) => (
                              <DropdownMenuItem key={currency.symbol} onClick={() => setSelectedFiatCurrency(currency.symbol)} className="text-white hover:bg-white/5 cursor-pointer px-4 py-3 focus:bg-white/5">
                                <div className="flex items-center gap-3">
                                  {currency.icon ? <div className="w-4 h-4 flex-shrink-0 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: currency.icon }} /> : <div className="w-4 h-4 bg-white/20 rounded-full flex-shrink-0"></div>}
                                  <div className="flex flex-col">
                                    <span className="font-medium">{currency.symbol}</span>
                                    <span className="text-white/50 text-xs">{currency.name}</span>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Amount Input */}
                      <input type="number" value={fiatAmount} onChange={(e) => handleFiatAmountChange(e.target.value)} onBlur={handleFiatAmountBlur} min="0" max="10000" step="0.01" className="flex-1 px-4 py-3 bg-transparent border border-white/10 rounded-xl text-white placeholder-[#B0B6BE] focus:outline-none focus:ring-2 focus:ring-[#9BE4A0] focus:border-[#9BE4A0] transition-all" placeholder={`Enter ${selectedFiatCurrency} amount`} />
                    </div>
                  </div>

                  {/* Token Amount - Read Only */}
                  <div>
                    <label className="block text-white/90 text-[13px] font-medium mb-2">Estimated You will receive ({selectedTokenData?.symbol})</label>
                    <input type="text" value={isLoadingQuote ? "Fetching price..." : tokenAmount || "0"} readOnly className="w-full px-4 py-3 bg-[#FFFFFF08] border border-white/10 rounded-xl text-white/70 cursor-not-allowed" placeholder={`Estimated ${selectedTokenData?.symbol} amount`} />

                    {/* Fee Breakdown */}
                    {quoteDetails && quoteDetails.feeBreakdown && (
                      <div className="mt-3 p-3 bg-[#FFFFFF05] rounded-lg border border-white/5">
                        <div className="text-xs text-white/70 mb-2">Fee Breakdown:</div>
                        {quoteDetails.feeBreakdown.map((fee, index) => (
                          <div key={index} className="flex justify-between text-xs text-white/60 mb-1">
                            <span>{fee.name}</span>
                            <span>
                              {selectedFiatCurrency} {fee.value.toFixed(2)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-between text-xs text-white/90 font-medium mt-2 pt-2 border-t border-white/10">
                          <span>Total Fee</span>
                          <span>
                            {selectedFiatCurrency} {quoteDetails.totalFee.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-white/50 mt-1">
                          Conversion Rate: 1 {quoteDetails.fiatCurrency} = {quoteDetails.conversionPrice.toFixed(8)} {quoteDetails.cryptoCurrency}
                        </div>
                      </div>
                    )}

                    {/* API Error Display */}
                    {apiError && <div className="mt-2 text-xs text-red-400">{apiError.message}</div>}
                  </div>

                  <div className="text-xs text-[#B0B6BE]">
                    {quoteDetails && quoteDetails.totalFee > 0 && (
                      <span className="block mt-1 text-yellow-400">
                        ⚠️ Minimum amount should cover fees (~{selectedFiatCurrency} {quoteDetails.totalFee.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <ButtonGreen onClick={handleOpenTransak} disabled={!getWalletAddress() || !fiatAmount || Number(fiatAmount) < 10} fullWidth icon={<CreditCard className="w-4 h-4 text-black" />} textSize="text-sm">
                  Buy Now
                </ButtonGreen>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full px-2 sm:px-3 pb-2">
              <div className="text-xs text-[#B0B6BE] text-center">Powered by Transak</div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TransakModal;

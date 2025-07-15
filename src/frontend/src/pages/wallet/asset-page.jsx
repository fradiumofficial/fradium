import React from "react";
import { useWallet } from "@/core/providers/wallet-provider";
import NeoButton from "@/core/components/SidebarButton";
import { jsonStringify } from "../../core/lib/canisterUtils";
import { bitcoin } from "declarations/bitcoin";
import { satoshisToBTC, formatBTC, getBTCValueUSD, convertSatoshisToReadable, formatSatoshisToBTC, fetchBTCPrice } from "../../core/lib/bitcoinUtils";

// Token configuration mapping
const tokenConfig = {
  Bitcoin: {
    icon: "/assets/bitcoin.svg",
    name: "BTC",
    symbol: "Bitcoin",
    desc: "Bitcoin • Internet Computer",
  },
  Ethereum: {
    icon: "/assets/eth.svg",
    name: "ETH",
    symbol: "Ethereum",
    desc: "Ethereum • Internet Computer",
  },
  Solana: {
    icon: "/assets/solana.svg", // Assuming you have solana.svg
    name: "SOL",
    symbol: "Solana",
    desc: "Solana • Internet Computer",
  },
  // Add more token types as needed
};

export default function AssetsPage() {
  const { userWallet, network } = useWallet();
  const [tokenBalances, setTokenBalances] = React.useState({});
  const [isLoadingBalances, setIsLoadingBalances] = React.useState(false);
  const [balanceErrors, setBalanceErrors] = React.useState({});
  const [tokenPrices, setTokenPrices] = React.useState({});

  // Function to get token type from address object
  const getTokenType = (addressObj) => {
    if (addressObj.token_type?.Bitcoin == null) return "Bitcoin";
    if (addressObj.token_type?.Ethereum == null) return "Ethereum";
    if (addressObj.token_type?.Solana == null) return "Solana";
    return "Unknown";
  };

  // Function to check if address matches current network
  const isAddressForCurrentNetwork = (addressObj) => {
    const addressNetwork = addressObj.network?.Testnet == null ? "testnet" : "mainnet";
    return addressNetwork === network;
  };

  // Function to fetch Bitcoin balance for a single address
  const fetchBitcoinBalance = async (address) => {
    try {
      const balance = await bitcoin.get_balance(address);
      return Number(balance);
    } catch (error) {
      console.error(`Error fetching Bitcoin balance for ${address}:`, error);
      throw error;
    }
  };

  // Function to fetch balances for all Bitcoin addresses
  const fetchBitcoinBalances = async (addresses) => {
    const balances = {};
    const errors = {};

    for (const address of addresses) {
      try {
        const balance = await fetchBitcoinBalance(address);
        balances[address] = balance;
      } catch (error) {
        errors[address] = error.message || "Failed to fetch balance";
        balances[address] = 0;
      }
    }

    return { balances, errors };
  };

  // Function to calculate token amount and value based on token type
  const calculateTokenAmountAndValue = async (tokenType, addresses, balances) => {
    switch (tokenType) {
      case "Bitcoin":
        if (!balances || Object.keys(balances).length === 0) {
          return { amount: 0, value: "$0.00" };
        }

        // Calculate total satoshis
        const totalSatoshis = Object.values(balances).reduce((sum, balance) => sum + balance, 0);

        // Get current BTC price
        const btcPrice = await fetchBTCPrice();

        // Calculate BTC amount and USD value
        const btcAmount = satoshisToBTC(totalSatoshis);
        const usdValue = btcAmount * btcPrice;

        return {
          amount: totalSatoshis, // Keep as satoshis for formatting
          value: `$${usdValue.toFixed(2)}`,
        };

      case "Ethereum":
        // TODO: Implement Ethereum balance fetching
        // For now, return placeholder values
        return {
          amount: 0,
          value: "$0.00",
        };

      case "Solana":
        // TODO: Implement Solana balance fetching
        // For now, return placeholder values
        return {
          amount: 0,
          value: "$0.00",
        };

      default:
        return {
          amount: 0,
          value: "$0.00",
        };
    }
  };

  // Fetch balances when network or addresses change
  React.useEffect(() => {
    const fetchBalances = async () => {
      if (!userWallet?.addresses) return;

      const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);
      const bitcoinAddresses = networkAddresses.filter((addr) => getTokenType(addr) === "Bitcoin").map((addr) => addr.address);

      if (bitcoinAddresses.length === 0) {
        setTokenBalances({});
        setBalanceErrors({});
        return;
      }

      setIsLoadingBalances(true);
      setBalanceErrors({});

      try {
        const { balances, errors } = await fetchBitcoinBalances(bitcoinAddresses);

        setTokenBalances((prev) => ({
          ...prev,
          Bitcoin: balances,
        }));

        if (Object.keys(errors).length > 0) {
          setBalanceErrors((prev) => ({
            ...prev,
            Bitcoin: errors,
          }));
        }
      } catch (error) {
        console.error("Error fetching Bitcoin balances:", error);
      } finally {
        setIsLoadingBalances(false);
      }
    };

    fetchBalances();
  }, [userWallet?.addresses, network]);

  // Filter addresses by current network and group by token type
  const getTokensForCurrentNetwork = () => {
    if (!userWallet?.addresses) return [];

    const networkAddresses = userWallet.addresses.filter(isAddressForCurrentNetwork);

    // Group addresses by token type
    const tokenGroups = {};

    networkAddresses.forEach((addressObj) => {
      const tokenType = getTokenType(addressObj);

      if (!tokenGroups[tokenType]) {
        tokenGroups[tokenType] = {
          addresses: [],
          config: tokenConfig[tokenType] || {
            icon: "/assets/unknown.svg",
            name: tokenType.toUpperCase(),
            symbol: tokenType,
            desc: `${tokenType} • Internet Computer`,
          },
        };
      }

      tokenGroups[tokenType].addresses.push(addressObj.address);
    });

    // Convert to array format for rendering
    return Object.entries(tokenGroups).map(([tokenType, data]) => {
      const balances = tokenBalances[tokenType] || {};

      return {
        ...data.config,
        tokenType,
        addresses: data.addresses,
        balances: balances,
        isLoading: isLoadingBalances && tokenType === "Bitcoin",
        hasError: balanceErrors[tokenType] && Object.keys(balanceErrors[tokenType]).length > 0,
      };
    });
  };

  const tokens = getTokensForCurrentNetwork();

  return (
    <div className="flex flex-col gap-8 max-w-xl mx-auto w-full bg-[#0F1219]">
      {/* Card Wallet pakai gambar utuh */}
      <div className="relative items-center w-full mx-auto">
        <img src="/assets/cek-card-wallet.png" alt="Wallet Card" className="block w-full max-w-full h-auto select-none pointer-events-none" draggable="false" />
        {/* Overlay Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 pt-20 pb-8">
          <div className="text-white text-xs md:text-xs font-normal mb-1">Total Portofolio Value</div>
          <div className="text-white text-4xl md:text-4xl font-semibold mb-1">$0.00</div>
          <div className="text-green-400 text-sm font-medium mb-6 text-center">Top up your wallet to start using it!</div>
          <div className="flex gap-8 w-full max-w-lg justify-center">
            {/* Receive */}
            <div className="flex flex-col flex-1">
              <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                <div className="absolute top-4 right-4">
                  <NeoButton
                    icon={
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="2" width="11" height="11" fill="#0E1117" />
                      </svg>
                    }
                    className="!w-10 !h-10 p-0 flex items-center justify-center"
                  />
                </div>
                <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Receive</div>
              </div>
            </div>
            {/* Send */}
            <div className="flex flex-col flex-1">
              <div className="relative bg-[#23272F] h-36 w-full rounded-lg">
                <div className="absolute top-4 right-4">
                  <NeoButton
                    icon={
                      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask-send" maskUnits="userSpaceOnUse" x="0" y="0" width="15" height="15">
                          <rect x="0" y="0" width="15" height="15" fill="#fff" />
                        </mask>
                        <g mask="url(#mask-send)">
                          <path d="M12 3V10H10.8V5.8L3.5 13.1L2.9 12.5L10.2 5.2H5V3H12Z" fill="#0E1117" />
                        </g>
                      </svg>
                    }
                    className="!w-10 !h-10 p-0 flex items-center justify-center"
                  />
                </div>
                <div className="text-white text-lg font-semibold mt-24 ml-2 text-left">Send</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Token List */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Tokens ({network})</h2>
          <div className="flex gap-4">
            <img src="/assets/icons/search.svg" alt="Search" className="w-5 h-5 cursor-pointer" />
            <img src="/assets/icons/page_info.svg" alt="Setting" className="w-5 h-5 cursor-pointer" />
          </div>
        </div>
        <div className="flex flex-col divide-y divide-[#23272F]">
          {tokens.length > 0 ? (
            tokens.map((token, idx) => <TokenCard key={idx} token={token} calculateTokenAmountAndValue={calculateTokenAmountAndValue} />)
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="text-[#B0B6BE] text-sm mb-2">No tokens found for {network}</div>
                <div className="text-[#9BEB83] text-xs">Add addresses to see your tokens here</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Separate component for token card to handle async calculations
function TokenCard({ token, calculateTokenAmountAndValue }) {
  const [amount, setAmount] = React.useState(0);
  const [value, setValue] = React.useState("$0.00");
  const [isCalculating, setIsCalculating] = React.useState(false);

  React.useEffect(() => {
    const calculateAmountAndValue = async () => {
      if (!token.balances || Object.keys(token.balances).length === 0) {
        setAmount(0);
        setValue("$0.00");
        return;
      }

      setIsCalculating(true);
      try {
        const result = await calculateTokenAmountAndValue(token.tokenType, token.addresses, token.balances);
        setAmount(result.amount);
        setValue(result.value);
      } catch (error) {
        console.error(`Error calculating ${token.tokenType} amount and value:`, error);
        setAmount(0);
        setValue("$0.00");
      } finally {
        setIsCalculating(false);
      }
    };

    calculateAmountAndValue();
  }, [token.balances, token.tokenType, token.addresses, calculateTokenAmountAndValue]);

  return (
    <div className="flex items-center px-2 py-4 gap-4">
      <img src={token.icon} alt={token.name} className="w-10 h-10" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-semibold text-base">{token.name}</span>
          {token.symbol && <span className="text-[#B0B6BE] text-base">• {token.symbol}</span>}
        </div>
        <div className="text-[#B0B6BE] text-sm truncate">{token.desc}</div>
        {token.hasError && <div className="text-red-400 text-xs mt-1">Error fetching balance</div>}
      </div>
      <div className="flex flex-col items-end">
        {token.isLoading || isCalculating ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#9BEB83]"></div>
            <span className="text-[#B0B6BE] text-sm">Loading...</span>
          </div>
        ) : (
          <>
            <span className="text-white font-semibold text-base">{token.tokenType === "Bitcoin" ? formatSatoshisToBTC(amount) : amount}</span>
            <span className="text-[#B0B6BE] text-sm">{value}</span>
          </>
        )}
      </div>
    </div>
  );
}

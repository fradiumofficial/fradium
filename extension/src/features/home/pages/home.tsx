import { EyeClosedIcon, EyeIcon, MoveUpRight, MoveDownLeft, Search, Settings2 } from "lucide-react";
import ProfileHeader from "~components/header";
import { CDN } from "~lib/constant/cdn";
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useWallet } from "~lib/context/walletContext";
import { useNetwork } from "~features/network/context/networkContext";

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon: string;
  isLoading?: boolean;
  hasError?: boolean;
}

function Home() {
  const { getNetworkValue, principalText } = useWallet() as any
  const { selectedNetwork } = useNetwork();
  const [principal, setPrincipal] = useState<string | null>(null);
  const [hideBalance, setHideBalance] = useState(false);
  const [isBalancesLoading, setIsBalancesLoading] = useState(false);
  const navigate = useNavigate();
  const toggleVisibility = () => setHideBalance(!hideBalance);

  useEffect(() => {
    setPrincipal(principalText || null);
  }, [principalText]);

  // Mock token data - in real implementation, this would come from wallet context or API
  const allTokens: TokenBalance[] = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.bitcoin,
      isLoading: false,
      hasError: false
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.eth,
      isLoading: false,
      hasError: false
    },
    {
      symbol: "SOL",
      name: "Solana",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.solana,
      isLoading: false,
      hasError: false
    },
    {
      symbol: "FUM",
      name: "Fradium",
      balance: "0.0000",
      usdValue: "$0.00",
      icon: CDN.tokens.fum,
      isLoading: false,
      hasError: false
    }
  ];

  // Filter tokens based on selected network
  const filteredTokens = useMemo(() => {
    if (selectedNetwork === "all") {
      return allTokens;
    }

    const networkMap = {
      btc: "Bitcoin",
      eth: "Ethereum",
      sol: "Solana",
      fra: "Fradium"
    };

    const targetNetwork = networkMap[selectedNetwork as keyof typeof networkMap];
    if (!targetNetwork) return allTokens;

    return allTokens.filter(token => {
      // Map token symbols to network names for filtering
      const tokenNetworkMap = {
        BTC: "Bitcoin",
        ETH: "Ethereum",
        SOL: "Solana",
        FUM: "Fradium"
      };

      const tokenNetwork = tokenNetworkMap[token.symbol as keyof typeof tokenNetworkMap];
      return tokenNetwork === targetNetwork;
    });
  }, [selectedNetwork]);

  // Navigation handlers
  const handleAnalyzeAddress = () => navigate(ROUTES.ANALYZE_ADDRESS);
  const handleReceiveClick = () => navigate(ROUTES.RECEIVE);
  const handleSendClick = () => navigate(ROUTES.SEND);
  const handleAccountSettings = () => navigate(ROUTES.ACCOUNT);

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
              <button onClick={handleAnalyzeAddress} className="hover:bg-white/10 p-1 rounded">
                <Search />
              </button>
              <button onClick={handleAccountSettings} className="hover:bg-white/10 p-1 rounded">
                <Settings2 />
              </button>
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

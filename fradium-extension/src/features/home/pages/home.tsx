import { EyeClosedIcon, EyeIcon, MoveUpRight, MoveDownLeft, Search, Settings2 } from "lucide-react";
import ProfileHeader from "~components/header";
import { CDN } from "~lib/constant/cdn";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";


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
  const [hideBalance, setHideBalance] = useState(false);
  const navigate = useNavigate();
  const toggleVisibility = () => setHideBalance(!hideBalance);

  // Navigation handlers
  const handleAnalyzeAddress = () => navigate(ROUTES.ANALYZE_ADDRESS);
  const handleViewHistory = () => navigate(ROUTES.HISTORY);
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
                <span className="text-white text-4xl font-bold">{hideBalance ? "••••" : 449}</span>

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
              <div className="flex flex-col items-center justify-center gap-1 my-2"><span className="text-xs text-[#9BE4A0]/70">cy7jashlashdabmnnzz</span></div>

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
                          // handleReceiveClick();
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
                          // handleSendClick();
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
        </div>
      </div>

      {/* Navigation Section */}
      <div className="px-4 pb-4">
        <div className="bg-[#1F2025] rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleAnalyzeAddress}
              className="flex flex-col items-center p-3 bg-[#823EFD] hover:bg-[#7A37E5] rounded-lg transition-colors"
            >
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-white text-sm font-medium">Analyze Address</span>
            </button>
            <button
              onClick={handleViewHistory}
              className="flex flex-col items-center p-3 bg-[#823EFD] hover:bg-[#7A37E5] rounded-lg transition-colors"
            >
              <span className="text-2xl mb-1">📊</span>
              <span className="text-white text-sm font-medium">View History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

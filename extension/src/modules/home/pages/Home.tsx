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
import { useNavigate } from "react-router-dom";
import { getAnalysisHistory, type HistoryItem } from "@/lib/localStorage";
import { useWallet } from "@/lib/walletContext";
import { ROUTES } from "@/constants/routes";

function Home() {
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();
  const { 
    hideBalance, 
    setHideBalance, 
    getNetworkValue,
    isLoading 
  } = useWallet();

  const toggleVisibility = () => setHideBalance(!hideBalance);

  useEffect(() => {
    // Load recent history (maksimal 2 item terbaru)
    const loadRecentHistory = () => {
      const history = getAnalysisHistory();
      setRecentHistory(history.items.slice(0, 2)); // Ambil 2 item terbaru
    };

    loadRecentHistory();

    // Set up interval untuk refresh history setiap 5 detik (opsional)
    const interval = setInterval(loadRecentHistory, 5000);

    return () => clearInterval(interval);
  }, []);

  const getCategoryText = (item: HistoryItem) => {
    const typeText = item.analysisType === "icp" ? "AI Analysis" : "Community";
    const statusText = item.isSafe ? "Safe" : "Risky";
    return `${statusText} - ${typeText}`;
  };

  const handleWalletClick = () => {
    // Navigate to wallet home page
    navigate(ROUTES.WALLET_HOME);
  };

  const handleSendClick = () => {
    // Navigate to wallet home page for send functionality
    navigate(ROUTES.WALLET_HOME);
  };

  const handleReceiveClick = () => {
    // Navigate to wallet home page for receive functionality
    navigate(ROUTES.WALLET_HOME);
  };

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
                  {getNetworkValue("All Networks")}
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
              {isLoading && (
                <div className="flex items-center justify-center mt-2">
                  <div className="w-4 h-4 border-2 border-[#9BE4A0] border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-sm text-white/70">Loading wallet...</span>
                </div>
              )}
              
              <div className="flex flex-col items-center mt-1">
                <p className="text-[#9BE4A0]">+US$0 (+12.44%)</p>
              </div>
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
          <div className="flex flex-row justify-between mt-2">
            <div className="flex flex-col-1">
              <h1 className="text-[16px] font-semibold">Tokens</h1>
            </div>
            <div className="flex flex-col-2">
              <Search />
              <Settings2 />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;

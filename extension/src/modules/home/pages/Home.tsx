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

function Home() {
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);
  const toggleVisibility = () => setIsBalanceVisible(!isBalanceVisible);
  const [recentHistory, setRecentHistory] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();

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

  const handleTryWalletClick = () => {
    // Open Fradium Wallet page in new tab
    window.open(
      "https://t4sse-tyaaa-aaaae-qfduq-cai.icp0.io/products-wallet",
      "_blank"
    );
  };

  return (
    <div className="w-[375px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
      {/* Header Sections */}
      <ProfileHeader />

      <div className="flex flex-col items-center space-y-4">
        <div className="w-[327px] h-[215px] bg-[#1F2025]">
          <div className="flex flex-row justify-between">
            <img src={TopLeft} alt="Top Left" />
            <img src={TopRight} alt="Top Right" />
          </div>
          <div className="flex justify-center items-center">
            <div className="font-sans flex-col items-start">
              <div className="flex items-center justify-center">
                <span className="text-white text-4xl font-bold">$</span>
                {isBalanceVisible ? (
                  <span className="text-white text-4xl font-bold tracking-wider">
                    -----
                  </span>
                ) : (
                  <div
                    className="text-white text-4xl font-bold tracking-wider tracking-tighter"
                    aria-hidden="true"
                  >
                    400.01
                  </div>
                )}

                <button
                  onClick={toggleVisibility}
                  className="ml-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Toggle balance visibility"
                >
                  {isBalanceVisible ? <EyeClosedIcon /> : <EyeIcon />}
                </button>
              </div>

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
                        <MoveUpRight className="text-black"/>
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
                        <MoveDownLeft className="text-black"/>
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

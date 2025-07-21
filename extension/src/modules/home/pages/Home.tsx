import { useState, useEffect } from "react";
import topBarImage from "../../../assets/Illus.svg"
import NeoButton from "../../../components/ui/custom-button";
import AnalyzeAddress from "../../../assets/analyze_address.svg";
import AnalyzeContract from "../../../assets/analyze_contract.svg";
import Bitcoin from "../../../assets/bitcoin.svg";
import ProfileHeader from "../../../components/ui/header";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import HistoryCard from "@/components/ui/history-card";
import { getAnalysisHistory, type HistoryItem } from "@/lib/localStorage";

function Home() {
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
    const typeText = item.analysisType === 'icp' ? 'AI Analysis' : 'Community';
    const statusText = item.isSafe ? 'Safe' : 'Risky';
    return `${statusText} - ${typeText}`;
  };


  return (
     <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">

      { /* Header Sections */}
      <ProfileHeader />

      { /* Carousel Section */}
      <div className="bg-[#1F2128] m-4 flex items-center justify-center">
        <div className="flex flex-row w-full h-[194px] bg-radial-[at_100%_0%] from-[#96EA63]/10 via-[#0C101C] to-[#0C101C] to-90%">
          <div className="flex">
            <img src={topBarImage} alt="" className="w-auto h-[194px]" />
          </div>
          <div className="flex-2 flex items-center justify-left px-4">
            <div className="flex flex-col">
              <div className="bg-[#823EFD] w-[120px] mb-2">
                <button 
                className="
                w-full flex items-center 
                justify-center gap-2
                px-3 py-3
                font-bold text-white
                bg-[#99E39E]
                border-2 border-gray-800
                transform -translate-y-1 translate-x-1
                hover:-translate-y-0 hover:translate-x-0
                active:translate-y-0 active:translate-x-0
                transition-transform duration-150 ease-in-out
                ">
                  <div className="flex flex-row text-[#000510]">
                    Try Wallet
                  </div>
                  <div className="flex h-[16px] w-[16px] text-[#000510] text-center mb-2">
                    <ArrowRight />
                  </div>
                </button>
              </div>
              <div className="flex flex-col mt-4">
                <h1 className="text-white text-[16px]">Level up your Protection!</h1>
                <h1 className="text-white/70 text-[12px]">Get full protection with Fradium Wallet!</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      { /* Analyze and Scan Address Section */}
      <div className="flex flex-row m-4">
        <div className="basis-1/2 p-1">
          <NeoButton icon={AnalyzeContract} onClick={() => navigate(ROUTES.ANALYZE_SMART_CONTRACT)}> Analyze Contract 
          </NeoButton>
        </div>
        <div className="basis-1/2 p-1">
          <NeoButton icon={AnalyzeAddress} onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}> Analyze Address 
          </NeoButton>
        </div>
      </div>

      { /* History Section */}
      <div className="flex flex-row justify-between m-4">
        <h1 className="text-[16px] font-semibold">History</h1>
        <button className="text-[#99E39E] hover:text-white transition-transform duration-300 ease-in-out" onClick={() => navigate(ROUTES.HISTORY)}>View All</button>
      </div>

      <div className="flex flex-col items-center m-4">
        {recentHistory.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-white/50 text-sm">No analysis history yet</p>
            <p className="text-white/30 text-xs mt-1">Analyze an address to see it here</p>
          </div>
        ) : (
          recentHistory.map((item) => (
            <HistoryCard
              key={item.id}
              onClick={() => navigate(ROUTES.DETAIL_HISTORY.replace(':id', item.id))}
              icon={Bitcoin}
              address={item.address}
              category={getCategoryText(item)}
              date={item.date}
            />
          ))
        )}
      </div>

    </div>
  );
}

export default Home
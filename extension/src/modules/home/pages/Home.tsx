import { useState, useEffect } from "react";
import cryptoCards from "../model/CarouselDummyModel";
import topBarImage from "../../../assets/Illus.svg"
import NeoButton from "../../../components/ui/custom-button";
import AnalyzeAddress from "../../../assets/analyze_address.svg";
import AnalyzeContract from "../../../assets/analyze_contract.svg";
import Bitcoin from "../../../assets/bitcoin.svg";
import ProfileHeader from "../../../components/ui/header";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import HistoryCard from "@/components/ui/history-card";
import { getAnalysisHistory, type HistoryItem } from "@/lib/localStorage";

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
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

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? cryptoCards.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  }

  const nextSlide = () => {
    const isLastSlide = currentIndex === cryptoCards.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  }

  const currentCard = cryptoCards[currentIndex];
  const priceChangeColor = currentCard.change >= 0 ? 'text-green-500' : 'text-red-500';
  const priceChangeIcon = currentCard.change >= 0 ? '+' : '';
  return (
     <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">

      { /* Header Sections */}
      <ProfileHeader />

      { /* Carousel Section */}
      <div className="bg-[#1F2128] m-4 flex items-center justify-center">
        <div className="w-full h-[194px]">
          <div className="bg-[#1e1e1e] overflow-hidden transition-all duration-500">
            <div className="h-48 w-full overflow-hidden">

              <img 
                src={topBarImage}
                alt={currentCard.name}
                className="w-full object-cover transition-transform duration-500 transform"
                />

              <div className="p-6 relative -mt-10">
                <div className="flex justify-center">
                  <div className="w-16 pt-4 flex items-center justify-center">
                    <currentCard.icon className="w-8 h-8 border-4 rounded-full bg-[#627EEA33]"/>
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between mt-4">
                  <button onClick={prevSlide} className="p-3 rounded-full bg-[#333333] text-gray-400 hover:bg-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:ring-blue-500">
                    <ChevronLeftIcon className="w-5 h-5"/>
                  </button>

                  <div className="text-center">
                    <p className="text-[32px] font-bold text-white">
                      ${currentCard.price.toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </p>
                    <p className={`text-[16px] font-medium ${priceChangeColor}`}>
                      {priceChangeIcon}{currentCard.change.toFixed(2)}%
                    </p>
                  </div>

                  <button onClick={nextSlide} className="p-3 rounded-full bg-[#333333] text-gray-400 hover:bg-[#444444] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1e1e1e] focus:ring-blue-500">
                    <ChevronRightIcon className="w-5 h-5"/>
                  </button>
                </div>
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
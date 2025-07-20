import ProfileHeader from "@/components/ui/header";
import HistoryCard from "@/components/ui/history-card";
import Bitcoin from "../../../assets/bitcoin.svg";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { getAnalysisHistory, type HistoryItem } from "@/lib/localStorage";

function History() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();

  const loadHistory = () => {
    const history = getAnalysisHistory();
    setHistoryItems(history.items);
  };

  useEffect(() => {
    // Load history data saat komponen di-mount
    loadHistory();
  }, []);

  const getIconForAnalysisType = (_analysisType: 'icp' | 'community') => {
    // Untuk sementara gunakan Bitcoin icon, bisa ditambahkan icon lain
    return Bitcoin;
  };

  const getCategoryText = (item: HistoryItem) => {
    const typeText = item.analysisType === 'icp' ? 'AI Analysis' : 'Community';
    const statusText = item.isSafe ? 'Safe' : 'Risky';
    return `${statusText} - ${typeText}`;
  };

  return (
    <div className="w-[400px] h-full bg-[#25262B] text-white">
      <ProfileHeader />

      <div className="m-4 p-4">
        <h1 className="font-semibold text-[20px] text-white mb-4">Scan History</h1>
        
        {historyItems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white/50">No analysis history found</p>
            <p className="text-white/30 text-sm mt-2">
              Analyze an address to see it here
            </p>
          </div>
        ) : (
          historyItems.map((item) => (
            <HistoryCard
              key={item.id}
              onClick={() => navigate(ROUTES.DETAIL_HISTORY.replace(':id', item.id))}
              icon={getIconForAnalysisType(item.analysisType)}
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

export default History;
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { useWallet } from "@/lib/contexts/walletContext";

const BalanceRefreshButton = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshBalances } = useWallet();

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshBalances();
    } catch (error) {
      console.error("Failed to refresh balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`p-2 rounded-lg transition-colors ${
        isRefreshing 
          ? "text-gray-500 cursor-not-allowed" 
          : "text-white/70 hover:text-white hover:bg-white/10"
      }`}
      title="Refresh balances"
    >
      <RefreshCw 
        size={16} 
        className={isRefreshing ? "animate-spin" : ""} 
      />
    </button>
  );
};

export default BalanceRefreshButton;

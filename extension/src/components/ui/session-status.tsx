import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/contexts/authContext";
import { useEffect, useState } from "react";

const SessionStatus = () => {
  const { sessionInfo, refreshSessionInfo } = useAuth();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show session status if session is near expiry or user wants to see it
    if (sessionInfo && sessionInfo.remainingTime < 10 * 60 * 1000) { // Less than 10 minutes
      setIsVisible(true);
    }
  }, [sessionInfo]);

  useEffect(() => {
    // Refresh session info every minute
    const interval = setInterval(() => {
      refreshSessionInfo();
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshSessionInfo]);

  if (!sessionInfo || !isVisible) return null;

  const getStatusColor = () => {
    if (!sessionInfo.isValid) return "text-red-400";
    if (sessionInfo.remainingTime < 5 * 60 * 1000) return "text-orange-400"; // Less than 5 minutes
    if (sessionInfo.remainingTime < 10 * 60 * 1000) return "text-yellow-400"; // Less than 10 minutes
    return "text-green-400";
  };

  const getStatusIcon = () => {
    if (!sessionInfo.isValid) return <AlertTriangle size={16} />;
    if (sessionInfo.remainingTime < 10 * 60 * 1000) return <Clock size={16} />;
    return <CheckCircle size={16} />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
        <div className="flex items-center space-x-2">
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
          <div className="flex-1">
            <div className="text-white text-sm font-medium">
              Session Status
            </div>
            <div className={`text-xs ${getStatusColor()}`}>
              {sessionInfo.remainingTimeFormatted}
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
        
        {sessionInfo.createdAt && (
          <div className="mt-2 text-xs text-gray-400">
            Started: {sessionInfo.createdAt.toLocaleTimeString()}
          </div>
        )}
        
        {sessionInfo.expiresAt && (
          <div className="text-xs text-gray-400">
            Expires: {sessionInfo.expiresAt.toLocaleTimeString()}
          </div>
        )}

        {sessionInfo.remainingTime < 5 * 60 * 1000 && sessionInfo.isValid && (
          <div className="mt-2">
            <div className="text-xs text-orange-300 mb-1">
              Session expires soon!
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded"
            >
              Refresh Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStatus;

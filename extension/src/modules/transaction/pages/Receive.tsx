import ProfileHeader from "@/components/ui/header";
import { ChevronLeft } from "lucide-react";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { useWalletApi } from "@/modules/wallet/api/WalletApi";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/contexts/authContext";

interface NetworkAddress {
  network: string;
  address: string;
  isLoading: boolean;
  error?: string;
}

function Receive() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getAddressForNetwork, hasWallet, isLoading: walletLoading } = useWalletApi();

  const [addresses, setAddresses] = useState<NetworkAddress[]>([
    { network: "Bitcoin", address: "", isLoading: true },
    { network: "Solana", address: "", isLoading: true },
    { network: "Ethereum", address: "", isLoading: true },
    { network: "Fradium", address: "", isLoading: true },
  ]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Memoize the getAddressForNetwork function to prevent infinite loops
  const stableGetAddressForNetwork = useCallback(async (network: string) => {
    try {
      return await getAddressForNetwork(network);
    } catch (error) {
      console.error(`Error getting address for ${network}:`, error);
      return { success: false, error: "Failed to get address" };
    }
  }, [getAddressForNetwork]);

  // Load addresses on mount - with proper dependency management
  useEffect(() => {
    let isMounted = true;

    const loadAddresses = async () => {
      if (!isAuthenticated || !hasWallet || walletLoading) return;

      try {
        const networks = ["Bitcoin", "Solana", "Ethereum", "Fradium"];
        const updatedAddresses = await Promise.all(
          networks.map(async (network) => {
            try {
              const result = await stableGetAddressForNetwork(network);
              return {
                network,
                address: result.success ? result.data || "" : "",
                isLoading: false,
                error: result.success ? undefined : result.error,
              };
            } catch (err) {
              console.error(`Error loading ${network} address:`, err);
              return {
                network,
                address: "",
                isLoading: false,
                error: "Failed to load address",
              };
            }
          })
        );

        if (isMounted) {
          setAddresses(updatedAddresses);
        }
      } catch (error) {
        console.error("Error loading addresses:", error);
        if (isMounted) {
          setAddresses((prev) =>
            prev.map((addr) => ({
              ...addr,
              isLoading: false,
              error: "Failed to load addresses",
            }))
          );
        }
      }
    };

    loadAddresses();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, hasWallet, walletLoading, stableGetAddressForNetwork]);

  // Safe copy address function
  const handleCopyAddress = useCallback(async (address: string, network: string) => {
    if (!address) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(address);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = address;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback copy failed:", err);
        }
        
        document.body.removeChild(textArea);
      }
      
      setCopiedAddress(`${network}-${address}`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  }, []);

  // Navigate to Detail Address page
  const handleShowAddressDetail = useCallback((address: string, network: string) => {
    if (!address || !network) return;
    
    try {
      // Navigate to detail page with address and network as query parameters
      navigate(`${ROUTES.BALANCE_DETAIL}?address=${encodeURIComponent(address)}&network=${encodeURIComponent(network)}`);
    } catch (error) {
      console.error("Error navigating to address detail:", error);
    }
  }, [navigate]);

  // Memoized render function to prevent unnecessary re-renders
  const renderAddressInput = useCallback((networkData: NetworkAddress) => {
    const { network, address, isLoading, error } = networkData;
    const isCopied = copiedAddress === `${network}-${address}`;

    return (
      <div key={network} className="mb-4">
        <h1 className="text-[14px] font-medium text-white mb-[6px]">{network}:</h1>
        <div className="flex flex-row w-full bg-white/10 border border-white/10 p-2 text-white justify-between">
          <input
            type="text"
            value={isLoading ? "Loading..." : error ? `Error: ${error}` : address || "No address available"}
            placeholder={`${network} address...`}
            className="bg-transparent outline-none flex-1 text-xs"
            readOnly
          />
          <div className="flex flex-row gap-[12px]">
            {/* QR Code Button - navigates to detail page */}
            <button
              type="button"
              className={`w-5 h-5 flex items-center justify-center ${!address || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              onClick={() => !isLoading && address && handleShowAddressDetail(address, network)}
              disabled={!address || isLoading}
              aria-label={`Show details for ${network} address`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                <path d="M3 9h6a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1z"/>
                <path d="M3 21h6a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1z"/>
                <path d="M15 3h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
                <path d="M15 15h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z"/>
              </svg>
            </button>
            
            {/* Copy Button */}
            <div className="relative">
              <button
                type="button"
                className={`w-5 h-5 flex items-center justify-center ${!address || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
                onClick={() => !isLoading && address && handleCopyAddress(address, network)}
                disabled={!address || isLoading}
                aria-label={`Copy ${network} address`}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1z"/>
                  <path d="M19 5H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2z"/>
                </svg>
              </button>
              {isCopied && (
                <div className="absolute -top-8 -left-4 bg-green-600 text-white text-xs px-2 py-1 rounded z-10">
                  Copied!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [copiedAddress, handleShowAddressDetail, handleCopyAddress]);

  // Safe navigation handler
  const handleNavigate = useCallback((route: string) => {
    try {
      navigate(route, { replace: true });
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, [navigate]);

  // Early returns for authentication states
  if (!isAuthenticated) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">Please authenticate to view your addresses</p>
          <NeoButton onClick={() => handleNavigate(ROUTES.WELCOME)}>Go to Login</NeoButton>
        </div>
      </div>
    );
  }

  if (!hasWallet && !walletLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">You need to create a wallet first</p>
          <NeoButton onClick={() => handleNavigate(ROUTES.WALLET_CONFIRMATION)}>Create Wallet</NeoButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto relative">
      <ProfileHeader />

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center">
          <button
            type="button"
            onClick={() => handleNavigate(ROUTES.HOME)}
            className="p-1 hover:bg-white/10 rounded"
            aria-label="Go back to home"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive</h1>
        </div>
      </div>

      <div className="flex flex-col px-[24px]">
        {addresses.map(renderAddressInput)}
      </div>
    </div>
  );
}

export default Receive;

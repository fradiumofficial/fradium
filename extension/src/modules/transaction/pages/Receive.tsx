import ProfileHeader from "@/components/ui/header";
import { ChevronLeft, RefreshCw } from "lucide-react";
import QrCodeIcon from "../../../../public/assets/qr_code.svg";
import CopyIcon from "../../../../public/assets/content_copy.svg";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { useWalletApi } from "@/modules/wallet/api/WalletApi";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";

interface NetworkAddress {
  network: string;
  address: string;
  isLoading: boolean;
  error?: string;
}

function Receive() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { getAddressForNetwork, hasWallet, isLoading: walletLoading, refreshWallet, refreshNetworkBalance } = useWalletApi();
  const [addresses, setAddresses] = useState<NetworkAddress[]>([
    { network: 'Bitcoin', address: '', isLoading: true },
    { network: 'Ethereum', address: '', isLoading: true },
    { network: 'Solana', address: '', isLoading: true },
    { network: 'Fradium', address: '', isLoading: true }
  ]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || !hasWallet || walletLoading) {
        return;
      }

      const networks = ['Bitcoin', 'Ethereum', 'Solana', 'Fradium'];
      const updatedAddresses = await Promise.all(
        networks.map(async (network) => {
          const result = getAddressForNetwork(network);
          return {
            network,
            address: result.success ? result.data || '' : '',
            isLoading: false,
            error: result.success ? undefined : result.error
          };
        })
      );

      setAddresses(updatedAddresses);
    };

    loadAddresses();
  }, [isAuthenticated, hasWallet, walletLoading, getAddressForNetwork]);

  // Copy address to clipboard
  const handleCopyAddress = async (address: string, network: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(`${network}-${address}`);
      setTimeout(() => setCopiedAddress(null), 2000); // Clear after 2 seconds
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  // Generate QR code (placeholder - you might want to implement actual QR generation)
  const handleShowQRCode = (address: string, network: string) => {
    // TODO: Implement QR code modal
    console.log(`Show QR code for ${network}: ${address}`);
  };

  // Refresh balance for specific network
  const handleRefreshBalance = async (network: string) => {
    try {
      setIsRefreshing(true);
      console.log(`Refreshing balance for ${network}...`);
      
      const result = await refreshNetworkBalance(network);
      if (result.success) {
        console.log(`${network} balance refreshed:`, result.data);
        // Optionally show a success message
        setCopiedAddress(`${network}-refreshed`);
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        console.error(`Failed to refresh ${network} balance:`, result.error);
      }
    } catch (error) {
      console.error(`Error refreshing ${network} balance:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh all balances
  const handleRefreshAll = async () => {
    try {
      setIsRefreshing(true);
      console.log('Refreshing all wallet data...');
      
      const result = await refreshWallet();
      if (result.success) {
        console.log('All balances refreshed successfully');
        setCopiedAddress('all-refreshed');
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        console.error('Failed to refresh wallet:', result.error);
      }
    } catch (error) {
      console.error('Error refreshing wallet:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderAddressInput = (networkData: NetworkAddress) => {
    const { network, address, isLoading, error } = networkData;
    const isCopied = copiedAddress === `${network}-${address}`;
    const isRefreshed = copiedAddress === `${network}-refreshed`;

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
            <img 
              src={QrCodeIcon} 
              alt="QR Code" 
              className={`w-5 h-5 cursor-pointer ${!address || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              onClick={() => address && !isLoading && handleShowQRCode(address, network)}
            />
            <RefreshCw 
              className={`w-5 h-5 cursor-pointer text-white ${isRefreshing ? 'animate-spin opacity-50' : 'hover:opacity-80'}`}
              onClick={() => !isRefreshing && handleRefreshBalance(network)}
            />
            <div className="relative">
              <img 
                src={CopyIcon} 
                alt="Copy" 
                className={`w-5 h-5 cursor-pointer ${!address || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                onClick={() => address && !isLoading && handleCopyAddress(address, network)}
              />
              {isCopied && (
                <div className="absolute -top-8 -left-4 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  Copied!
                </div>
              )}
              {isRefreshed && (
                <div className="absolute -top-8 -left-4 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  Refreshed!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Redirect if not authenticated or no wallet
  if (!isAuthenticated) {
    return (
      <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md p-[24px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">Please authenticate to view your addresses</p>
          <NeoButton onClick={() => navigate(ROUTES.WELCOME)}>
            Go to Login
          </NeoButton>
        </div>
      </div>
    );
  }

  if (!hasWallet && !walletLoading) {
    return (
      <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md p-[24px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70 mb-4">You need to create a wallet first</p>
          <NeoButton onClick={() => navigate(ROUTES.WALLET_CONFIRMATION)}>
            Create Wallet
          </NeoButton>
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto">
      <ProfileHeader />

      <div className="flex flex-row items-center justify-between px-[24px]">
        <div className="flex flex-row items-center">
          <ChevronLeft className="w-6 h-6" />
          <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive Coin</h1>
        </div>
        <div className="relative">
          <RefreshCw 
            className={`w-6 h-6 cursor-pointer text-white ${isRefreshing ? 'animate-spin opacity-50' : 'hover:opacity-80'}`}
            onClick={handleRefreshAll}
          />
          {copiedAddress === 'all-refreshed' && (
            <div className="absolute -top-8 -right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
              All Refreshed!
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col px-[24px]">
        {addresses.map(renderAddressInput)}

        <div className="mt-6">
          <NeoButton onClick={() => navigate(ROUTES.HOME)}>
            Done
          </NeoButton>
        </div>
      </div>
    </div>
  )
}

export default Receive;
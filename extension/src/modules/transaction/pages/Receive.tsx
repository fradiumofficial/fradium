import ProfileHeader from "@/components/ui/header";
import { ChevronLeft } from "lucide-react";
import QrCodeIcon from "../../../../public/assets/qr_code.svg";
import CopyIcon from "../../../../public/assets/content_copy.svg";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { useWalletApi } from "@/modules/wallet/api/WalletApi";
import { useState, useEffect } from "react";
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
    { network: 'Bitcoin', address: '', isLoading: true },
    { network: 'Solana', address: '', isLoading: true },
    { network: 'Ethereum', address: '0xf0000000', isLoading: true },
    { network: 'Fradium', address: '', isLoading: true }
  ]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Load addresses when component mounts
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || !hasWallet || walletLoading) {
        return;
      }

      try {
        const networks = ['Bitcoin', 'Solana', 'Ethereum', 'Fradium'];
        const updatedAddresses = await Promise.all(
          networks.map(async (network) => {
            try {
              const result = getAddressForNetwork(network);
              return {
                network,
                address: result.success ? result.data || '' : '',
                isLoading: false,
                error: result.success ? undefined : result.error
              };
            } catch (error) {
              console.error(`Error loading ${network} address:`, error);
              return {
                network,
                address: '',
                isLoading: false,
                error: 'Failed to load address'
              };
            }
          })
        );

        setAddresses(updatedAddresses);
      } catch (error) {
        console.error('Error loading addresses:', error);
        setAddresses(prev => prev.map(addr => ({
          ...addr,
          isLoading: false,
          error: 'Failed to load addresses'
        })));
      }
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

  const renderAddressInput = (networkData: NetworkAddress) => {
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
            <img 
              src={QrCodeIcon} 
              alt="QR Code" 
              className={`w-5 h-5 cursor-pointer ${!address || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
              onClick={() => address && !isLoading && handleShowQRCode(address, network)}
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

      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center">
          <button
            onClick={() => navigate(ROUTES.HOME, { replace: true })}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            Receive
          </h1>
        </div>
        
      </div>

      <div className="flex flex-col px-[24px]">
        {addresses.map(renderAddressInput)}
      </div>
    </div>
  )
}

export default Receive;
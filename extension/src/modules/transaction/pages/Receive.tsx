import ProfileHeader from "@/components/ui/header";
import { ChevronLeft } from "lucide-react";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { useWalletApi } from "@/modules/wallet/api/WalletApi";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/contexts/authContext";
import QRCode from "qrcode";

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
    { network: "Ethereum", address: "0xf0000000", isLoading: true },
    { network: "Fradium", address: "", isLoading: true },
  ]);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [qrMeta, setQrMeta] = useState<{ address: string; network: string } | null>(null);

  // Use chrome.runtime.getURL for icons (works in extensions)
  const QrCodeIcon = chrome.runtime.getURL("assets/qr_code.svg");
  const CopyIcon = chrome.runtime.getURL("assets/content_copy.svg");

  // Load addresses on mount
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated || !hasWallet || walletLoading) return;

      try {
        const networks = ["Bitcoin", "Solana", "Ethereum", "Fradium"];
        const updatedAddresses = await Promise.all(
          networks.map(async (network) => {
            try {
              const result = await getAddressForNetwork(network); // ensure it's awaited
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

        setAddresses(updatedAddresses);
      } catch (error) {
        console.error("Error loading addresses:", error);
        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isLoading: false,
            error: "Failed to load addresses",
          }))
        );
      }
    };

    loadAddresses();
  }, [isAuthenticated, hasWallet, walletLoading, getAddressForNetwork]);

  const handleCopyAddress = async (address: string, network: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(`${network}-${address}`);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const handleShowQRCode = async (address: string, network: string) => {
    try {
      setQrLoading(true);
      setQrError(null);
      setIsQrOpen(true);
      setQrMeta({ address, network });

      const url = await QRCode.toDataURL(address, {
        errorCorrectionLevel: "M",
        width: 240,
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      });

      setQrDataUrl(url);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
      setQrError("Failed to generate QR code");
      setQrDataUrl(null);
    } finally {
      setQrLoading(false);
    }
  };

  const closeQrModal = () => {
    setIsQrOpen(false);
    setQrDataUrl(null);
    setQrError(null);
    setQrMeta(null);
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
              className={`w-5 h-5 ${!address || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
              onClick={() => address && !isLoading && handleShowQRCode(address, network)}
            />
            <div className="relative">
              <img
                src={CopyIcon}
                alt="Copy"
                className={`w-5 h-5 ${!address || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}
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

  if (!isAuthenticated) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">Please authenticate to view your addresses</p>
          <NeoButton onClick={() => navigate(ROUTES.WELCOME)}>Go to Login</NeoButton>
        </div>
      </div>
    );
  }

  if (!hasWallet && !walletLoading) {
    return (
      <div className="w-[375px] h-[600px] bg-[#25262B] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">You need to create a wallet first</p>
          <NeoButton onClick={() => navigate(ROUTES.WALLET_CONFIRMATION)}>Create Wallet</NeoButton>
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
            onClick={() => navigate(ROUTES.HOME, { replace: true })}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">Receive</h1>
        </div>
      </div>

      <div className="flex flex-col px-[24px]">{addresses.map(renderAddressInput)}</div>

      {/* Fixed: QR Code Modal must be fixed positioning */}
      {isQrOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-[320px] bg-[#1F2025] border border-white/10 rounded-lg p-4 text-white relative">
            <button
              aria-label="Close"
              onClick={closeQrModal}
              className="absolute top-2 right-2 text-white/70 hover:text-white"
            >
              ✕
            </button>
            <div className="text-center mb-3">
              <div className="text-[14px] text-white/60">QR Code</div>
              <div className="text-[16px] font-medium">{qrMeta?.network}</div>
            </div>
            <div className="flex items-center justify-center min-h-[260px]">
              {qrLoading ? (
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : qrError ? (
                <div className="text-red-400 text-sm">{qrError}</div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt="QR Code" className="w-[240px] h-[240px] bg-white p-2 rounded" />
              ) : null}
            </div>
            <div className="mt-3">
              <div className="text-[12px] text-white/60 mb-1">Address</div>
              <div className="bg-white/5 border border-white/10 rounded p-2 text-xs break-all select-all">
                {qrMeta?.address}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={closeQrModal}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Receive;

import { ChevronLeft } from "lucide-react";
import NeoButton from "~components/custom-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "~lib/context/authContext";
import QRCode from "qrcode";

function ReceiveDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Get address and network from navigation state
  const address = location.state?.address || "";
  const network = location.state?.network || "";

  // State for QR code
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  // Generate QR code when component mounts
  useEffect(() => {
    if (!address) return;

    const generateQRCode = async () => {
      try {
        setQrLoading(true);
        setQrError(null);

        const url = await QRCode.toDataURL(address, {
          width: 280,
          margin: 1,
          scale: 6,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });

        setQrCodeDataUrl(url);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
        setQrError("Failed to generate QR code");
      } finally {
        setQrLoading(false);
      }
    };

    generateQRCode();
  }, [address]);

  // Safe copy address function
  const handleCopyAddress = useCallback(async () => {
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

      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  }, [address]);

  // Safe navigation handler
  const handleNavigate = useCallback(
    (route: string) => {
      try {
        navigate(route, { replace: true });
      } catch (error) {
        console.error("Navigation error:", error);
      }
    },
    [navigate]
  );

  // Early returns for invalid states
  if (!isAuthenticated) {
    return (
      <div className="w-[375px] h-[600px] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">
            Please authenticate to view address details
          </p>
          <NeoButton onClick={() => handleNavigate(ROUTES.WELCOME)}>
            Go to Login
          </NeoButton>
        </div>
      </div>
    );
  }

  if (!address || !network) {
    return (
      <div className="w-[375px] h-[600px] text-white flex items-center justify-center p-[24px]">
        <div className="text-center">
          <p className="text-white/70 mb-4">Invalid address information</p>
          <NeoButton onClick={() => handleNavigate(ROUTES.RECEIVE)}>
            Go Back
          </NeoButton>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[375px] space-y-4 text-white shadow-md overflow-y-auto relative">
      <div className="flex flex-col px-[24px]">
        <div className="flex flex-row items-center">
          <button
            type="button"
            onClick={() => handleNavigate(ROUTES.RECEIVE)}
            className="p-1 hover:bg-white/10 rounded"
            aria-label="Go back to receive page"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[20px] font-semibold text-white px-[12px]">
            Receive Coin
          </h1>
        </div>
      </div>

      <div className="flex flex-col px-[24px] space-y-6">
        {/* QR Code Display */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center justify-center min-h-[300px]">
            {qrLoading ? (
              <div className="flex flex-col items-center gap-3 text-white/80">
                <div className="w-12 h-12 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Generating QR Code...</span>
              </div>
            ) : qrError ? (
              <div className="flex flex-col items-center gap-3 text-red-400">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-3xl">⚠️</span>
                </div>
                <span className="text-sm text-center">{qrError}</span>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded text-sm transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : qrCodeDataUrl ? (
              <div className="flex flex-col items-center gap-3">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  className="w-[280px] h-[280px] bg-white p-4 rounded-lg shadow-lg"
                  style={{ imageRendering: "crisp-edges" }}
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* Address Display */}
        <div className="space-y-3">
          <div className="text-[14px] font-normal text-white/60">
            Your {network} address:
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-xs break-all select-all">
            {address}
          </div>
        </div>

        {/* Action Buttons */}
        <NeoButton
          onClick={handleCopyAddress}
          className="text-sm font-medium transition-colors w-full"
        >
          {copiedAddress ? (
            <>
              Copied!
            </>
          ) : (
            <>
              Copy Address
            </>
          )}
        </NeoButton>
      </div>
    </div>
  );
}

export default ReceiveDetail;
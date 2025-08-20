import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ProfileHeader from "@/components/ui/header";
import NeoButton from "@/components/ui/custom-button";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/lib/contexts/authContext";
import { useWallet } from "@/lib/contexts/walletContext";
import SendService from "@/services/sendService";

interface LocationState {
  amount: string;
  destinationAddress: string;
  selectedToken: string;
}

function ConfirmationBalance() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<LocationState>;

  const { identity } = useAuth();
  const { userWallet } = useWallet();
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { amount, destinationAddress, selectedToken } = useMemo(() => {
    return {
      amount: state.amount || "0",
      destinationAddress: state.destinationAddress || "",
      selectedToken: state.selectedToken || "",
    };
  }, [state.amount, state.destinationAddress, state.selectedToken]);

  const handleCancel = () => {
    navigate(ROUTES.HOME);
  };

  const handleConfirm = async () => {
    if (!identity || isSending) return;
    setErrorMessage(null);
    setIsSending(true);
    try {
      const senderAddress = userWallet?.addresses?.find((addr) => {
        const addressTokenType = Object.keys(addr.token_type)[0];
        return addressTokenType === selectedToken;
      })?.address;

      if (!senderAddress) {
        throw new Error("No sender address found for selected token");
      }

      const result = await SendService.sendTransaction(
        {
          tokenType: selectedToken,
          destinationAddress: destinationAddress || "",
          amount: amount || "0",
          senderAddress,
        },
        identity
      );

      if (result.success) {
        navigate(ROUTES.HOME);
      } else {
        throw new Error(result.error || "Transaction failed");
      }
    } catch (e) {
      console.error("ConfirmationBalance: send failed", e);
      const msg = e instanceof Error ? e.message : 'Failed to send transaction';
      setErrorMessage(msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-[375px] h-[600px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      <ProfileHeader />

      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Confirm Transfer</h1>

        <div className="mt-4 space-y-3">
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/60 text-xs">Amount</p>
            <p className="text-white text-base font-semibold">{amount} {selectedToken}</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/60 text-xs">To</p>
            <p className="text-white text-sm break-all">{destinationAddress}</p>
          </div>
          <div className="bg-white/5 rounded p-3">
            <p className="text-white/60 text-xs">Asset</p>
            <p className="text-white text-base font-semibold">{selectedToken}</p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-2 bg-red-500/20 border border-red-500/50 rounded">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={handleCancel}
            disabled={isSending}
            className="py-3 rounded-lg bg-[#393E4B] text-[#B0B6BE] font-semibold hover:bg-[#4A4F58] transition disabled:opacity-50"
          >
            Cancel
          </button>
          <NeoButton onClick={handleConfirm} className="w-full" disabled={isSending || !identity}>
            <div className="flex items-center justify-center space-x-2">
              {isSending && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              <span>{isSending ? 'Sending...' : 'Confirm Send'}</span>
            </div>
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationBalance;



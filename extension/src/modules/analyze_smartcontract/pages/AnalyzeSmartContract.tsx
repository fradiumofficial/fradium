import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeSmartContractIcon from "../../../assets/analyze_contract.svg";
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { useState, useEffect } from "react";

function AnalyzeSmartContract() {
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Check if there's an error from progress page
  useEffect(() => {
    const state = location.state as any;
    if (state?.error) {
      setError(state.error);
      setAddress(state.address || '');
    }
  }, [location.state]);

  const handleSubmit = async (event?: React.FormEvent) => {
    if (event) event.preventDefault();

    if (!address.trim()) {
      setError("Please enter a valid smart contract address.");
      return;
    }

    // Navigate ke progress page terlebih dahulu
    navigate(ROUTES.ANALYZE_SMART_CONTRACT_PROGRESS, {
      state: {
        address: address.trim(),
        isAnalyzing: true
      }
    });
  }

  const handleAddressChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddress(event.target.value);
    if (error) setError(null); // Clear error when user starts typing
  }

  return (
    <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      { /* Header Sections */}
      <ProfileHeader />

      { /* Analyze Smart Contract Section */}
      <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Smart Contract</h1>

        <form onSubmit={handleSubmit}>
          <textarea
            name="smartcontract"
            id="smartcontract"
            placeholder="Input smart contract address here..."
            value={address}
            onChange={handleAddressChange}
            className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10 resize-none"
            rows={3}
          />

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <NeoButton
            icon={AnalyzeSmartContractIcon}
            onClick={handleSubmit}
            disabled={!address.trim()}
          >
            Analyze Smart Contract
          </NeoButton>
        </form>
      </div>
    </div>
  )
}

export default AnalyzeSmartContract
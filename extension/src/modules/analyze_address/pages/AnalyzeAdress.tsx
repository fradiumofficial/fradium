import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import AnalyzeAddressIcon from "../../../assets/analyze_address.svg";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { fetchTransactions, extractFeatures } from "../api/AnalyzeAddressApi";
import { useState } from "react";

function AnalyzeAddress() {
  const navigate = useNavigate();
  const [address, setAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeClick = async () => {
    if (!address) {
      setError("Please enter a valid address.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step A: Fetch transactions for the entered address
      console.log(`Starting analysis for address: ${address}`);
      const transactions = await fetchTransactions(address);
      // Step B: Extract the feature vector from the transactions
      const featureVector = extractFeatures(transactions, address);
      // Step C: Log the final output to the console as requested
      console.log("✅ Analysis Complete! Feature Vector:", featureVector);
      // Note: Navigation is commented out to focus on the console log.
      // You can re-enable it and pass the results via state or params if needed.
      // navigate(ROUTES.ANALYZE_ADDRESS_RESULT);
      navigate(ROUTES.ANALYZE_ADDRESS_RESULT, { 
        state: { 
          features: featureVector,
          analyzedAddress: address 
        } 
      });

    } catch (err: any) {
      // Step D: Catch and display any errors from the API call
      console.error("Analysis failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      // Step E: Reset the loading state
      setIsLoading(false);
    }

  }

  return (
   <div className="w-[400px] h-[570px] space-y-4 bg-[#25262B] text-white shadow-md">
    { /* Header Sections */}
    <ProfileHeader
        mainAvatarSrc='https://github.com/shadcn.png'
        mainAvatarFallback='N'
        address='0x1A2b3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9g0H'
      />
    
    { /* Analyze Address Section */}
    <div className="m-4">
        <h1 className="text-[20px] font-semibold">Analyze Address</h1>

        {/* 4. Bind the input to the state */}
        <input 
          type="address" 
          name="address" 
          id="address" 
          placeholder="Input address here..."
          className="border-1 border-white/5 p-3 w-full mt-[20px] mb-[8px] text-white text-[14px] font-normal bg-white/10"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isLoading}
        />
        {/* 5. Update the button to call the new handler and reflect loading state */}
        <NeoButton 
          icon={AnalyzeAddressIcon} 
          onClick={handleAnalyzeClick} 
          disabled={isLoading}
        >
          {isLoading ? "Analyzing..." : "Analyze Address"}
        </NeoButton>
          
        {/* 6. Optionally, display any error messages */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      </div>
  </div>
  )
}

export default AnalyzeAddress
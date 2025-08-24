import NeoButton from "@/components/ui/custom-button";
import ProfileHeader from "@/components/ui/header";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";

export default function Failed() {
  const navigate = useNavigate();
  return (
    <div className="w-[375px] h-[600px] bg-[#25262B] text-white shadow-md overflow-y-auto pb-20">
      {/* Header Sections */}
      <ProfileHeader />

      {/* Failed Section */}
      <div className="m-4 jusify-center items-center flex flex-col">
        <h1 className="text-[20px] font-semibold">Analysis Failed</h1>
        <p className="text-red-500 text-sm mt-2">An error occurred while analyzing the address. Please try again later.</p>
      </div>
      <div className="m-4 space-y-4">
        <NeoButton onClick={() => { }}>Retry Analysis</NeoButton>
        <NeoButton onClick={() => navigate(ROUTES.HOME)}>Go to Home</NeoButton>
      </div>
    </div>
  );
}
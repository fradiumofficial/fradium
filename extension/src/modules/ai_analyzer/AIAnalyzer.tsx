import ProfileHeader from "@/components/ui/header";
import { ROUTES } from "@/constants/routes";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function AIAnalyzer() {
    const navigate = useNavigate();

    return (
        <div className="w-[375px] h-[600px] bg-[#25262B] text-white overflow-y-auto pb-20">
            <ProfileHeader />

            <div className="px-4 pt-4 space-y-4">
                {/* Analyze Contract */}
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.ANALYZE_SMART_CONTRACT)}
                    className="w-full text-left bg-white/5 border border-white/10 rounded-xs p-4 hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-14 h-14 rounded-full bg-[#9BE4A0]/10 flex items-center justify-center">
                                <img src="/assets/analyze-contract.png" alt="Analyze Contract" className="w-8 h-8" />
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="text-[18px] font-medium leading-tight">Analyze Contract</div>
                                <div className="text-white/60 mt-2 text-[14px] font-normal leading-tight">Analyze fraud with smart contract address</div>
                            </div>
                        </div>
                        <ChevronRight className="text-white/60 w-6 h-6 flex-shrink-0" />
                    </div>
                </button>

                {/* Analyze Address */}
                <button
                    type="button"
                    onClick={() => navigate(ROUTES.ANALYZE_ADDRESS)}
                    className="w-full text-left bg-white/5 border border-white/10 rounded-xs p-4 hover:bg-white/10 transition-colors"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-14 h-14 rounded-full bg-[#9BE4A0]/10 flex items-center justify-center">
                                <img src="/assets/analyze-address.png" alt="Analyze Address" className="w-8 h-8" />
                            </div>
                            <div className="ml-4 flex-1">
                                <div className="text-[16px] font-medium leading-tight">Analyze Address</div>
                                <div className="text-white/60 mt-2 text-[14px] font-normal leading-tight">Analyze fraud with coin address</div>
                            </div>
                        </div>
                        <ChevronRight className="text-white/60 w-6 h-6 flex-shrink-0" />
                    </div>
                </button>
            </div>
        </div>
    );
}

export default AIAnalyzer;

import ProfileHeader from "@/components/ui/header";
import { Search, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

type ScanItem = {
    id: string;
    icon: string;
    address: string;
    subtitle: string;
    date: string;
};

const scanItems: ScanItem[] = [
    {
        id: "1",
        icon: "/assets/images/bitcoin.png",
        address: "m1psqxsfsnfnfd...",
        subtitle: "Ransomware - AI",
        date: "24/04/35",
    },
    {
        id: "2",
        icon: "/assets/images/ethereum.png",
        address: "m1psqxsfsnfnfd...",
        subtitle: "Ransomware - AI",
        date: "24/04/35",
    },
    {
        id: "3",
        icon: "/assets/images/bitcoin.png",
        address: "m1psqxsfsnfnfd...",
        subtitle: "Ransomware - AI",
        date: "24/04/35",
    },
];

function ScanHistory() {
    const navigate = useNavigate();
    const SHOW_EMPTY = true;

    return (
        <div className={`w-[375px] h-[600px] bg-[#25262B] text-white pb-20 flex flex-col`}>
            <ProfileHeader />

            {/* Content wrapper fills remaining height */}
            <div className={`relative flex-1 ${SHOW_EMPTY ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                <div className="px-4 pb-4 h-full flex flex-col">
                    {/* Tabs */}
                    <div className="flex items-center justify-between pt-3 select-none">
                        <button
                            type="button"
                            className="text-white/60 text-[14px] font-semibold"
                            onClick={() => navigate(ROUTES.HISTORY)}
                        >
                            Transaction
                        </button>
                        <div className="text-white text-[14px] font-semibold">Scan history</div>
                    </div>
                    {/* underline line with active segment at right */}
                    <div className="relative mt-2 h-[2px] w-full bg-white/10">
                        <div className="absolute right-0 w-[170px] h-[2px] bg-white" />
                    </div>

                    {/* Search row */}
                    <div className="mt-4 flex items-center gap-3">
                        <div className="flex-1 h-12 bg-[#2C2D33] border border-white/10 rounded-md flex items-center px-3 text-white/70">
                            <Search className="w-5 h-5 mr-2 text-white/60" />
                            <input
                                type="text"
                                placeholder="Search by token"
                                className="bg-transparent outline-none placeholder:text-white/60 w-full text-sm"
                            />
                        </div>
                        <button
                            type="button"
                            className="h-12 w-12 rounded-md bg-[#3A3B41] border border-white/10 flex items-center justify-center"
                        >
                            <Settings2 className="text-white/80" />
                        </button>
                    </div>

                    {/* List or Empty State area fills remaining height */}
                    <div className="relative flex-1 mt-6">
                        {SHOW_EMPTY ? (
                            <>
                                <div className="relative z-10 w-full h-full flex items-center justify-center text-center">
                                    <div>
                                        <img src="/assets/empty.png" alt="empty" className="w-16 h-16 mb-6 mx-auto" />
                                        <div className="text-[18px] font-medium mb-2">No scan history here...</div>
                                        <div className="text-white/60 text-[14px] font-normal leading-relaxed max-w-[320px] mx-auto">
                                            Use your fradium AI analyzer to analyze address and smart contract, your activity will appear here
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-1 space-y-3">
                                {scanItems.map((item) => (
                                    <div key={item.id} className="">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center">
                                                <img src={item.icon} alt="token" className="w-10 h-10 rounded-full" />
                                                <div className="ml-3">
                                                    <div className="text-[14px] font-normal leading-6">
                                                        {item.address}
                                                    </div>
                                                    <div className="text-white/60 mt-1">{item.subtitle}</div>
                                                </div>
                                            </div>
                                            <div className="text-white/60 text-[14px] mt-1">{item.date}</div>
                                        </div>
                                        <div className="mt-4 h-px w-full bg-white/10" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ScanHistory;



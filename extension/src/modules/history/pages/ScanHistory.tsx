import ProfileHeader from "@/components/ui/header";

function ScanHistory() {
    return (
        <div className="w-[375px] h-[600px] bg-[#25262B] text-white">
            <ProfileHeader />

            <div className="px-4 pb-4">
                {/* Tabs */}
                <div className="flex items-center justify-between pt-3">
                    <button
                        type="button"
                        className="text-white/60 text-[18px] font-semibold"
                        onClick={() => (window.location.hash = '#/history')}
                    >
                        Transaction
                    </button>
                    <div className="text-white text-[18px] font-semibold">Scan history</div>
                </div>
                <div className="mt-2 h-[2px] bg-white/10 relative">
                    <div className="absolute left-1/2 w-[120px] -translate-x-1/2 h-[2px] bg-white" />
                </div>

                {/* Kosong / placeholder */}
                <div className="mt-5 text-white/50 text-sm">
                    Belum ada data scan history.
                </div>
            </div>
        </div>
    );
}

export default ScanHistory;



import ProfileHeader from "@/components/ui/header";

function Setting() {
    return (
        <div className="w-[375px] h-[600px] bg-[#25262B] text-white overflow-y-auto pb-20">
            <ProfileHeader />

            {/* Title and Subtitle */}
            <div className="px-4 pt-5">
                <h1 className="text-[20px] font-semibold leading-tight">Setting</h1>
                <p className="text-white/70 text-[14px] font-normal mt-2 leading-relaxed">
                    Adjust wallet, security, and extension preferences
                </p>
            </div>

            {/* General Card */}
            <div className="px-4 mt-6">
                <div className="border border-white/10 bg-white/5">
                    <div className="p-5">
                        <div className="text-white text-[14px] font-semibold">General</div>

                        {/* Principal */}
                        <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-white/80 font-normal text-[14px]">Your Principal</span>
                                <img src="/assets/help.svg" alt="help" className="w-5 h-5 ml-2" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[14px] font-normal">wrfnv0wsn3...sf....qwe</span>
                                <img src="/assets/copy.svg" alt="copy" className="w-5 h-5 ml-2" />
                            </div>
                        </div>

                        {/* Session Duration */}
                        <div className="mt-6">
                            <div className="text-white/80 text-[14px] font-normal">Session Duration</div>
                            <div className="text-white/50 text-[14px] font-normal mt-2">Expires in 54 minutes</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* List of scan activity */}
            <div className="px-4 mt-4 mb-6">
                <div className=" border border-white/10 bg-white/5">
                    <div className="p-5">
                        <div className="text-white text-[14px] font-semibold">List of scan activity</div>

                        <div className="mt-6 flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-white/80 text-[14px] font-normal">Active Networks</span>
                                <img src="/assets/help.svg" alt="help" className="w-5 h-5 ml-2" />
                            </div>
                            <div className="flex items-center gap-4">
                                <img src="/assets/images/Icon-coins.png" alt="coins" className="w-[68px] h-[20px]" />
                                <button type="button" className="text-[#9BE4A0] text-[14px] font-medium flex items-center gap-2">
                                    Edit <span className="inline-block">→</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Setting;

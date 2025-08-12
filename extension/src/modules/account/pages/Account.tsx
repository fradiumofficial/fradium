import ProfileHeader from "@/components/ui/header";
import LogoutButton from "@/components/ui/logout-button";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";

function Account() {
    const navigate = useNavigate();

    return (
        <div className="w-[375px] h-[600px] bg-[#25262B] text-white overflow-y-auto pb-20">
            <ProfileHeader />

            <div className="px-4 pt-4">
                {/* Menu Items */}
                <div className="space-y-0">
                    {/* Contact */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/contact.svg" alt="Contact" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Contact</span>
                        </div>
                    </div>

                    {/* Refer your friends */}
                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                        <div className="flex items-center">
                            <img src="/assets/share.svg" alt="Share" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Refer your friends</span>
                        </div>
                    </div>

                    {/* Why Fradium */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/info.svg" alt="Info" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Why Fradium</span>
                        </div>
                    </div>

                    {/* Documentation */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/documentation.svg" alt="Documentation" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Documentation</span>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/help.svg" alt="Help" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Support</span>
                        </div>
                    </div>

                    {/* Setting */}
                    <div
                        className="flex items-center justify-between py-4 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                        onClick={() => navigate(ROUTES.SETTING)}
                    >
                        <div className="flex items-center">
                            <img src="/assets/setting.svg" alt="Setting" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Setting</span>
                        </div>
                    </div>

                    {/* Source Code */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/GithubLogo.svg" alt="GitHub" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">Source Code</span>
                        </div>
                    </div>

                    {/* X Account - No divider after this */}
                    <div className="flex items-center justify-between py-4">
                        <div className="flex items-center">
                            <img src="/assets/XLogo.svg" alt="X" className="w-5 h-5 mr-4" />
                            <span className="text-white text-[16px]">X Account</span>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <div className="mt-8">
                    <LogoutButton />
                </div>
            </div>
        </div>
    );
}

export default Account;



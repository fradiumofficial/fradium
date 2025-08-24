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

          {/* Why Fradium */}
          <div
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() =>
              window.open(
                "https://fradium.gitbook.io/docs/introduction/why-fradium",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <div className="flex items-center">
              <img src="/assets/info.svg" alt="Info" className="w-5 h-5 mr-4" />
              <span className="text-white text-[16px]">Why Fradium</span>
            </div>
          </div>

          {/* Documentation */}
          <div
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() =>
              window.open(
                "https://fradium.gitbook.io/docs/",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <div className="flex items-center">
              <img
                src="/assets/documentation.svg"
                alt="Documentation"
                className="w-5 h-5 mr-4"
              />
              <span className="text-white text-[16px]">Documentation</span>
            </div>
          </div>

          {/* Setting */}
          <div
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => navigate(ROUTES.SETTING)}
          >
            <div className="flex items-center">
              <img
                src="/assets/setting.svg"
                alt="Setting"
                className="w-5 h-5 mr-4"
              />
              <span className="text-white text-[16px]">Setting</span>
            </div>
          </div>

          {/* Source Code */}
          <div
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() =>
              window.open(
                "https://github.com/fradiumofficial/fradium",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
            <div className="flex items-center">
              <img
                src="/assets/GithubLogo.svg"
                alt="GitHub"
                className="w-5 h-5 mr-4"
              />
              <span className="text-white text-[16px]">Source Code</span>
            </div>
          </div>

          {/* X Account - No divider after this */}
          <div
            className="flex items-center justify-between py-4 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() =>
              window.open(
                "https://x.com/fradiumofficial",
                "_blank",
                "noopener,noreferrer"
              )
            }
          >
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

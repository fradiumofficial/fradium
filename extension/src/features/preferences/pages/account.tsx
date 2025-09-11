import LogoutButton from "~components/logout-button";
import { ROUTES } from "~lib/constant/routes";
import { useNavigate } from "react-router-dom";
import { CDN } from "~lib/constant/cdn";

function Account() {
  const navigate = useNavigate();

  return (
    <div className="w-[375px] text-white overflow-y-auto">
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
              <img src={CDN.icons.info} alt="Info" className="w-5 h-5 mr-4" />
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
                src={CDN.icons.documentation}
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
                src={CDN.icons.setting}
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
                src={CDN.icons.github}
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
              <img src={CDN.icons.x} alt="X" className="w-5 h-5 mr-4" />
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

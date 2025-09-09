import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "~lib/constant/routes";
import { useAuth } from "~lib/context/authContext";

type LogoutButtonProps = {
    onClick?: () => void;
    className?: string;
};

function LogoutButton({ onClick, className = "" }: LogoutButtonProps) {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const { signOut } = useAuth();

    const handleLogout = async () => {
        if (onClick) {
            onClick();
            return;
        }
        if (isLoading) return;
        setIsLoading(true);
        try {
            // Clear local auth state and navigate
            await signOut();
            navigate(ROUTES.WELCOME, { replace: true });
        } catch (_e) {
            // ignore and continue
            navigate(ROUTES.WELCOME, { replace: true });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={`bg-white/30  ${className}`}>
            <button
                onClick={handleLogout}
                disabled={isLoading}
                className={`
          w-full
          flex items-center justify-center gap-2
          px-6 py-4
          text-white text-[16px] font-medium
          bg-[#3A3B41]
          border border-white/10
          transform -translate-y-1 translate-x-1
          hover:-translate-y-0 hover:translate-x-0
          active:translate-y-0 active:translate-x-0
          transition-transform duration-150 ease-in-out
          ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
        `}
            >
                <LogOut className="w-5 h-5 text-white rotate-180" />
                <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
            </button>
        </div>
    );
}

export default LogoutButton;

import { LogOut } from "lucide-react";

type LogoutButtonProps = {
    onClick?: () => void;
    className?: string;
};

function LogoutButton({ onClick, className = "" }: LogoutButtonProps) {
    return (
        <div className={`bg-white/30  ${className}`}>
            <button
                onClick={onClick}
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
        `}
            >
                <LogOut className="w-5 h-5 text-white rotate-180" />
                <span>Logout</span>
            </button>
        </div>
    );
}

export default LogoutButton;

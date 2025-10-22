import { useState } from "react";
import { ChevronDown, User, LogOut, CreditCard, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { cn } from "@/core/lib/utils";
import { useNavigate } from "react-router";
import { useAuth } from "@/core/providers/auth-provider";

export function UserProfileHeader() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!isAuthenticated) return null;

  if (!user?.id) {
    logout();
    return null;
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1.5 outline-none transition-colors hover:bg-black/5 focus:bg-black/5">
        <div className="relative h-6 w-6 overflow-hidden rounded-full">
          <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} alt="User avatar" className="h-full w-full object-cover" />
        </div>
        <span className="text-sm font-medium">{user.name}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <p>{user.id}</p>
              <button onClick={() => navigator.clipboard.writeText(user.id)} className="hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user.role === "community" ? (
          <>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/community")}>
              <User className="mr-2 h-4 w-4" />
              <span>Community</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/nfts")}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>NFTs</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => navigate("/my-projects")}>
              <FileText className="mr-2 h-4 w-4" />
              <span>My Projects</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-500 focus:text-red-500 cursor-pointer" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

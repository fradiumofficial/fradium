import { Menu, Leaf, Wallet, User, X, ChevronDown, Zap, Droplets, Recycle, TreePine, Sparkles, LogOut, CreditCard, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/core/components/ui/sheet";
import { Outlet, useNavigate } from "react-router";
import { Button } from "@/core/components/ui/button";
import { useAuth } from "@/core/providers/auth-provider";
import { UserProfileHeader } from "../user-profile";
import { useState } from "react";
import { convertE8sToToken } from "@/core/lib/canisterUtils";

const whitePaperUrl = "https://www.notion.so/Lumora-White-Paper-1eaa9c3ab182805bab79cbae7fe8ad7c?showMoveTo=true&saveParent=true";

export default function HomeLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={`min-h-screen flex flex-col ${window.location.pathname === "/assistant" ? "bg-black" : ""}`}>
      <header className={`border-b border-white/10 ${window.location.pathname === "/" ? "fixed" : "sticky"} top-0 right-0 left-0 bg-black/40 backdrop-blur-3xl z-50`}>
        <div className="container flex items-center h-16 justify-between">
          <div className="flex items-center gap-8">
            <a onClick={() => navigate("/")} className="flex items-center gap-2 font-bold text-xl cursor-pointer">
              <Leaf className="h-6 w-6" />
              Lumora
            </a>
            <nav className="hidden md:flex items-center gap-6">
              <a href="javascript:void(0)" onClick={() => navigate("/projects")} className="text-sm text-white/90 font-medium flex items-center justify-center">
                Projects
              </a>
              <a href="javascript:void(0)" onClick={() => navigate("/resources")} className="text-sm text-white/90 font-medium flex items-center justify-center">
                Resources
              </a>
              <a href="javascript:void(0)" onClick={() => navigate("/nfts")} className="text-sm text-white/90 font-medium flex items-center justify-center">
                NFTs
              </a>
              <a href={whitePaperUrl} target="_blank" className="text-sm text-white/90 font-medium flex items-center justify-center">
                White Paper
              </a>
              <a href="javascript:void(0)" onClick={() => navigate("/assistant")} className="text-sm font-medium flex items-center justify-center gap-1">
                <Sparkles className="h-4 w-4 text-emerald-400 mr-1" />
                Assistant
              </a>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button
              className="hidden md:flex bg-transparent hover:bg-black/30 hover:backdrop-blur-lg"
              onClick={() => {
                if (!isAuthenticated) {
                  return;
                }

                if (user.role === "community") {
                  navigate("/community?tab=balance");
                } else {
                  navigate("/balance");
                }
              }}>
              <span className="text-sm font-medium h-5">{isAuthenticated ? convertE8sToToken(user?.balance) : 0} LUM</span>
            </Button>
            {isLoading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            ) : isAuthenticated ? (
              <div className="hidden md:block">
                <UserProfileHeader />
              </div>
            ) : (
              <Button className="hidden md:flex bg-black/20 hover:bg-black/30 hover:backdrop-blur-lg" onClick={() => login()}>
                <User className="h-5 w-5 mr-2" />
                Sign In
              </Button>
            )}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden relative z-50" onClick={handleMobileMenuToggle}>
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:w-[350px] p-0">
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="border-b border-border/40 p-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 font-bold text-xl">
                      <Leaf className="h-6 w-6 text-emerald-500" />
                      Lumora
                    </a>
                  </div>

                  {/* User Info & Balance - Mobile */}
                  {isAuthenticated && user?.id ? (
                    <div className="border-b border-border/40 p-4">
                      <div className="flex flex-col gap-3">
                        {/* User Profile */}
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                          <div className="relative h-10 w-10 overflow-hidden rounded-full">
                            <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.id}`} alt="User avatar" className="h-full w-full object-cover" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.name}</span>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <p className="truncate max-w-[150px]">{user.id}</p>
                              <button onClick={() => navigator.clipboard.writeText(user.id)} className="hover:text-foreground">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Balance */}
                        <div
                          className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                          onClick={() => {
                            if (user.role === "community") {
                              navigate("/community?tab=balance");
                            } else {
                              navigate("/balance");
                            }

                            setIsMobileMenuOpen(false);
                          }}>
                          <Wallet className="h-6 w-6 text-emerald-500" />
                          <div className="flex flex-col">
                            <span className="text-sm text-muted-foreground">LUM Balance</span>
                            <span className="text-base font-medium">{convertE8sToToken(user?.balance)} LUM</span>
                          </div>
                        </div>

                        {/* User Specific Actions */}
                        {user.role === "community" ? (
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => {
                              navigate("/community");
                              setIsMobileMenuOpen(false);
                            }}>
                            <User className="h-4 w-4 mr-2" />
                            Community
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                navigate("/nfts");
                                setIsMobileMenuOpen(false);
                              }}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              NFTs
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full justify-start"
                              onClick={() => {
                                navigate("/my-projects");
                                setIsMobileMenuOpen(false);
                              }}>
                              <FileText className="h-4 w-4 mr-2" />
                              My Projects
                            </Button>
                          </>
                        )}

                        {/* Logout Button */}
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-b border-border/40 p-4">
                      <Button
                        className="w-full bg-black/20 hover:bg-black/30 hover:backdrop-blur-lg"
                        onClick={() => {
                          login();
                          setIsMobileMenuOpen(false);
                        }}>
                        <User className="h-5 w-5 mr-2" />
                        Sign In
                      </Button>
                    </div>
                  )}

                  {/* Mobile Navigation */}
                  <div className="flex-1 overflow-auto py-4">
                    <nav className="flex flex-col px-4 gap-1">
                      <a
                        href="javascript:void(0)"
                        onClick={() => {
                          navigate("/projects");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-secondary/50">
                        <span className="font-medium">Projects</span>
                      </a>
                      <a
                        href="javascript:void(0)"
                        onClick={() => {
                          navigate("/resources");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-secondary/50">
                        <span className="font-medium">Resources</span>
                      </a>
                      <a
                        href="javascript:void(0)"
                        onClick={() => {
                          navigate("/nfts");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-secondary/50">
                        <span className="font-medium">NFTs</span>
                      </a>
                      <a href={whitePaperUrl} target="_blank" className="flex items-center py-2 px-3 rounded-md hover:bg-secondary/50">
                        <span className="font-medium">White Paper</span>
                      </a>
                      <a
                        href="javascript:void(0)"
                        onClick={() => {
                          navigate("/assistant");
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center py-2 px-3 rounded-md hover:bg-secondary/50">
                        <Sparkles className="h-4 w-4 text-emerald-400 mr-2" />
                        <span className="font-medium">Assistant</span>
                      </a>
                    </nav>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <Outlet />

      <footer className={`${window.location.pathname === "/assistant" ? "bg-black" : "bg-card"} border-t border-border/40 py-6`}>
        <div className="container">
          <div className="flex items-center justify-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-500" />
            <span className="text-muted-foreground">© {new Date().getFullYear()} Lumora</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

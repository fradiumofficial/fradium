import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/core/providers/AuthProvider";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";

function SimplePaymentRightActions({
    isProfileDropdownOpen,
    setIsProfileDropdownOpen,
    navigate,
    logout,
    identity,
    handleLogin
}) {
    const [isLoading, setIsLoading] = React.useState(false);

    const handleCopyAddress = () => {
        if (identity && !identity.getPrincipal().isAnonymous()) {
            const principalText = identity.getPrincipal().toText();
            navigator.clipboard.writeText(principalText);
            toast.success("Address copied to clipboard!");
        }
    };

    const truncateAddress = (address) => {
        if (!address) return "";
        // Adjusted length for the new layout
        if (address.length <= 10) return address;
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    const principalText = identity && !identity.getPrincipal().isAnonymous()
        ? identity.getPrincipal().toText()
        : "";

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await handleLogin();
        } catch (error) {
            console.log("handleSignIn error", error);
        } finally {
            setIsLoading(false);
        }
    };

    // If not logged in, show the original sign in button
    if (!identity || identity.getPrincipal().isAnonymous()) {
        return (
            <button
                onClick={handleSignIn}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-[#C6A960] to-[#D4B76E] hover:opacity-90 disabled:opacity-50 px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition-opacity font-medium text-white text-sm sm:text-base"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="hidden sm:inline">Signing In...</span>
                        <span className="sm:hidden">Wait...</span>
                    </>
                ) : (
                    <>
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 sm:w-5 sm:h-5"
                        >
                            <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" />
                            <path
                                d="M6 21c0-3.314 2.686-6 6-6s6 2.686 6 6"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                        <span className="hidden sm:inline">Sign In</span>
                        <span className="sm:hidden">Sign In</span>
                    </>
                )}
            </button>
        );
    }

    // NEW LAYOUT for logged-in users
    return (
        <div className="relative profile-dropdown">
            <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="group flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-gray-100 transition-colors duration-200 ease-out cursor-pointer"
            >
                {/* Icon */}
                <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="4" height="4" fill="#6E857B"/>
                        <rect x="10" y="4" width="4" height="4" fill="#6E857B"/>
                        <rect x="16" y="4" width="4" height="4" fill="#6E857B"/>
                        <rect x="4" y="10" width="4" height="4" fill="#6E857B"/>
                        <rect x="16" y="10" width="4" height="4" fill="#6E857B"/>
                        <rect x="4" y="16" width="4" height="4" fill="#6E857B"/>
                        <rect x="10" y="16" width="4" height="4" fill="#6E857B"/>
                        <rect x="16" y="16" width="4" height="4" fill="#6E857B"/>
                    </svg>
                </div>

                {/* Wallet Info */}
                <div className="flex flex-col items-start">
                    <span className="font-medium text-sm text-gray-900">
                        Your Wallet
                    </span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-gray-500">
                            {truncateAddress(principalText)}
                        </span>
                        {/* Use a div for the copy action to avoid nested buttons */}
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevents the dropdown from opening/closing
                                handleCopyAddress();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    handleCopyAddress();
                                }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Copy address"
                        >
                            <Copy size={14} />
                        </div>
                    </div>
                </div>

                {/* Chevron Icon */}
                <svg
                    className="w-5 h-5 text-yellow-900/70 transition-transform duration-300 ease-out"
                    style={{ transform: isProfileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown menu (unchanged) */}
            <AnimatePresence>
                {isProfileDropdownOpen && (
                    <motion.div
                        className="absolute top-full right-0 mt-3 w-[270px] rounded-2xl font-normal border border-gray-200 z-[9999] overflow-hidden bg-white shadow-xl"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="py-4">
                            {/* Address Section */}
                            {principalText && (
                                <>
                                    <div className="mx-5 mb-3">
                                        <p className="text-xs text-gray-500 mb-2">Your Address</p>
                                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                            <p className="text-xs font-mono text-gray-700 flex-1 break-all">
                                                {principalText}
                                            </p>
                                            <button
                                                onClick={handleCopyAddress}
                                                className="p-1.5 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                                                title="Copy address"
                                            >
                                                <Copy className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="h-px bg-gray-200 mx-5 mb-3"></div>
                                </>
                            )}

                            <button
                                className="w-full text-sm transition-colors group"
                                onClick={() => window.open("https://fradium.gitbook.io/docs/introduction/why-fradium", "_blank")}
                            >
                                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                                        <circle cx="12" cy="12" r="10" stroke="#C6A960" strokeWidth="2" />
                                        <line x1="12" y1="8" x2="12" y2="12" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                    <span className="text-gray-800">Why Fradium</span>
                                </div>
                            </button>
                            <button
                                className="w-full text-sm transition-colors group"
                                onClick={() => window.open("https://fradium.gitbook.io/docs", "_blank")}
                            >
                                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="14,2 14,8 20,8" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="16" y1="13" x2="8" y2="13" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <line x1="16" y1="17" x2="8" y2="17" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="10,9 9,9 8,9" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-gray-800">Documentation</span>
                                </div>
                            </button>
                            <div className="h-px bg-gray-200 mx-5 my-3"></div>
                            <button
                                className="w-full text-sm transition-colors group"
                                onClick={() => window.open("https://github.com/fradiumofficial/fradium", "_blank")}
                            >
                                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-gray-800">Source Code</span>
                                </div>
                            </button>
                            <button
                                className="w-full mb-2 text-sm transition-colors group"
                                onClick={() => window.open("https://x.com/fradiumofficial", "_blank")}
                            >
                                <div className="mx-5 flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50">
                                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" className="text-[#C6A960]">
                                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" stroke="#C6A960" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <span className="text-gray-800">X Account</span>
                                </div>
                            </button>

                            {identity && !identity.getPrincipal().isAnonymous() && (
                                <div className="mx-5 mt-2 mb-2">
                                    <button
                                        className="w-full h-12 rounded-full text-white font-medium bg-gradient-to-r from-[#C6A960] to-[#D4B76E] hover:opacity-90 transition-opacity"
                                        onClick={() => {
                                            navigate("/");
                                            logout();
                                        }}
                                    >
                                        Log Out
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}


export default function SimplePaymentLayout() {
    return <SimplePaymentLayoutContent />;
}

function SimplePaymentLayoutContent() {
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
    const { logout, identity, handleLogin } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (isProfileDropdownOpen && !event.target.closest(".profile-dropdown")) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isProfileDropdownOpen]);

    return (
        <div className="relative flex flex-col md:flex-row min-h-screen bg-white w-full">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-10 w-full flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
                <Link to="/">
                    <img
                        src="/assets/logo-fradium-paylink-lighttheme.svg"
                        alt="Fradium Logo Paylink"
                    />
                </Link>
                <SimplePaymentRightActions
                    isProfileDropdownOpen={isProfileDropdownOpen}
                    setIsProfileDropdownOpen={setIsProfileDropdownOpen}
                    navigate={navigate}
                    logout={logout}
                    identity={identity}
                    handleLogin={handleLogin}
                />
            </div>

            {/* Left Sidebar - Logo (Desktop) */}
            <aside className="fixed top-0 left-0 z-[10000] w-[200px] lg:w-[240px] xl:w-[300px] bg-transparent flex-col py-8 pl-5 lg:pl-7 xl:pl-8 hidden md:flex h-screen">
                <Link to="/" className="flex items-center gap-3">
                    <img
                        src="/assets/logo-fradium-paylink-lighttheme.svg"
                        alt="Fradium Logo Paylink"
                        className="h-8"
                    />
                </Link>
            </aside>

           {/* Main Content */}
            <main className="relative z-10 flex-1 w-full max-w-full p-4 md:p-8 flex flex-col items-center justify-start pt-6 md:pt-16 min-h-0 md:ml-[200px] lg:ml-[240px] xl:ml-[300px] md:mr-[80px] lg:mr-[100px] xl:mr-[120px] mt-[72px] md:mt-0">
                <div className="w-full max-w-[95vw] sm:max-w-[42rem] md:max-w-[48rem] lg:max-w-[56rem] xl:max-w-[64rem]">
                    <Outlet />
                </div>
            </main>

            {/* Right Sidebar - User Actions (Desktop) */}
            <aside className="fixed top-0 right-0 z-10 w-auto bg-transparent flex-col pt-6 pr-4 lg:pr-6 pb-6 pl-2 hidden md:flex h-screen">
                <div className="flex justify-end">
                    <SimplePaymentRightActions
                        isProfileDropdownOpen={isProfileDropdownOpen}
                        setIsProfileDropdownOpen={setIsProfileDropdownOpen}
                        navigate={navigate}
                        logout={logout}
                        identity={identity}
                        handleLogin={handleLogin}
                    />
                </div>
            </aside>
        </div>
    );
}
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/core/providers/AuthProvider";
import { useWallet } from "@/core/providers/WalletProvider";
import { TOKENS_CONFIG } from "@/core/config/tokenConfig.js";
import { getBalance } from "@/core/lib/tokenUtils.js";
import { agentService } from "@/core/services/agentService.js";

export default function AIAssistantWidget() {
  const { user, identity } = useAuth();
  const walletContext = useWallet();
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([{ id: "m1", role: "assistant", text: "Hello! I'm your Fradium AI Assistant. How can I help you today?", ts: Date.now() }]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const chipsRef = React.useRef(null);
  const messagesContainerRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const didLoadFromStorageRef = React.useRef(false);

  const principalString = React.useMemo(() => {
    try {
      const p = (typeof identity?.getPrincipal === "function" ? identity.getPrincipal() : null) || (typeof user?.identity?.getPrincipal === "function" ? user.identity.getPrincipal() : null);
      return p?.toString() || "default";
    } catch (_e) {
      return "default";
    }
  }, [identity, user]);

  const getStorageKey = React.useCallback(() => `aiChat_${principalString}`, [principalString]);

  const formatTimestamp = React.useCallback((ts) => {
    const d = new Date(ts);
    const now = new Date();
    const isSameDay = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (isSameDay) {
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  }, []);

  // Lock background scroll when chat is open
  React.useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      const prevTouchAction = document.body.style.touchAction;
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none"; // prevent iOS rubber-band
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.touchAction = prevTouchAction;
      };
    }
  }, [isOpen]);

  // Set wallet context to agent service
  React.useEffect(() => {
    agentService.setWalletContext(walletContext);
    agentService.setAuthContext({ identity, user });
  }, [walletContext, identity, user]);

  // Prebuilt sparkles vectors (emanate from center fast, random spread)
  const sparkles = React.useMemo(() => {
    const count = 20;
    return Array.from({ length: count }).map((_, i) => ({
      i,
      rnd: (0.5 + Math.random() * 0.5).toFixed(2), // 0.5..1.0
      a: Math.random().toFixed(3), // 0..1 (as fraction of 360deg)
      r: (0.6 + Math.random() * 1.2).toFixed(2), // 0.6..1.8 rem multiplier
    }));
  }, []);

  const handleToggle = () => setIsOpen((v) => !v);

  const sendText = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const now = Date.now();
    const userMsg = { id: `u-${now}`, role: "user", text: trimmed, ts: now };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Intercept command: "get my balance <token>"
      const cmdMatch = /^get my balance\s+(.+)$/i.exec(trimmed);
      if (cmdMatch && cmdMatch[1]) {
        const tokenQuery = cmdMatch[1].trim();

        // Find token by symbol or name (case-insensitive)
        const token = TOKENS_CONFIG.find((t) => t.symbol.toLowerCase() === tokenQuery.toLowerCase() || t.name.toLowerCase() === tokenQuery.toLowerCase());

        const ats = Date.now();
        if (!token) {
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${ats}`,
              role: "assistant",
              text: `Sorry, I couldn't find a token named "${tokenQuery}". Please try a valid token symbol or name (e.g., ETH, Bitcoin, ICP).`,
              ts: ats,
            },
          ]);
          return;
        }

        // Resolve principal for ICRC tokens
        let principal = null;
        try {
          principal = typeof identity?.getPrincipal === "function" ? identity.getPrincipal() : null;
        } catch (_e) {}

        // Fetch balance via reusable tokenUtils
        let balanceText = "0";
        try {
          const raw = await getBalance(token.id, principal, true);
          balanceText = String(raw);
        } catch (e) {
          const errMsg = e?.message || "Unknown error";
          setMessages((prev) => [
            ...prev,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: `Failed to fetch ${token.symbol} balance: ${errMsg}`,
              ts: Date.now(),
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${ats}`,
            role: "assistant",
            text: `Your ${token.name} (${token.symbol}) balance is ${balanceText}.`,
            ts: ats,
          },
        ]);
        return;
      }

      // Prepare chat history for agent
      const chatHistory = messages.map((msg) => ({
        role: msg.role === "user" ? "human" : "ai",
        content: msg.text,
      }));

      // Process message with agent service
      const response = await agentService.processMessage(trimmed, chatHistory);

      const ats = Date.now();
      if (response.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${ats}`,
            role: "assistant",
            text: response.response,
            ts: ats,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${ats}`,
            role: "assistant",
            text: `Sorry, an error occurred: ${response.error || "Unknown error"}. Please try again.`,
            ts: ats,
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      const ats = Date.now();
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${ats}`,
          role: "assistant",
          text: "Sorry, an error occurred while processing your message. Please try again.",
          ts: ats,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault?.();
    sendText(input);
    setInput("");
  };

  // Auto-scroll to bottom on new messages/open
  React.useEffect(() => {
    const el = messagesEndRef.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, isOpen]);

  React.useEffect(() => {
    try {
      const key = getStorageKey();
      const serializable = messages.map((m) => ({ id: m.id, role: m.role, text: m.text, ts: m.ts || Date.now() }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch (_e) {}
  }, [messages, getStorageKey]);

  React.useEffect(() => {
    const key = getStorageKey();
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          didLoadFromStorageRef.current = true;
          setMessages(parsed);
          return;
        }
      }
      if (!didLoadFromStorageRef.current) {
        setMessages([{ id: `m1-${Date.now()}`, role: "assistant", text: "Hello! I'm your Fradium AI Assistant. How can I help you today?", ts: Date.now() }]);
      }
    } catch (_e) {}
  }, [getStorageKey]);

  const handleSampleClick = (text) => {
    setInput(text);
    // Fokuskan ke input agar user bisa edit/enter
    requestAnimationFrame(() => {
      try {
        inputRef.current?.focus();
      } catch (_e) {}
    });
  };

  const scrollChipsBy = (delta) => {
    const el = chipsRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollLeft + delta, behavior: "smooth" });
  };

  return (
    <div className="fixed right-4 md:right-6 bottom-24 md:bottom-6 z-[60]">
      {/* Minimal scrollbar utilities */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Local keyframes for immersive ornaments */}
      {!isOpen && (
        <style>{`
          @keyframes sweep { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .ai-spark { position:absolute; background:white; width:10%; aspect-ratio:1; top:50%; left:50%; border-radius:50%; animation: sprkle calc(var(--rnd) * 3s) infinite linear; animation-delay: calc(var(--i) * -3s); transition: background .3s; }
          .button-fancy-ai:hover .ai-spark { background: pink; }
          @keyframes sprkle {
            0% { opacity:0; transform: translate(-50%, -50%) rotate(calc(var(--a) * 360deg)) translateY(calc(var(--r) * 0rem)) scale(calc(var(--rnd) * 0)); }
            30% { opacity:1; transform: translate(-50%, -50%) rotate(calc(var(--a) * 360deg)) translateY(calc(var(--r) * 1rem)) scale(calc(var(--rnd) * .3)); }
            70% { opacity:1; transform: translate(-50%, -50%) rotate(calc(var(--a) * 360deg)) translateY(calc(var(--r) * 2rem)) scale(calc(var(--rnd) * .7)); }
            100% { opacity:0; transform: translate(-50%, -50%) rotate(calc(var(--a) * 360deg)) translateY(calc(var(--r) * 3rem)) scale(calc(var(--rnd) * 1)); }
          }
        `}</style>
      )}
      {/* Floating Button */}
      <div className="relative inline-block button-fancy-ai">
        {!isOpen && (
          <>
            {/* Conic sweep ring */}
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-2 rounded-full opacity-50"
              style={{
                background: "conic-gradient(from 0deg, #BEB9FF, #7C72FE, #433BA6, #BEB9FF)",
                WebkitMask: "radial-gradient(farthest-side, #000 70%, transparent 72%)",
                mask: "radial-gradient(farthest-side, #000 70%, transparent 72%)",
                animation: "sweep 7s linear infinite",
              }}
            />
            {/* Sparkles using CSS variables-driven animation */}
            <div className="pointer-events-none absolute inset-0 z-20">
              {sparkles.map((s) => (
                <span key={s.i} className="ai-spark" style={{ ["--i"]: s.i, ["--rnd"]: s.rnd, ["--a"]: s.a, ["--r"]: s.r }} />
              ))}
            </div>
          </>
        )}
        <button
          aria-label="Open AI Assistant"
          onClick={handleToggle}
          className="relative z-10 group w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] border border-white/10 hover:border-white/20 transition-all"
          style={{
            background: "linear-gradient(180deg, rgba(124,114,254,0.95), rgba(67,59,166,0.95))",
            backdropFilter: "blur(10px)",
          }}>
          {/* AI Logo (inline SVG) */}
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-white drop-shadow">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.9" />
            <path d="M8.5 13.5c0-2.2 1.8-4 4-4 1.1 0 2 .9 2 2v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="sr-only">AI Assistant</span>
        </button>
      </div>

      {/* Overlay + Chat Panel with new animation */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay with tasteful blur */}
            <motion.button
              aria-label="Close AI Assistant"
              onClick={handleToggle}
              onWheel={(e) => {
                // prevent page scroll while overlay visible
                e.preventDefault();
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="fixed inset-0 z-[55] bg-black/35 backdrop-blur-md"
            />

            {/* Chat panel */}
            <motion.div initial={{ opacity: 0, y: 28, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.98 }} transition={{ type: "spring", stiffness: 340, damping: 26, mass: 0.7 }} className="absolute bottom-20 right-0 z-[60] w-[94vw] sm:w-[460px] md:w-[540px] rounded-2xl overflow-hidden border border-white/10 shadow-[0_16px_40px_rgba(0,0,0,0.5)]" style={{ background: "linear-gradient(180deg, rgba(17,22,28,0.96), rgba(11,17,22,0.92))", backdropFilter: "blur(12px)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-b from-[#7C72FE] to-[#433BA6] border border-white/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </div>
                  <div className="text-white font-medium">Fradium Agent</div>
                </div>
                <button onClick={handleToggle} className="text-white/70 hover:text-white transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="min-h-[40vh] md:min-h-[50vh] max-h-[65vh] overflow-y-auto no-scrollbar px-4 py-3 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }} transition={{ duration: 0.2, ease: "easeOut" }} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="flex max-w-[80%] flex-col gap-1">
                        <div className={`${m.role === "user" ? "bg-[#7C72FE] text-white" : "bg-white/5 text-white/90"} px-3 py-2 rounded-2xl text-sm border ${m.role === "user" ? "border-[#7C72FE]/40" : "border-white/10"}`}>{m.text}</div>
                        <div className={`text-[10px] ${m.role === "user" ? "text-white/70 text-right" : "text-white/40"}`}>{formatTimestamp(m.ts || Date.now())}</div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-start">
                      <div className="flex max-w-[80%] flex-col gap-1">
                        <div className="bg-white/5 text-white/90 px-3 py-2 rounded-2xl text-sm border border-white/10 flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                          <span className="text-white/60">AI is thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Sample inputs (horizontal scroll) */}
              <div className="px-3 pb-2">
                <div className="relative">
                  {/* Drag only: removed left/right buttons */}

                  {/* Chips rail */}
                  <div
                    ref={chipsRef}
                    className="flex items-center gap-2 overflow-x-auto overflow-y-hidden no-scrollbar py-1 overscroll-contain touch-pan-x px-2 cursor-grab active:cursor-grabbing select-none"
                    style={{ overscrollBehaviorX: "contain" }}
                    onWheel={(e) => {
                      const el = chipsRef.current;
                      if (!el) return;
                      // Convert vertical wheel to horizontal scroll and prevent page scroll
                      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                        el.scrollLeft += e.deltaY;
                      }
                    }}
                    onMouseDown={(e) => {
                      const el = chipsRef.current;
                      if (!el) return;
                      el.dataset.dragging = "true";
                      el.dataset.startX = String(e.pageX - el.offsetLeft);
                      el.dataset.scrollLeft = String(el.scrollLeft);
                    }}
                    onMouseLeave={() => {
                      const el = chipsRef.current;
                      if (el) delete el.dataset.dragging;
                    }}
                    onMouseUp={() => {
                      const el = chipsRef.current;
                      if (el) delete el.dataset.dragging;
                    }}
                    onMouseMove={(e) => {
                      const el = chipsRef.current;
                      if (!el || el.dataset.dragging !== "true") return;
                      e.preventDefault();
                      e.stopPropagation();
                      const startX = Number(el.dataset.startX || 0);
                      const startLeft = Number(el.dataset.scrollLeft || 0);
                      const x = e.pageX - el.offsetLeft;
                      const walk = (x - startX) * 1;
                      el.scrollLeft = startLeft - walk;
                    }}
                    onTouchStart={(e) => {
                      const el = chipsRef.current;
                      if (!el) return;
                      el.dataset.tStartX = String(e.touches[0].clientX);
                      el.dataset.tStartLeft = String(el.scrollLeft);
                    }}
                    // Jangan panggil preventDefault dalam passive listener
                    onTouchMove={(e) => {
                      const el = chipsRef.current;
                      if (!el) return;
                      const startX = Number(el.dataset.tStartX || 0);
                      const startLeft = Number(el.dataset.tStartLeft || 0);
                      const x = e.touches[0].clientX;
                      const walk = (x - startX) * 1;
                      el.scrollLeft = startLeft - walk;
                    }}>
                    {["Check my ETH balance", "What's the balance of wallet 0x123...", "Show Bitcoin balance", "Check Solana balance", "Analyze address risk", "Refresh all balances", "Show Bitcoin price", "Check ICP balance"].map((sample) => (
                      <button key={sample} type="button" onClick={() => handleSampleClick(sample)} className="shrink-0 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs border border-white/10 hover:border-white/20 transition-colors" title={sample}>
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="px-3 pb-3 pt-1">
                <div className="flex items-center gap-2 bg-[#23272F] border border-[#393E4B] rounded-xl px-2 py-2">
                  <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a command... e.g., Check my Bitcoin balance" className="flex-1 bg-transparent outline-none text-white text-sm placeholder-[#B0B6BE] px-2" disabled={isLoading} />
                  <button type="submit" disabled={isLoading} className="px-3 py-1.5 rounded-lg bg-[#7C72FE] text-white text-sm hover:brightness-110 active:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? "..." : "Send"}
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-white/40 text-center">
                  Powered by <span className="text-white/70">Gemini AI</span> & <span className="text-white/70">LangChain</span>.
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

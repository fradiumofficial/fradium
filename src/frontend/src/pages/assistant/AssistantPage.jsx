import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import ButtonA from "@/core/components/SidebarButton";
import ButtonGreen from "@/core/components/ButtonGreen";
import { chatbot } from "declarations/chatbot";

const BACKGROUND_URL = "https://cdn.jsdelivr.net/gh/fradiumofficial/fradium-asset@main/backgrounds/background-1.webp";

// Fungsi untuk mengubah teks dengan * menjadi bold
const formatTextWithBold = (text) => {
  if (typeof text !== "string") return text;

  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("*") && part.endsWith("*")) {
      // Hapus simbol * dan bungkus dengan tag strong
      return (
        <strong key={index} className="font-bold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return part;
  });
};

const ChatBubble = ({ type, message, time, isLink, isList, loading }) => {
  if (type === "user") {
    return (
      <div className="flex items-end gap-3 self-end">
        <div className="flex flex-col items-end">
          <div className="bg-[#823EFD] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl rounded-br-md text-sm md:text-base max-w-2xl mb-1 shadow-lg border border-[#823EFD]">
            {isLink ? (
              <a href={message} className="underline text-white" target="_blank" rel="noopener noreferrer">
                {message}
              </a>
            ) : (
              formatTextWithBold(message)
            )}
          </div>
          <span className="text-xs text-[#B0B6BE] mt-1">{time}</span>
        </div>
      </div>
    );
  }
  // bot
  return (
    <div className="flex items-start gap-3 self-start">
      <img src="logo.svg" alt="Fradium" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full select-none" />
      <div>
        {loading ? (
          <div className="bg-[#FFFFFF0D] text-white px-4 sm:px-5 py-3 sm:py-4 rounded-2xl rounded-tl-md text-sm md:text-base max-w-2xl mb-1 shadow-lg border border-[#FFFFFF1A]">
            <div className="flex items-center gap-1.5" aria-label="Assistant is typing">
              <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-white/70 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <div className="bg-[#FFFFFF0D] text-white px-4 sm:px-5 py-3 rounded-2xl rounded-tl-md text-sm md:text-base max-w-2xl mb-1 shadow-lg border border-[#FFFFFF1A]">
            {isList ? (
              <ol className="list-decimal ml-5">
                {message.map((item, idx) => (
                  <li key={idx}>{formatTextWithBold(item)}</li>
                ))}
              </ol>
            ) : (
              formatTextWithBold(message)
            )}
          </div>
        )}
        <span className="text-xs text-[#B0B6BE] mt-1">{time}</span>
      </div>
    </div>
  );
};

// Helper untuk waktu (HH:mm)
function getTimeNow() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const LOCAL_KEY = "fradium-assistant-history";

const suggestedQuestions = ["How do I scan a wallet address?", "How can I report a suspicious address?", "How does voting on reports work?", "How do I earn FUM tokens?", "How do I stake tokens for voting?", "Does Fradium support Bitcoin and Solana?", "What is Proof of Credible Contribution?"];

const Assistant = () => {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]); // {type, message, time, isLink, isList}
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const chatEndRef = useRef(null);

  // Load history dari localStorage saat mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_KEY);
      if (saved) {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
      } else {
        const initialHistory = [{ type: "bot", message: "I'm Fradium Assistant, your guide to safe Web3 interactions and credible contributions. How can I help you today?", time: getTimeNow() }];
        setHistory(initialHistory);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(initialHistory));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      const initialHistory = [{ type: "bot", message: "I'm Fradium Assistant, your guide to safe Web3 interactions and credible contributions. How can I help you today?", time: getTimeNow() }];
      setHistory(initialHistory);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(initialHistory));
    }
  }, []);

  // Update localStorage dan scroll setiap history berubah
  const updateHistory = (newHistory) => {
    setHistory(newHistory);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(newHistory));
    // Scroll ke bawah otomatis
    setTimeout(() => {
      if (chatEndRef.current) {
        chatEndRef.current.scrollIntoView({
          behavior: "smooth",
          block: "end",
          inline: "nearest",
        });
      }
    }, 100);
  };

  // Handle kirim pesan
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = {
      type: "user",
      message: input,
      time: getTimeNow(),
      isLink: input.startsWith("http"),
    };

    const loadingMsg = {
      type: "bot",
      message: "...",
      time: getTimeNow(),
      loading: true,
    };

    const currentHistory = [...history, userMsg, loadingMsg];
    updateHistory(currentHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await chatbot.ask(input);
      let botMsg = "";
      if (res && res.Ok) {
        botMsg = res.Ok;
      } else if (res && res.Err) {
        botMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
      } else {
        botMsg = "Maaf, tidak ada respon.";
      }

      const newHistory = [...history, userMsg, { type: "bot", message: botMsg, time: getTimeNow() }];
      updateHistory(newHistory);
    } catch (e) {
      console.error("Error sending message:", e);
      const errorHistory = [...history, userMsg, { type: "bot", message: "Maaf, terjadi error koneksi.", time: getTimeNow() }];
      updateHistory(errorHistory);
    } finally {
      setLoading(false);
    }
  };

  // Clear history
  const handleClear = () => {
    const initialHistory = [{ type: "bot", message: "I'm Fradium Assistant, your guide to safe Web3 interactions and credible contributions. How can I help you today?", time: getTimeNow() }];
    updateHistory(initialHistory);
  };

  // Enter untuk kirim
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <section className="relative bg-[#000510] w-full overflow-hidden">
      {/* Background layer */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img src={BACKGROUND_URL} alt="" aria-hidden="true" decoding="async" loading="lazy" draggable={false} className="absolute inset-0 object-contain w-full h-full translate-y-[-4%] md:translate-y-0" />
      </div>

      <div className="relative z-10">
        {/* MOBILE ONLY */}
        <div className="block md:hidden min-h-screen pt-[70px] pb-[130px] px-3 sm:px-4 w-full">
          <div className="flex flex-col h-full w-full max-w-full">
            {/* Header */}
            <div className="flex items-center justify-between px-2 sm:px-3 pt-1.5 pb-1">
              <div>
                <div className="text-sm sm:text-base font-normal text-white mb-0.5">Fradium Assistant</div>
                <div className="text-[#B0B6BE] text-[11px] sm:text-xs">Ask anything about Fradium</div>
              </div>
              <button onClick={handleClear} size="sm" className="!bg-transparent text-xs !text-[#ffffff] !shadow-none hover:!bg-[#23272f] px-2 py-1 flex items-center gap-2">
                <img src="/assets/icons/Trash.svg" alt="Clear" className="w-4 h-4" />
              </button>
            </div>
            <div className="border-b border-[#23272f] mb-2 mx-2 sm:mx-3" />
            {/* Chat Bubbles */}
            <div className="flex flex-col gap-2.5 overflow-y-auto h-[62vh] flex-none px-1.5 sm:px-2 pb-2 pt-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#23272F] [&::-webkit-scrollbar-thumb]:bg-[#393E4B] [&::-webkit-scrollbar-thumb]:rounded-full">
              {history.map((item, idx) => (
                <ChatBubble key={idx} {...item} />
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 bg-[#23272f] rounded-xl border border-[#23272f] px-2.5 sm:px-3 py-2.5 sm:py-3 mx-2 mt-2">
              <input type="text" placeholder="Tulis pesan..." className="flex-1 bg-transparent outline-none border-none text-white text-xs sm:text-sm placeholder-[#B0B6BE] py-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
              <ButtonGreen size="sm" className="!rounded-full !px-3 !py-2.5 sm:!py-3" onClick={handleSend} disabled={loading || !input.trim()}>
                <img src="/assets/icons/submit.svg" alt="Send" className="w-4 h-4 sm:w-5 sm:h-5" />
              </ButtonGreen>
            </div>
            {/* Suggested Question (collapsible) */}
            <div className="relative z-20 w-full rounded-xl border border-white/10 bg-[#000000]/80 backdrop-blur-[2px] shadow-[0_12px_32px_rgba(0,0,0,0.35)] p-2.5 mt-8 mb-28 pb-2 mx-0">
              <button
                type="button"
                className="w-full flex items-center justify-between text-left px-1 py-1.5"
                onClick={() => setShowSuggestions((v) => !v)}
              >
                <span className="text-[15px] font-semibold text-white">Suggested Question</span>
                <ChevronDown className={`w-4 h-4 text-white transition-transform ${showSuggestions ? "rotate-180" : "rotate-0"}`} />
              </button>
              {showSuggestions && (
                <>
                  <div className="border-b border-[#23272f] my-2" />
                  <ul className="flex flex-col gap-1.5 overflow-y-auto max-h-[220px] pr-1 pb-2 relative z-20">
                    {suggestedQuestions.map((q, idx) => (
                      <li
                        key={idx}
                        className="px-2.5 py-2.5 rounded-md text-[#B0B6BE] hover:bg-[#23272f] transition cursor-pointer select-none text-sm"
                        style={{ fontWeight: 500 }}
                        onClick={async () => {
                          if (loading) return;
                          setInput("");
                          setShowSuggestions(false);
                          const userMsg = {
                            type: "user",
                            message: q,
                            time: getTimeNow(),
                            isLink: q.startsWith("http"),
                          };
                          const loadingMsg = {
                            type: "bot",
                            message: "...",
                            time: getTimeNow(),
                            loading: true,
                          };
                          const currentHistory = [...history, userMsg, loadingMsg];
                          updateHistory(currentHistory);
                          setLoading(true);
                          try {
                            const res = await chatbot.ask(q);
                            let botMsg = "";
                            if (res && res.Ok) {
                              botMsg = res.Ok;
                            } else if (res && res.Err) {
                              botMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
                            } else {
                              botMsg = "Maaf, tidak ada respon.";
                            }
                            const newHistory = [...history, userMsg, { type: "bot", message: botMsg, time: getTimeNow() }];
                            updateHistory(newHistory);
                          } catch (e) {
                            const errorHistory = [...history, userMsg, { type: "bot", message: "Maaf, terjadi error koneksi.", time: getTimeNow() }];
                            updateHistory(errorHistory);
                          }
                          setLoading(false);
                        }}>
                        {q}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* DESKTOP ONLY */}
        <div className="hidden md:flex overflow-hidden pt-[96px] md:pt-[100px] px-6 lg:px-12 xl:px-20 2xl:px-24 flex-col md:flex-row gap-x-4">
          {/* Left: Chat Area */}
          <div className="flex-1 max-w-4xl mx-auto rounded-[16px] border border-white/10 bg-[#000000]/50 backdrop-blur-[2px] shadow-[0_16px_48px_rgba(0,0,0,0.40)] p-5 md:p-7 lg:p-8 flex flex-col h-[calc(100vh-170px)] md:h-[calc(100vh-180px)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-base md:text-xl font-normal text-white mb-1">Fradium Assistant</div>
                <div className="text-[#B0B6BE] text-sm">Ask anything about Fradium</div>
              </div>
              <button onClick={handleClear} size="sm" className="!bg-transparent text-sm !text-[#ffffff] !shadow-none hover:!bg-[#23272f] px-3 py-2 flex items-center gap-2">
                <img src="/assets/icons/Trash.svg" alt="Clear" className="w-5 h-5" />
                Clear History
              </button>
            </div>
            <div className="border-b border-[#23272f] mb-6" />
            {/* Chat Bubbles */}
            <div className="flex flex-col gap-6 overflow-y-auto flex-1 pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#23272F] [&::-webkit-scrollbar-thumb]:bg-[#393E4B] [&::-webkit-scrollbar-thumb]:rounded-full">
              {history.map((item, idx) => (
                <ChatBubble key={idx} {...item} />
              ))}
              <div ref={chatEndRef} />
            </div>
            {/* Input */}
            <div className="flex items-center gap-2 mt-auto bg-[#FFFFFF1A] rounded-2xl lg:rounded-3xl border border-[#2C3240] px-3.5 lg:px-4 py-2 shadow-inner">
              <input type="text" placeholder="Message Fradium Assistant..." className="flex-1 bg-transparent outline-none border-none text-white text-sm md:text-base placeholder-[#B0B6BE] py-2" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
              <ButtonGreen size="sm" className="!rounded-full !px-3 !py-2.5 lg:!py-3" onClick={handleSend} disabled={loading || !input.trim()}>
                <img src="/assets/icons/submit.svg" alt="Send" />
              </ButtonGreen>
            </div>
          </div>
          {/* Right: Suggested Question */}
          <div className="w-full md:w-[320px] lg:w-[340px] mx-auto rounded-[16px] border border-white/10 bg-[#000000]/60 backdrop-blur-[2px] shadow-[0_16px_48px_rgba(0,0,0,0.40)] p-5 md:p-6 lg:p-8 flex flex-col h-[calc(100vh-170px)] md:h-[calc(100vh-180px)] md:mt-0 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="text-lg font-medium text-white">Suggested Question</div>
            </div>
            <div className="border-b border-[#23272f] mb-4" />
            <ul className="flex flex-col gap-2 overflow-y-auto pr-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-[#23272F] [&::-webkit-scrollbar-thumb]:bg-[#393E4B] [&::-webkit-scrollbar-thumb]:rounded-full">
              {suggestedQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition cursor-pointer select-none"
                  style={{ fontWeight: 500 }}
                  onClick={async () => {
                    if (loading) return;
                    setInput("");
                    const userMsg = {
                      type: "user",
                      message: q,
                      time: getTimeNow(),
                      isLink: q.startsWith("http"),
                    };
                    const loadingMsg = {
                      type: "bot",
                      message: "...",
                      time: getTimeNow(),
                      loading: true,
                    };
                    const currentHistory = [...history, userMsg, loadingMsg];
                    updateHistory(currentHistory);
                    setLoading(true);
                    try {
                      const res = await chatbot.ask(q);
                      let botMsg = "";
                      if (res && res.Ok) {
                        botMsg = res.Ok;
                      } else if (res && res.Err) {
                        botMsg = "Maaf, terjadi kesalahan. Silakan coba lagi.";
                      } else {
                        botMsg = "Maaf, tidak ada respon.";
                      }
                      const newHistory = [...history, userMsg, { type: "bot", message: botMsg, time: getTimeNow() }];
                      updateHistory(newHistory);
                    } catch (e) {
                      const errorHistory = [...history, userMsg, { type: "bot", message: "Maaf, terjadi error koneksi.", time: getTimeNow() }];
                      updateHistory(errorHistory);
                    }
                    setLoading(false);
                  }}>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* footer */}
      <div className="fixed md:relative left-0 right-0 bottom-0 z-30 pt-3 pb-4 bg-black from-[#000510] to-transparent">
        <p className="text-center text-xs text-[#B0B6BE] px-3">Copyright ©{new Date().getFullYear()} Fradium. All rights reserved</p>
      </div>

      {/* bottom fade (desktop only) */}
      <div className="pointer-events-none hidden md:block absolute inset-x-0 bottom-0 h-[600px] bg-gradient-to-b from-transparent to-[#000510]" />
    </section>
  );
};

export default Assistant;

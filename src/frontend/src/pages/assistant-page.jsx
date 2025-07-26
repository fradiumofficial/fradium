import React, { useState, useEffect, useRef } from "react";
import ButtonA from "@/core/components/SidebarButton";
import { chatbot } from "declarations/chatbot";

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

const ChatBubble = ({ type, message, time, isLink, isList }) => {
  if (type === "user") {
    return (
      <div className="flex items-end gap-3 self-end">
        <div className="flex flex-col items-end">
          <div className="bg-[#A259FF] text-white px-5 py-2.5 rounded-2xl rounded-br-md text-base max-w-2xl mb-1 shadow-lg border border-[#A259FF]">
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
      <div className="rounded-full bg-[#23272f] flex items-center justify-center">
        <img src="logo.svg" alt="Fradium" className="w-10 h-10" />
      </div>
      <div>
        <div className="bg-[#23272f] text-white px-5 py-3 rounded-2xl rounded-tl-md text-base max-w-2xl mb-1 shadow-lg border border-[#FFFFFF1A]">
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
    <>
      {/* MOBILE ONLY */}
      <div className="block md:hidden h-screen bg-[#000510] pt-[70px] pb-[90px] px-0 w-full">
        <div className="flex flex-col h-full w-full max-w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <div>
              <div className="text-base font-normal text-white mb-0.5">Fradium Assistant</div>
              <div className="text-[#B0B6BE] text-xs">Tanya apa saja tentang Fradium</div>
            </div>
            <button onClick={handleClear} size="sm" className="!bg-transparent text-xs !text-[#ffffff] !shadow-none hover:!bg-[#23272f] px-2 py-1 flex items-center gap-2">
              <img src="/assets/icons/Trash.svg" alt="Clear" className="w-4 h-4" />
            </button>
          </div>
          <div className="border-b border-[#23272f] mb-2 mx-3" />
          {/* Chat Bubbles */}
          <div className="flex flex-col gap-3 overflow-y-auto flex-1 px-2 pb-2 pt-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-[#23272F] [&::-webkit-scrollbar-thumb]:bg-[#393E4B] [&::-webkit-scrollbar-thumb]:rounded-full">
            {history.map((item, idx) => (
              <ChatBubble key={idx} {...item} />
            ))}
            <div ref={chatEndRef} />
          </div>
          {/* Input */}
          <div className="flex items-center gap-2 bg-[#23272f] rounded-xs border border-[#23272f] px-3 py-3 mx-2 mt-2">
            <input type="text" placeholder="Tulis pesan..." className="flex-1 bg-transparent outline-none border-none text-white text-xs placeholder-[#B0B6BE] py-1" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
            <ButtonA size="sm" className="" onClick={handleSend} disabled={loading || !input.trim()}>
              <img src="/assets/icons/submit.svg" alt="Send" className="w-5 h-5" />
            </ButtonA>
          </div>
          {/* Suggested Question */}
          <div className="w-full bg-[#181C22] rounded-xl shadow p-3 mt-3 mx-0">
            <div className="text-sm font-semibold text-white mb-2">Suggested Question</div>
            <div className="border-b border-[#23272f] mb-2" />
            <ul className="flex flex-col gap-1 overflow-y-auto max-h-[120px] pr-1">
              {suggestedQuestions.map((q, idx) => (
                <li
                  key={idx}
                  className="px-2 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition cursor-pointer select-none text-xs"
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
                  }}
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* DESKTOP ONLY */}
      <div className="hidden md:flex h-screen mb-32 overflow-hidden bg-[#000510] pt-[110px] px-0 md:px-8 flex-col md:flex-row gap-x-8">
        {/* Left: Chat Area */}
        <div className="flex-1 mx-auto bg-[#181C22] rounded-xl shadow p-8 flex flex-col h-[calc(100vh-180px)]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-base md:text-xl font-normal text-white mb-1">Fradium Assistant</div>
              <div className="text-[#B0B6BE] text-sm">Tanya apa saja tentang Fradium</div>
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
          <div className="flex items-center gap-2 mt-auto bg-[#23272f] rounded-xs border border-[#23272f] px-4 py-4">
            <input type="text" placeholder="Tulis pesan..." className="flex-1 bg-transparent outline-none border-none text-white text-base placeholder-[#B0B6BE] py-2" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} />
            <ButtonA size="sm" className="" onClick={handleSend} disabled={loading || !input.trim()}>
              <img src="/assets/icons/submit.svg" alt="Send" />
            </ButtonA>
          </div>
        </div>
        {/* Right: Suggested Question */}
        <div className="w-full md:w-[340px] mx-auto bg-[#181C22] rounded-xl shadow p-8 flex flex-col h-[calc(100vh-180px)] md:mt-0 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-white">Suggested Question</div>
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
                }}
              >
                {q}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
};

export default Assistant;

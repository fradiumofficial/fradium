import React from "react";
import ButtonA from "@/core/components/SidebarButton";

const ChatBubble = ({ type, message, time, isLink, isList }) => {
    if (type === "user") {
        return (
            <div className="flex items-end gap-3 self-end">
                <div className="flex flex-col items-end">
                    <div className="bg-[#A259FF] text-white px-5 py-2.5 rounded-2xl rounded-br-md text-base max-w-2xl mb-1 shadow-lg border border-[#A259FF]">
                        {isLink ? (
                            <a href={message} className="underline text-white" target="_blank" rel="noopener noreferrer">{message}</a>
                        ) : message}
                    </div>
                    <span className="text-xs text-[#B0B6BE] mt-1">{time} ✓✓</span>
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
                            {message.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ol>
                    ) : message}
                </div>
                <span className="text-xs text-[#B0B6BE] mt-1">{time} ✓✓</span>
            </div>
        </div>
    );
};

const Assistant = () => {
    return (
        <div className="min-h-screen mb-32 bg-[#000510] pt-[110px] px-0 md:px-8 flex flex-col md:flex-row gap-x-8">
            {/* Left: Chat Area */}
            <div className="flex-1 mx-auto bg-[#181C22] rounded-xl shadow p-8 flex flex-col mb-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <div className="text-base md:text-xl font-normal text-white mb-1">Fradium Assistant</div>
                        <div className="text-[#B0B6BE] text-sm">Ask anything about Fradium</div>
                    </div>
                    <button size="sm" className="!bg-transparent text-sm !text-[#ffffff] !shadow-none hover:!bg-[#23272f] px-3 py-2 flex items-center gap-2">
                        <img src="/assets/icons/Trash.svg" alt="Clear" className="w-5 h-5" />
                        Clear History
                    </button>
                </div>
                <div className="border-b border-[#23272f] mb-6" />
                {/* Chat Bubbles */}
                <div className="flex flex-col gap-6 mb-6">
                    <ChatBubble type="bot" message="Hello! I'm your personal AI Assistant Slothpilot." time="10:25" />
                    <ChatBubble type="user" message="https://www.externallink.com" time="01:25" isLink />
                    <ChatBubble type="bot" message={["Do Androids Dream of Electric Sheep? is a 1968 dystopian science fiction novel by American writer Philip K. Dick. Set in a post-apocalyptic San Francisco, the story unfolds after a devastating global war.",
                        "1. Androids and Humans: The novel explores the uneasy coexistence of humans and androids. Androids, manufactured on Mars, rebel, kill their owners, and escape to Earth, where they hope to remain undetected.",
                        "2. Empathy and Identity: To distinguish androids from humans, the Voigt-Kampff Test measures emotional responses. Androids lack empathy, making them vulnerable to detection.",
                        "3. Status Symbols: Owning real animals is a status symbol due to mass extinctions. Poor people resort to realistic electronic imitations of live animals, concealing their true nature from neighbors."]} time="12:25" isList />
                    <ChatBubble type="user" message="https://www.externallink.com" time="01:25" isLink />
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 mt-auto bg-[#23272f] rounded-xs border border-[#23272f] px-4 py-4">
                    <input
                        type="text"
                        placeholder="Message slothGPT..."
                        className="flex-1 bg-transparent outline-none border-none text-white text-base placeholder-[#B0B6BE] py-2"
                    />
                    <ButtonA size="sm" className="">
                        <img src="/assets/icons/submit.svg" alt="Send" />
                    </ButtonA>
                </div>
            </div>
            {/* Right: Suggested Question */}
            <div className="w-full md:w-[340px] mx-auto bg-[#181C22] rounded-xl shadow p-8 flex flex-col mt-8 md:mt-0">
                <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-white">Suggested Question</div>
                    <button className="text-[#B0B6BE] text-base flex items-center gap-1">
                        <span>▼</span>
                    </button>
                </div>
                <div className="border-b border-[#23272f] mb-4" />
                <ul className="flex flex-col gap-2">
                    <li className="px-4 py-2 rounded-lg text-white bg-[#23272f] border-r-4 border-[#A259FF] font-semibold">How are actions verified?</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">How do FUM tokens work?</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">What eco-friendly actions can I take?</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">What rewards can I earn?</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">Tell me about impact projects</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">How does the community work?</li>
                    <li className="px-4 py-2 rounded-lg text-[#B0B6BE] hover:bg-[#23272f] transition">What eco-friendly actions can I take?</li>
                </ul>
            </div>
        </div>
    );
};

export default Assistant;

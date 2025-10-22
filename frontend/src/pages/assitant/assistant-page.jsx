import { useState, useRef, useEffect } from "react";
import { ArrowUp, Leaf, Loader2, Bot, Trash2 } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Avatar } from "@/core/components/ui/avatar";
import { Card } from "@/core/components/ui/card";
import { chatbot } from "declarations/chatbot";
import { toast } from "react-toastify";

// Suggested questions for the user
const suggestedQuestions = [
  { text: "How do LUM tokens work?", query: "How do LUM tokens work?" },
  { text: "What eco-friendly actions can I take?", query: "What eco-friendly actions can I take?" },
  { text: "How are actions verified?", query: "How are actions verified?" },
  { text: "What rewards can I earn?", query: "What rewards can I earn?" },
  { text: "Tell me about impact projects", query: "Tell me about impact projects" },
  { text: "How does the community work?", query: "How does the community work?" },
];

const CHAT_HISTORY_KEY = "lumora_chat_history";

const AssistantPage = () => {
  const [messages, setMessages] = useState(() => {
    // Load chat history from localStorage on initial render
    const savedHistory = localStorage.getItem(CHAT_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        return parsedHistory.map((msg) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
      } catch (error) {
        console.error("Error parsing chat history:", error);
        return [{ role: "assistant", content: "I'm Lumora Assistant, your guide to sustainable actions and rewards. How can I help you today?", timestamp: new Date() }];
      }
    }
    return [{ role: "assistant", content: "I'm Lumora Assistant, your guide to sustainable actions and rewards. How can I help you today?", timestamp: new Date() }];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleClearHistory = () => {
    const initialMessage = { role: "assistant", content: "I'm Lumora Assistant, your guide to sustainable actions and rewards. How can I help you today?", timestamp: new Date() };
    setMessages([initialMessage]);
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify([initialMessage]));
    toast.success("Chat history cleared");
  };

  const handleSendMessage = async (text = input) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatbot.prompt(text);

      const botMessage = {
        role: "assistant",
        content: response.Ok ?? "Sorry, I couldn't process your request at the moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log(error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (query) => {
    handleSendMessage(query);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <main className="flex-1 flex flex-col md:flex-row container mt-10 mb-24 gap-4">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-[calc(100vh-10rem)] bg-card rounded-lg border border-border/40">
        <div className="p-4 border-b border-white/20 bg-card flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3 items-center justify-center">
              <Leaf className="h-5 w-5 text-emerald-600" />
            </Avatar>
            <div>
              <h2 className="font-medium">Lumora Assistant</h2>
              <p className="text-sm text-muted-foreground">Ask anything about Lumora</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-muted-foreground hover:text-foreground">
            <Trash2 className="h-4 w-4 mr-2" />
            Clear History
          </Button>
        </div>

        {/* Messages container */}
        <div className="flex-1 overflow-y-auto" ref={chatContainerRef}>
          <div className="p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-lg p-3 ${message.role === "assistant" ? "bg-muted text-foreground" : "bg-emerald-500 text-emerald-foreground"}`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm text-muted-foreground">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-border/40 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about Lumora, sustainability actions, tokens, or projects..." className="flex-1" disabled={isLoading} />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 flex-shrink-0 space-y-4">
        <Card className="border-border/40">
          <div className="p-4 border-b border-border/40">
            <h3 className="font-medium">Suggested Questions</h3>
          </div>
          <div className="p-3 space-y-2">
            {suggestedQuestions.map((question, index) => (
              <Button key={index} variant="ghost" className="w-full justify-start text-sm h-auto py-2 px-3 font-normal" onClick={() => handleSuggestedQuestion(question.query)} disabled={isLoading}>
                {question.text}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
};

export default AssistantPage;

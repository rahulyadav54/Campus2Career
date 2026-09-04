import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Bot, User, RefreshCw, ChevronRight } from "lucide-react";
import apiClient from "../services/apiClient";

const SUGGESTED_PROMPTS = [
  "What skills do I need for Data Science & Analytics?",
  "How can I bridge my React & Web Dev skill gaps?",
  "Suggest a 4-week roadmap for Machine Learning.",
  "What certifications carry maximum weight for recruiters?"
];

export default function CareerAdvisorChat() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I'm **Campus2Career AI Advisor**.\n\nAsk me anything about skill roadmaps, career options, industry demands, or how to prepare for top placement opportunities!"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg = { sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/ai/career-advisor", { prompt: textToSend });
      const aiReply = res?.answer || "I'm sorry, I couldn't process that. Please try asking again.";
      const source = res?.source || "Campus2Career AI Engine";

      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: aiReply, source }
      ]);
    } catch (err) {
      console.error("AI Advisor error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "⚠️ System connection notice: Unable to contact AI engine right now. Please verify your connection or try again shortly."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-blue-100 flex flex-col h-[580px] max-w-4xl mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-4 px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight flex items-center space-x-2">
              <span>AI Skill & Career Advisor</span>
              <span className="text-[10px] bg-amber-400 text-blue-950 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Smart Automation
              </span>
            </h3>
            <p className="text-xs text-blue-100">Powered by Gemini AI Engine & Skill Mapping</p>
          </div>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
          title="Clear Chat History"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Suggested Prompts */}
      <div className="bg-blue-50/60 border-b border-blue-100 p-3 px-4 flex items-center space-x-2 overflow-x-auto">
        <span className="text-xs font-semibold text-blue-900 flex-shrink-0 flex items-center">
          <ChevronRight className="w-3.5 h-3.5 text-blue-600" /> Prompts:
        </span>
        {SUGGESTED_PROMPTS.map((promptText, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(promptText)}
            disabled={loading}
            className="text-xs bg-white hover:bg-blue-600 hover:text-white text-blue-800 border border-blue-200 rounded-full px-3 py-1 font-medium transition-all shadow-sm flex-shrink-0"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex items-start space-x-3 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.sender === "user" ? "bg-blue-600 text-white" : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-sm whitespace-pre-wrap leading-relaxed ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-none"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
              }`}
            >
              {msg.text}
              {msg.source && (
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{msg.source}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-4 shadow-sm text-sm text-slate-500 flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              <span className="text-xs text-indigo-600 font-medium ml-2">Analyzing skills & generating guidance...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about skills, Data Science, Web Dev, roadmaps, or placement tips..."
          className="flex-1 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-medium text-sm flex items-center space-x-2 transition-all shadow-md flex-shrink-0"
        >
          <span>Ask AI</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

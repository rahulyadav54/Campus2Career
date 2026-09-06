import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, RefreshCw, ChevronRight, Copy, Check, Plus, Trash2, Menu, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { apiClient } from "../services/apiClient";
import "highlight.js/styles/github-dark.css";

const SUGGESTED_PROMPTS = [
  "What skills do I need for Data Science & Analytics?",
  "How can I bridge my React & Web Dev skill gaps?",
  "Suggest a 4-week roadmap for Machine Learning.",
  "What certifications carry maximum weight for recruiters?",
];

const bubbleMotion = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, delay, ease: "easeOut" },
  }),
};

function AiAvatar() {
  return (
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <User className="w-4 h-4 sm:w-5 sm:h-5" />
    </div>
  );
}

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";

  const handleCopy = async () => {
    const text = typeof children === "string" ? children : children?.props?.children || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  if (match) {
    return (
      <div className="relative group my-3">
        {language && (
          <div className="absolute top-0 right-0 px-3 py-1 text-[10px] font-medium text-gray-400 uppercase tracking-wider bg-gray-800 rounded-br-lg">
            {language}
          </div>
        )}
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    );
  }

  return (
    <code className="bg-gray-100 text-red-700 px-1.5 py-0.5 rounded-md text-[13px] font-mono" {...props}>
      {children}
    </code>
  );
}

function MarkdownContent({ text, animate }) {
  return (
    <div className={`text-[15px] leading-relaxed ${animate ? "" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-700">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-5 mb-3 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900 mt-3 mb-2 first:mt-0">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1.5 my-3 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1.5 my-3 text-slate-700">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-300 pl-4 py-2 my-3 bg-indigo-50/60 text-slate-700 italic rounded-r-lg">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 -mx-1">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-50/80 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2.5 text-sm text-slate-700">{children}</td>,
          hr: () => <hr className="my-4 border-gray-200" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export default function CareerAdvisorChat() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hi! I'm **Campus2Career AI Advisor**.\n\nAsk me anything about skill roadmaps, career options, industry demands, or how to prepare for placement opportunities!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadHistories();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const loadHistories = async () => {
    try {
      const data = await apiClient.get("/api/chat-history");
      const list = data.histories || [];
      setHistories(list);
      if (list.length > 0 && !currentHistoryId) {
        loadHistoryContent(list[0]._id);
      }
    } catch (e) {
      console.error("Failed to load chat histories", e);
    }
  };

  const loadHistoryContent = async (historyId) => {
    try {
      const data = await apiClient.get(`/api/chat-history/${historyId}`);
      const history = data.history;
      setCurrentHistoryId(history._id);
      setMessages(history.messages?.length ? history.messages : [messages[0]]);
      setShowSidebar(false);
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  };

  const createNewChat = async () => {
    try {
      const data = await apiClient.post("/api/chat-history", {
        title: "New Chat",
        messages: [messages[0]],
      });
      const history = data.history;
      setHistories((prev) => [history, ...prev]);
      setCurrentHistoryId(history._id);
      setMessages([messages[0]]);
      setShowSidebar(false);
    } catch (e) {
      console.error("Failed to create chat", e);
    }
  };

  const deleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/chat-history/${id}`);
      setHistories((prev) => prev.filter((h) => h._id !== id));
      if (currentHistoryId === id) {
        setCurrentHistoryId(null);
        setMessages([messages[0]]);
      }
    } catch (e) {
      console.error("Failed to delete chat", e);
    }
  };

  const saveCurrentHistory = async (updatedMessages) => {
    if (!currentHistoryId) {
      try {
        const data = await apiClient.post("/api/chat-history", {
          title: updatedMessages[1]?.content?.slice(0, 30) || "New Chat",
          messages: updatedMessages,
        });
        setCurrentHistoryId(data.history._id);
        setHistories((prev) => [data.history, ...prev]);
      } catch (e) {
        console.error("Failed to save chat", e);
      }
      return;
    }

    try {
      const title =
        updatedMessages.length > 1
          ? updatedMessages[1].content.slice(0, 30) || "New Chat"
          : "New Chat";
      await apiClient.put(`/api/chat-history/${currentHistoryId}`, {
        messages: updatedMessages,
        title,
      });
      setHistories((prev) =>
        prev.map((h) =>
          h._id === currentHistoryId ? { ...h, title, messages: updatedMessages, lastMessageAt: new Date() } : h
        )
      );
    } catch (e) {
      console.error("Failed to update chat", e);
    }
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = customPrompt || input.trim();
    if (!textToSend || loading) return;

    const userMsg = { sender: "user", text: textToSend };
    const updated = [...messages, userMsg];
    setMessages(updated);
    if (!customPrompt) setInput("");
    setLoading(true);

    try {
      const res = await apiClient.post("/api/ai/chat", { prompt: textToSend }, { timeout: 60000 });
      const aiReply = res?.response || res?.answer || "I'm sorry, I couldn't process that. Please try again.";
      const rawSource = res?.source || "";
      const source = /nemotron|nvidia/i.test(rawSource) ? "Campus2Career AI Advisor" : rawSource || "Campus2Career AI Advisor";

      const finalMessages = [...updated, { sender: "ai", text: aiReply, source }];
      setMessages(finalMessages);
      saveCurrentHistory(finalMessages);
    } catch (err) {
      const errorMsg = {
        sender: "ai",
        text: "System connection notice: Unable to contact the AI engine right now. Please verify your connection or try again shortly.",
      };
      const finalMessages = [...updated, errorMsg];
      setMessages(finalMessages);
      saveCurrentHistory(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const Sidebar = () => (
    <div className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={createNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {histories.map((h) => (
          <div
            key={h._id}
            onClick={() => loadHistoryContent(h._id)}
            className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer transition-colors ${
              currentHistoryId === h._id
                ? "bg-indigo-50 border border-indigo-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{h.title}</p>
              <p className="text-xs text-gray-500 truncate">
                {new Date(h.lastMessageAt || h.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={(e) => deleteHistory(h._id, e)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
              title="Delete chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {histories.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-8">No chat history yet</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white flex flex-col h-screen w-full">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <>
            <div className="hidden md:block">
              <Sidebar />
            </div>
            <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowSidebar(false)}>
              <div onClick={(e) => e.stopPropagation()} className="w-72 h-full">
                <Sidebar />
              </div>
            </div>
          </>
        )}

        {/* Main chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar with sidebar toggle */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <p className="font-semibold text-sm text-gray-900">AI Career Advisor</p>
          </div>

          {/* Desktop sidebar toggle */}
          <div className="hidden md:flex absolute top-4 left-4 z-30">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
              title="Toggle Chat History"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white p-4 sm:p-5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg leading-tight">AI Skill & Career Advisor</h3>
                <p className="text-[11px] sm:text-xs text-indigo-100 mt-0.5">Personalised guidance based on your skills and profile</p>
              </div>
            </div>
            <button
              onClick={() => setMessages([messages[0]])}
              className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0"
              title="Clear Chat History"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Suggested Prompts */}
          <div className="bg-slate-50 border-b border-slate-200 p-3 px-4 flex items-center gap-2 overflow-x-auto flex-shrink-0">
            <span className="text-xs font-semibold text-slate-700 flex-shrink-0 flex items-center gap-1">
              <ChevronRight className="w-3.5 h-3.5 text-indigo-600" /> Prompts:
            </span>
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(promptText)}
                disabled={loading}
                className="text-xs bg-white hover:bg-indigo-600 hover:text-white text-slate-700 border border-slate-200 rounded-full px-3 py-1.5 font-medium transition-all shadow-sm flex-shrink-0 whitespace-nowrap"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white p-4 sm:p-6">
            <div className="mx-auto max-w-4xl space-y-5">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial="hidden"
                    animate="visible"
                    variants={bubbleMotion}
                    custom={i * 0.03}
                    className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.sender === "ai" ? <AiAvatar /> : <UserAvatar />}

                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-tr-md"
                          : "bg-white text-slate-800 border border-slate-200 rounded-tl-md shadow-sm"
                      }`}
                    >
                      {msg.sender === "ai" ? (
                        <MarkdownContent text={msg.text} animate={msg.sender === "ai"} />
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {msg.source && msg.sender === "ai" && (
                        <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{msg.source}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={bubbleMotion}
                  className="flex items-start gap-3"
                >
                  <AiAvatar />
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                        <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                      </div>
                      <span className="text-xs text-slate-600 font-medium">Thinking and shaping a clearer answer...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 sm:p-6 bg-white border-t border-slate-200 flex items-end gap-3 flex-shrink-0"
          >
            <div className="mx-auto w-full max-w-4xl flex items-end gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI about skills, Data Science, Web Dev, roadmaps, or placement tips..."
                className="flex-1 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all min-h-[52px]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-medium text-sm flex items-center gap-2 transition-all shadow-md flex-shrink-0 min-h-[52px]"
              >
                <span className="hidden sm:inline">Ask AI</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

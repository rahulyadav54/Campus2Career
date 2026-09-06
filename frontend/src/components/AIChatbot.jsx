import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Copy, Check, Plus, Trash2, Menu } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { apiClient } from "../services/apiClient";
import "highlight.js/styles/github-dark.css";

const SUGGESTIONS = [
  "What skills should I learn for Data Science?",
  "How do I prepare for campus placements?",
  "Suggest a roadmap for Full Stack Development",
  "What certifications improve my employability?",
];

function AiAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <Sparkles className="w-4 h-4" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <User className="w-4 h-4" />
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
      <div className="relative group my-2">
        {language && (
          <div className="absolute top-0 right-0 px-2 py-0.5 text-[9px] font-medium text-gray-400 uppercase tracking-wider bg-gray-800 rounded-br-md">
            {language}
          </div>
        )}
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
        <code className={className} {...props}>
          {children}
        </code>
      </div>
    );
  }

  return (
    <code className="bg-gray-100 text-red-700 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>
      {children}
    </code>
  );
}

function MarkdownContent({ text }) {
  return (
    <div className="text-[13px] leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-2 last:mb-0 text-slate-700 text-[13px]">{children}</p>,
          h1: ({ children }) => <h1 className="text-lg font-bold text-slate-900 mt-3 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold text-slate-900 mt-2.5 mb-1.5 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold text-slate-900 mt-2 mb-1 first:mt-0">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 my-2 text-slate-700 text-[13px]">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 my-2 text-slate-700 text-[13px]">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-indigo-300 pl-3 py-1.5 my-2 bg-indigo-50/60 text-slate-700 italic rounded-r-md text-[13px]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2.5 -mx-1">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-gray-50/80 transition-colors">{children}</tr>,
          th: ({ children }) => <th className="px-2.5 py-1.5 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{children}</th>,
          td: ({ children }) => <td className="px-2.5 py-1.5 text-xs text-slate-700">{children}</td>,
          hr: () => <hr className="my-3 border-gray-200" />,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline underline-offset-1">
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

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI Career Advisor 👋 I can see your skill profile and assessment results. Ask me anything about your career path, skill gaps, internships, or placement preparation!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [histories, setHistories] = useState([]);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadHistories();
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, loading]);

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

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const updated = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const data = await apiClient.post(
        "/api/ai/chat",
        {
          message: userMsg,
          history: updated.slice(Math.max(1, updated.length - 7), -1),
        },
        { timeout: 60000 }
      );
      const assistantMsg = {
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that. Please try again.",
        source: data.source || "Campus2Career AI Advisor",
      };
      const finalMessages = [...updated, assistantMsg];
      setMessages(finalMessages);
      saveCurrentHistory(finalMessages);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: `Sorry, I couldn't connect to the AI service. ${err.message}`,
      };
      const finalMessages = [...updated, errorMsg];
      setMessages(finalMessages);
      saveCurrentHistory(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const ChatPanel = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-sm sm:text-base leading-tight">AI Career Advisor</p>
            <p className="text-[11px] sm:text-xs text-indigo-100">Personalised to your profile</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createNewChat}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setFullscreen(false)}
            className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Exit Fullscreen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "assistant" ? <AiAvatar /> : <UserAvatar />}

              <div
                className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-md"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-md shadow-sm"
                }`}
              >
                {msg.role === "assistant" ? (
                  <MarkdownContent text={msg.content} />
                ) : (
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.source && msg.role === "assistant" && (
                  <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{msg.source}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
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
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-end gap-3 flex-shrink-0"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask AI about skills, Data Science, Web Dev, roadmaps, or placement tips..."
          className="flex-1 border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all min-h-[52px] max-h-32 resize-none"
          rows={1}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-medium text-sm flex items-center gap-2 transition-all shadow-md flex-shrink-0 min-h-[52px]"
        >
          <span className="hidden sm:inline">Ask AI</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );

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
            onClick={() => {
              loadHistoryContent(h._id);
              setShowSidebar(false);
            }}
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
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="AI Career Advisor"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Fullscreen chat window */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white flex flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            {showSidebar && (
              <>
                <div className="hidden sm:block">
                  <Sidebar />
                </div>
                <div className="sm:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowSidebar(false)}>
                  <div onClick={(e) => e.stopPropagation()} className="w-72 h-full">
                    <Sidebar />
                  </div>
                </div>
              </>
            )}

            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Top bar with sidebar toggle */}
              <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <p className="font-semibold text-sm text-gray-900">AI Career Advisor</p>
              </div>

              {/* Desktop sidebar toggle */}
              <div className="hidden sm:flex absolute top-4 left-4 z-30">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  title="Toggle Chat History"
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>

              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

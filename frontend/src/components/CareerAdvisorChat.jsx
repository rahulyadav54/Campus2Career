import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Bot, User, RefreshCw, ChevronRight, Copy, Check } from "lucide-react";
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
      // fallback
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
      const res = await apiClient.post("/api/ai/chat", { prompt: textToSend }, { timeout: 60000 });
      const aiReply = res?.response || res?.answer || "I'm sorry, I couldn't process that. Please try asking again.";
      const rawSource = res?.source || "";
      const source = /nemotron|nvidia/i.test(rawSource) ? "Campus2Career AI Advisor" : rawSource || "Campus2Career AI Advisor";

      setMessages((prev) => [...prev, { sender: "ai", text: aiReply, source }]);
    } catch (err) {
      console.error("AI Advisor error:", err);
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "System connection notice: Unable to contact the AI engine right now. Please verify your connection or try again shortly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-[620px] sm:h-[640px] max-w-4xl mx-auto overflow-hidden">
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
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-3xl mx-auto p-4 sm:p-5 space-y-5">
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
        className="p-4 bg-white border-t border-slate-200 flex items-end gap-3 flex-shrink-0"
      >
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
      </form>
    </div>
  );
}

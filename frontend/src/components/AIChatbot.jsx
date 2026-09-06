import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Copy, Check } from "lucide-react";
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
    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <Sparkles className="w-3.5 h-3.5" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <User className="w-3.5 h-3.5" />
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
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm your AI Career Advisor 👋 I can see your skill profile and assessment results. Ask me anything about your career path, skill gaps, internships, or placement preparation!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (text) => {
    const userMsg = text || input.trim();
    if (!userMsg || loading) return;
    setInput("");

    const updated = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setLoading(true);

    try {
      const data = await apiClient.post("/api/ai/chat", {
        message: userMsg,
        history: updated.slice(Math.max(1, updated.length - 7), -1),
      }, { timeout: 60000 });
      setMessages([...updated, { role: "assistant", content: data.response }]);
    } catch (err) {
      setMessages([...updated, { role: "assistant", content: `Sorry, I couldn't connect to the AI service. ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
        title="AI Career Advisor"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[370px] max-h-[580px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <p className="text-white font-semibold text-sm">AI Career Advisor</p>
              <p className="text-indigo-200 text-xs">Personalised to your profile</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className={`flex items-start gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "assistant" ? <AiAvatar /> : <UserAvatar />}

                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-md"
                      : "bg-white text-slate-800 border border-slate-200 rounded-tl-md shadow-sm"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <MarkdownContent text={msg.content} />
                  ) : (
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </motion.div>
            ))}
            {loading && (
              <div className="flex items-start gap-2">
                <AiAvatar />
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                    </div>
                    <span className="text-[11px] text-slate-600 font-medium">Thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only on first message) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 bg-gray-50 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="text-[11px] px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full hover:bg-indigo-100 transition text-left disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about your career..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400"
              disabled={loading}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-40 hover:bg-indigo-700 transition flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

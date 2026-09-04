import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Send, Bot, User, RefreshCw, ChevronRight } from "lucide-react";
import apiClient from "../services/apiClient";

const SUGGESTED_PROMPTS = [
  "What skills do I need for Data Science & Analytics?",
  "How can I bridge my React & Web Dev skill gaps?",
  "Suggest a 4-week roadmap for Machine Learning.",
  "What certifications carry maximum weight for recruiters?",
];

const bubbleMotion = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, delay, ease: "easeOut" },
  }),
};

function formatInlineText(text) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function MessageBody({ text, animate }) {
  const blocks = useMemo(() => {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const result = [];

    let currentParagraph = [];
    let currentList = null;

    const flushParagraph = () => {
      if (currentParagraph.length) {
        result.push({ type: "paragraph", lines: currentParagraph });
        currentParagraph = [];
      }
    };

    const flushList = () => {
      if (currentList) {
        result.push(currentList);
        currentList = null;
      }
    };

    lines.forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        flushList();
        return;
      }

      if (trimmed.startsWith("### ")) {
        flushParagraph();
        flushList();
        result.push({ type: "heading", text: trimmed.replace(/^###\s*/, "") });
        return;
      }

      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);

      if (orderedMatch) {
        flushParagraph();
        if (!currentList || currentList.type !== "ol") {
          flushList();
          currentList = { type: "ol", items: [] };
        }
        currentList.items.push(orderedMatch[2]);
        return;
      }

      if (bulletMatch) {
        flushParagraph();
        if (!currentList || currentList.type !== "ul") {
          flushList();
          currentList = { type: "ul", items: [] };
        }
        currentList.items.push(bulletMatch[1]);
        return;
      }

      flushList();
      currentParagraph.push(trimmed);
    });

    flushParagraph();
    flushList();
    return result;
  }, [text]);

  return (
    <div className="space-y-3">
      {blocks.map((block, blockIndex) => {
        const animationProps = animate
          ? {
              initial: "hidden",
              animate: "visible",
              variants: bubbleMotion,
              custom: blockIndex * 0.04,
            }
          : {};

        if (block.type === "heading") {
          return (
            <motion.div
              key={`heading-${blockIndex}`}
              {...animationProps}
              className="text-[15px] font-semibold text-slate-950 leading-snug"
            >
              {formatInlineText(block.text)}
            </motion.div>
          );
        }

        if (block.type === "ol" || block.type === "ul") {
          const ListTag = block.type === "ol" ? "ol" : "ul";
          return (
            <motion.div key={`${block.type}-${blockIndex}`} {...animationProps}>
              <ListTag
                className={`space-y-2 ${block.type === "ol" ? "list-decimal" : "list-disc"} pl-5 text-slate-700 leading-relaxed`}
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${blockIndex}-${itemIndex}`} className="pl-1">
                    {formatInlineText(item)}
                  </li>
                ))}
              </ListTag>
            </motion.div>
          );
        }

        return (
          <motion.p
            key={`paragraph-${blockIndex}`}
            {...animationProps}
            className="text-[15px] text-slate-700 leading-7 whitespace-pre-wrap"
          >
            {formatInlineText(block.lines.join(" "))}
          </motion.p>
        );
      })}
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
      const res = await apiClient.post("/api/ai/career-advisor", { prompt: textToSend });
      const aiReply = res?.answer || "I'm sorry, I couldn't process that. Please try asking again.";
      const source = res?.source || "Campus2Career AI Engine";

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
    <div className="bg-white rounded-3xl shadow-xl border border-blue-100 flex flex-col h-[620px] max-w-4xl mx-auto overflow-hidden">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-5 px-6 flex items-center justify-between">
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

      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50 to-white">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial="hidden"
            animate="visible"
            variants={bubbleMotion}
            custom={i * 0.03}
            className={`flex items-start gap-3 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-md"
              }`}
            >
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[84%] rounded-2xl px-4 py-3.5 shadow-sm ${
                msg.sender === "user"
                  ? "bg-blue-600 text-white rounded-tr-md"
                  : "bg-white text-slate-800 border border-slate-200 rounded-tl-md"
              }`}
            >
              <MessageBody text={msg.text} animate={msg.sender === "ai"} />
              {msg.source && (
                <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] text-indigo-600 font-semibold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>{msg.source}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm text-sm text-slate-500">
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
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-4 bg-white border-t border-slate-200 flex items-end space-x-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI about skills, Data Science, Web Dev, roadmaps, or placement tips..."
          className="flex-1 border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-2xl px-4 py-3 text-sm focus:outline-none transition-all min-h-[52px]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-5 py-3 rounded-2xl font-medium text-sm flex items-center space-x-2 transition-all shadow-md flex-shrink-0 min-h-[52px]"
        >
          <span>Ask AI</span>
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

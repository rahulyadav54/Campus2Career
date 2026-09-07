import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, User, Plus, Trash2, Paperclip, Mic, MicOff,
  Volume2, VolumeX, Square, Copy, Check, MessageSquare, X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import toast from "react-hot-toast";
import { apiClient } from "../services/apiClient";
import "highlight.js/styles/github-dark.css";

const SUGGESTED_PROMPTS = [
  "Build me a 4-week placement prep plan",
  "What skills should I add for Data Science?",
  "Review my profile and list skill gaps",
  "How do I prepare for a product-company interview?",
];

const THINKING_STEPS = [
  "Analyzing your question…",
  "Reviewing your skill profile…",
  "Mapping career paths and demand…",
  "Drafting a personalized answer…",
];

const WELCOME = {
  role: "assistant",
  content:
    "Hi — I'm **Campus2Career AI Advisor**.\n\nAsk about skill roadmaps, internships, interviews, or placements. You can **speak**, **type**, or **attach a resume/PDF** and I'll analyze it.",
};

const toPlain = (markdown = "") =>
  String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*_#>-]/g, " ")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const normalizeMessage = (msg) => {
  if (!msg) return null;
  if (msg.role && msg.content) return msg;
  return {
    role: msg.sender === "ai" || msg.sender === "assistant" ? "assistant" : "user",
    content: msg.text || msg.content || "",
    source: msg.source || "",
    files: msg.files || [],
  };
};

function AiAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <Sparkles className="w-4 h-4" />
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-sm flex-shrink-0">
      <User className="w-4 h-4" />
    </div>
  );
}

function CodeBlock({ children, className, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const handleCopy = async () => {
    const text = typeof children === "string" ? children : children?.props?.children || "";
    await navigator.clipboard.writeText(String(text));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  if (match) {
    return (
      <div className="relative group my-3">
        <button type="button" onClick={handleCopy} className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 text-slate-200 opacity-0 group-hover:opacity-100">
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
        <code className={className} {...props}>{children}</code>
      </div>
    );
  }
  return <code className="bg-indigo-50 text-indigo-800 px-1.5 py-0.5 rounded text-[13px] font-mono" {...props}>{children}</code>;
}

function MarkdownContent({ text, caret }) {
  return (
    <div className={`text-[15px] leading-7 ${caret ? "typing-caret" : ""}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          code: CodeBlock,
          p: ({ children }) => <p className="mb-3 last:mb-0 text-slate-700">{children}</p>,
          h1: ({ children }) => <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-900 mt-3 mb-1.5 first:mt-0">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-3 text-slate-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-3 text-slate-700">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-400 pl-4 py-1 my-3 text-slate-600 italic">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-sm border border-slate-200 rounded-lg overflow-hidden">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
          th: ({ children }) => <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2 text-slate-700 border-t border-slate-100">{children}</td>,
          a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-indigo-600 underline">{children}</a>,
          strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function ThinkingCard({ step }) {
  return (
    <div className="flex items-start gap-3">
      <AiAvatar />
      <div className="bg-white border border-indigo-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm min-w-[240px]">
        <div className="flex items-center gap-2 mb-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600" />
          </span>
          <span className="text-sm font-medium text-indigo-700">{step}</span>
        </div>
        <div className="space-y-1.5">
          <div className="h-2 rounded bg-slate-100 overflow-hidden">
            <div className="h-full w-2/3 bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200 animate-pulse" />
          </div>
          <div className="h-2 rounded bg-slate-100 overflow-hidden w-5/6">
            <div className="h-full w-1/2 bg-gradient-to-r from-slate-200 via-indigo-100 to-slate-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CareerAdvisorChat() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [thinkingStep, setThinkingStep] = useState(0);
  const [histories, setHistories] = useState([]);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [attachments, setAttachments] = useState([]);
  const [listening, setListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [typed, setTyped] = useState({ index: -1, text: "", done: true });
  const chatEndRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);
  const typeTimer = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => { loadHistories(); }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typed.text]);

  useEffect(() => {
    if (!loading) return;
    setThinkingStep(0);
    const id = setInterval(() => setThinkingStep((s) => (s + 1) % THINKING_STEPS.length), 1400);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => () => {
    clearTimeout(typeTimer.current);
    speechSynthesis.cancel();
    recRef.current?.stop?.();
    abortRef.current?.abort?.();
  }, []);

  const persistable = (list) =>
    list.map((m) => ({
      role: m.role,
      content: m.content,
      source: m.source || "",
    }));

  const loadHistories = async () => {
    try {
      const data = await apiClient.get("/api/chat-history");
      const list = data.histories || [];
      setHistories(list);
    } catch {
      /* history is optional */
    }
  };

  const loadHistoryContent = async (historyId) => {
    try {
      const data = await apiClient.get(`/api/chat-history/${historyId}`);
      const history = data.history;
      setCurrentHistoryId(history._id);
      const loaded = (history.messages || []).map(normalizeMessage).filter(Boolean);
      setMessages(loaded.length ? loaded : [WELCOME]);
      setTyped({ index: -1, text: "", done: true });
    } catch {
      toast.error("Could not load that chat");
    }
  };

  const createNewChat = () => {
    setCurrentHistoryId(null);
    setMessages([WELCOME]);
    setAttachments([]);
    setTyped({ index: -1, text: "", done: true });
  };

  const deleteHistory = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/chat-history/${id}`);
      setHistories((prev) => prev.filter((h) => h._id !== id));
      if (currentHistoryId === id) createNewChat();
    } catch {
      toast.error("Could not delete chat");
    }
  };

  const saveCurrentHistory = async (updatedMessages) => {
    const payload = persistable(updatedMessages);
    const firstUser = payload.find((m) => m.role === "user");
    const title = (firstUser?.content || "New Chat").slice(0, 42);
    try {
      if (!currentHistoryId) {
        const data = await apiClient.post("/api/chat-history", { title, messages: payload });
        setCurrentHistoryId(data.history._id);
        setHistories((prev) => [data.history, ...prev]);
        return;
      }
      await apiClient.put(`/api/chat-history/${currentHistoryId}`, { messages: payload, title });
      setHistories((prev) =>
        prev.map((h) => (h._id === currentHistoryId ? { ...h, title, lastMessageAt: new Date() } : h))
      );
    } catch {
      /* non-blocking */
    }
  };

  const startTypewriter = (full, index) => {
    clearTimeout(typeTimer.current);
    setTyped({ index, text: "", done: false });
    let i = 0;
    const tick = () => {
      const step = full.length > 1800 ? 10 : 3;
      i = Math.min(full.length, i + step);
      setTyped({ index, text: full.slice(0, i), done: i >= full.length });
      if (i < full.length) typeTimer.current = setTimeout(tick, 14);
    };
    tick();
  };

  const handleSend = async (customPrompt = null) => {
    const textToSend = (customPrompt || input).trim();
    if ((!textToSend && attachments.length === 0) || loading) return;
    const readyFiles = attachments.filter((f) => f.status === "ready");
    if (attachments.some((f) => f.status === "uploading")) {
      toast.error("Wait for file analysis to finish");
      return;
    }

    const userMsg = {
      role: "user",
      content: textToSend || "Please analyze the attached file(s).",
      files: readyFiles.map((f) => f.name),
    };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setAttachments([]);
    setLoading(true);

    const history = persistable(updated).slice(-8, -1);

    abortRef.current?.abort?.();
    abortRef.current = new AbortController();

    try {
      const res = await apiClient.post(
        "/api/ai/chat",
        {
          message: userMsg.content,
          history,
          attachments: readyFiles.map((f) => ({ filename: f.name, text: f.text })),
        },
        { timeout: 60000 }
      );
      const aiReply = res?.response || "I couldn't generate a response. Please try again.";
      const finalMessages = [
        ...updated,
        { role: "assistant", content: aiReply, source: res?.source || "Campus2Career AI Advisor" },
      ];
      setMessages(finalMessages);
      startTypewriter(aiReply, finalMessages.length - 1);
      saveCurrentHistory(finalMessages);
    } catch (err) {
      const serverMessage = err.data?.message || err.message;
      const errorMsg = {
        role: "assistant",
        content: err.message?.includes("timed out")
          ? "The advisor took too long to respond. Try a shorter question."
          : serverMessage && !serverMessage.startsWith("Request failed")
            ? serverMessage
            : "I couldn't reach the AI engine right now. Please try again in a moment.",
      };
      const finalMessages = [...updated, errorMsg];
      setMessages(finalMessages);
      setTyped({ index: -1, text: "", done: true });
      saveCurrentHistory(finalMessages);
    } finally {
      setLoading(false);
    }
  };

  const stopAll = () => {
    abortRef.current?.abort?.();
    clearTimeout(typeTimer.current);
    setLoading(false);
    setTyped((t) => ({ ...t, done: true }));
    speechSynthesis.cancel();
    recRef.current?.stop?.();
    setListening(false);
  };

  const onPickFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (attachments.length + files.length > 3) {
      toast.error("You can attach up to 3 files");
      return;
    }
    for (const file of files) {
      const id = `${file.name}-${file.size}-${Date.now()}`;
      setAttachments((prev) => [...prev, { id, name: file.name, status: "uploading", text: "" }]);
      const body = new FormData();
      body.append("file", file);
      try {
        const data = await apiClient.post("/api/ai/chat-file", body, { timeout: 45000, retries: 0 });
        setAttachments((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "ready", text: data.text, chars: data.chars } : item
          )
        );
        toast.success(`Analyzed ${file.name}`);
      } catch (err) {
        setAttachments((prev) => prev.filter((item) => item.id !== id));
        toast.error(err.message || `Could not read ${file.name}`);
      }
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice input is not supported in this browser. Try Chrome.");
      return;
    }
    if (listening) {
      recRef.current?.stop?.();
      setListening(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join(" ");
      setInput(transcript);
    };
    rec.onerror = () => {
      setListening(false);
      toast.error("Microphone was blocked or unavailable");
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };

  const speak = (index, content) => {
    if (speakingId === index) {
      speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    const text = toPlain(content);
    if (!text || !window.speechSynthesis) {
      toast.error("Text-to-speech is not available");
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 1200));
    utterance.rate = 1;
    utterance.lang = "en-IN";
    utterance.onend = () => setSpeakingId(null);
    setSpeakingId(index);
    speechSynthesis.speak(utterance);
  };

  const empty = messages.length <= 1;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-5 lg:-m-6 bg-[#f7f7f8] overflow-hidden">
      <aside className={`${sidebarOpen ? "flex" : "hidden"} w-[272px] flex-col border-r border-slate-200 bg-white`}>
        <div className="p-3 border-b border-slate-100">
          <button
            type="button"
            onClick={createNewChat}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {histories.map((h) => (
            <button
              type="button"
              key={h._id}
              onClick={() => loadHistoryContent(h._id)}
              className={`w-full text-left group flex items-center gap-2 px-3 py-2.5 rounded-xl ${
                currentHistoryId === h._id ? "bg-indigo-50 text-indigo-800" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-60" />
              <span className="flex-1 truncate text-sm">{h.title}</span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => deleteHistory(h._id, e)}
                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}
          {histories.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10 px-4">Your conversations will show up here.</p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 px-4 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Chat history"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-900 leading-tight">AI Skill & Career Advisor</p>
              <p className="text-[11px] text-slate-500">Personal guidance · voice · file analysis</p>
            </div>
          </div>
          {loading && (
            <button type="button" onClick={stopAll} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50">
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {empty && (
              <div className="text-center py-10">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-2xl font-semibold text-slate-900">How can I help your career today?</h1>
                <p className="text-sm text-slate-500 mt-2">Type, speak, or attach a resume for tailored advice.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-8 text-left">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      type="button"
                      key={prompt}
                      disabled={loading}
                      onClick={() => handleSend(prompt)}
                      className="px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, i) => {
                if (empty && i === 0) return null;
                const isUser = msg.role === "user";
                const isStreaming = typed.index === i && !typed.done;
                const body = isStreaming ? typed.text : msg.content;
                return (
                  <motion.div
                    key={`${i}-${msg.role}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                  >
                    {isUser ? <UserAvatar /> : <AiAvatar />}
                    <div className={`max-w-[85%] ${isUser ? "bg-indigo-600 text-white rounded-2xl rounded-tr-md px-4 py-3" : "pt-0.5"}`}>
                      {isUser ? (
                        <>
                          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          {msg.files?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {msg.files.map((name) => (
                                <span key={name} className="text-[11px] bg-white/15 px-2 py-0.5 rounded-full">{name}</span>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div>
                          <MarkdownContent text={body} caret={isStreaming} />
                          {typed.done && (
                            <div className="mt-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => speak(i, msg.content)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title={speakingId === i ? "Stop speaking" : "Read aloud"}
                              >
                                {speakingId === i ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && <ThinkingCard step={THINKING_STEPS[thinkingStep]} />}
            <div ref={chatEndRef} />
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white p-3 sm:p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-3xl mx-auto"
          >
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachments.map((file) => (
                  <span key={file.id} className="inline-flex items-center gap-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full pl-2.5 pr-1 py-1">
                    <Paperclip className="w-3 h-3 text-indigo-500" />
                    <span className="max-w-[140px] truncate">{file.name}</span>
                    <span className="text-slate-400">{file.status === "uploading" ? "analyzing…" : "ready"}</span>
                    <button type="button" onClick={() => setAttachments((prev) => prev.filter((f) => f.id !== file.id))} className="p-0.5 rounded-full hover:bg-slate-200">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white px-2 py-2 shadow-sm focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,.csv" className="hidden" onChange={onPickFiles} />
              <button type="button" onClick={() => fileRef.current?.click()} className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl" title="Attach resume or notes">
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2 rounded-xl ${listening ? "text-white bg-red-500 animate-pulse" : "text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"}`}
                title="Voice input"
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                disabled={loading}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={listening ? "Listening…" : "Ask about skills, interviews, or attach a resume…"}
                className="flex-1 resize-none border-0 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none max-h-36"
              />
              <button
                type="submit"
                disabled={loading || (!input.trim() && attachments.length === 0)}
                className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Voice uses your browser microphone. Files are read as text and sent with your question — never stored as passwords or secrets.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

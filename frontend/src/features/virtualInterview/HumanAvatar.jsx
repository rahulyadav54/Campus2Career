/**
 * HumanAvatar — state-driven interviewer with lip sync, blink, and micro-expressions.
 */

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2, Brain, CheckCircle } from "lucide-react";
import { AVATAR_EMOTIONS } from "./constants";

const EMOTION_STYLES = {
  [AVATAR_EMOTIONS.IDLE]: { ring: "ring-slate-300", bg: "from-slate-100 to-slate-200", label: "Standby" },
  [AVATAR_EMOTIONS.LISTENING]: { ring: "ring-emerald-400", bg: "from-emerald-50 to-teal-100", label: "Listening" },
  [AVATAR_EMOTIONS.THINKING]: { ring: "ring-amber-300", bg: "from-amber-50 to-orange-100", label: "Thinking" },
  [AVATAR_EMOTIONS.SPEAKING]: { ring: "ring-indigo-400", bg: "from-indigo-50 to-indigo-100", label: "Speaking" },
  [AVATAR_EMOTIONS.CURIOUS]: { ring: "ring-sky-400", bg: "from-sky-50 to-indigo-100", label: "Curious" },
  [AVATAR_EMOTIONS.IMPRESSED]: { ring: "ring-green-400", bg: "from-green-50 to-emerald-100", label: "Impressed" },
  [AVATAR_EMOTIONS.ENCOURAGING]: { ring: "ring-teal-400", bg: "from-teal-50 to-cyan-100", label: "Encouraging" },
  [AVATAR_EMOTIONS.SERIOUS]: { ring: "ring-slate-400", bg: "from-slate-100 to-slate-200", label: "Focused" },
  [AVATAR_EMOTIONS.CONFUSED]: { ring: "ring-orange-300", bg: "from-orange-50 to-amber-100", label: "Clarifying" },
  [AVATAR_EMOTIONS.CONCERNED]: { ring: "ring-rose-300", bg: "from-rose-50 to-pink-100", label: "Attentive" },
  [AVATAR_EMOTIONS.GOODBYE]: { ring: "ring-indigo-300", bg: "from-indigo-50 to-violet-100", label: "Wrapping up" },
};

function Waveform({ active, level = 0, color = "bg-indigo-400" }) {
  const bars = [0.35, 0.6, 1, 0.75, 0.5, 0.85, 0.55];
  const intensity = active ? Math.max(0.2, Math.min(1, level || 0.45)) : 0.15;
  return (
    <div className="flex items-end gap-0.5 h-6" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full ${color} ${active ? "animate-pulse" : "opacity-30"}`}
          style={{ height: `${h * intensity * 100}%`, animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

export default function HumanAvatar({
  emotion = AVATAR_EMOTIONS.IDLE,
  audioLevel = 0,
  presenterUrl = "/interviewer.jpeg",
  nodTrigger = 0,
  useImage = true,
}) {
  const [blink, setBlink] = useState(false);
  const [nod, setNod] = useState(false);
  const cfg = EMOTION_STYLES[emotion] || EMOTION_STYLES[AVATAR_EMOTIONS.IDLE];
  const isSpeaking = emotion === AVATAR_EMOTIONS.SPEAKING;
  const isListening = emotion === AVATAR_EMOTIONS.LISTENING;
  const mouthOpen = isSpeaking ? Math.min(1, 0.15 + audioLevel * 1.2) : 0.05;

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 120);
    }, 2800 + Math.random() * 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!nodTrigger) return;
    setNod(true);
    const t = setTimeout(() => setNod(false), 500);
    return () => clearTimeout(t);
  }, [nodTrigger]);

  const Icon = isListening ? Mic : isSpeaking ? Volume2 : emotion === AVATAR_EMOTIONS.THINKING ? Brain : CheckCircle;

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={`relative transition-transform duration-500 ${nod ? "translate-y-1" : ""}`}
        style={{ transform: nod ? "translateY(4px) rotate(1deg)" : undefined }}
      >
        <div
          className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br ${cfg.bg}
            ring-4 ${cfg.ring} ring-offset-4 ring-offset-gray-50 shadow-lg overflow-hidden
            flex items-center justify-center transition-all duration-500`}
        >
          {useImage ? (
            <img
              src={presenterUrl}
              alt="AI Interviewer"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : null}

          {/* Lip-sync mouth overlay */}
          <div className="absolute bottom-[28%] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
            <div
              className="rounded-full bg-black/20 transition-all duration-75"
              style={{
                width: `${18 + mouthOpen * 22}px`,
                height: `${4 + mouthOpen * 16}px`,
                opacity: isSpeaking ? 0.55 : 0,
              }}
            />
          </div>

          {/* Eye blink overlay */}
          <div
            className="absolute inset-0 bg-white/0 transition-opacity duration-100 pointer-events-none"
            style={{
              background: blink
                ? "linear-gradient(to bottom, transparent 32%, rgba(255,255,255,0.85) 36%, rgba(255,255,255,0.85) 40%, transparent 44%)"
                : "transparent",
            }}
          />

          {/* Subtle breathing */}
          <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700">
        <Icon className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium">{cfg.label}</span>
        {isSpeaking && <Waveform active={audioLevel > 0.05} level={audioLevel} color="bg-indigo-400" />}
        {isListening && <Waveform active color="bg-emerald-500" />}
      </div>
    </div>
  );
}

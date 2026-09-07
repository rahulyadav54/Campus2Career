/**
 * HumanAvatar — expressive interviewer with lip sync, gaze, micro-expressions, and reactions.
 */

import { useEffect, useRef, useState, useMemo } from "react";
import { Mic, Volume2, Brain, CheckCircle, Sparkles } from "lucide-react";
import { AVATAR_EMOTIONS } from "./constants";

const EMOTION_STYLES = {
  [AVATAR_EMOTIONS.IDLE]: { ring: "ring-slate-300", bg: "from-slate-100 to-slate-200", label: "Standby", glow: "rgba(148,163,184,0.2)" },
  [AVATAR_EMOTIONS.LISTENING]: { ring: "ring-emerald-400", bg: "from-emerald-50 to-teal-100", label: "Listening", glow: "rgba(16,185,129,0.35)" },
  [AVATAR_EMOTIONS.THINKING]: { ring: "ring-amber-300", bg: "from-amber-50 to-orange-100", label: "Thinking", glow: "rgba(245,158,11,0.3)" },
  [AVATAR_EMOTIONS.SPEAKING]: { ring: "ring-indigo-400", bg: "from-indigo-50 to-indigo-100", label: "Speaking", glow: "rgba(99,102,241,0.35)" },
  [AVATAR_EMOTIONS.CURIOUS]: { ring: "ring-sky-400", bg: "from-sky-50 to-indigo-100", label: "Curious", glow: "rgba(14,165,233,0.35)" },
  [AVATAR_EMOTIONS.IMPRESSED]: { ring: "ring-green-400", bg: "from-green-50 to-emerald-100", label: "Impressed", glow: "rgba(34,197,94,0.4)" },
  [AVATAR_EMOTIONS.ENCOURAGING]: { ring: "ring-teal-400", bg: "from-teal-50 to-cyan-100", label: "Encouraging", glow: "rgba(20,184,166,0.35)" },
  [AVATAR_EMOTIONS.SERIOUS]: { ring: "ring-slate-400", bg: "from-slate-100 to-slate-200", label: "Focused", glow: "rgba(71,85,105,0.25)" },
  [AVATAR_EMOTIONS.CONFUSED]: { ring: "ring-orange-300", bg: "from-orange-50 to-amber-100", label: "Clarifying", glow: "rgba(249,115,22,0.3)" },
  [AVATAR_EMOTIONS.CONCERNED]: { ring: "ring-rose-300", bg: "from-rose-50 to-pink-100", label: "Attentive", glow: "rgba(244,63,94,0.3)" },
  [AVATAR_EMOTIONS.GOODBYE]: { ring: "ring-indigo-300", bg: "from-indigo-50 to-violet-100", label: "Wrapping up", glow: "rgba(129,140,248,0.3)" },
};

/** Per-emotion motion + expression hints */
const EXPRESSION = {
  [AVATAR_EMOTIONS.IDLE]: { tilt: 0, rotate: 0, scale: 1, filter: "brightness(1)", brow: "neutral", gazeY: 0, gazeX: 0 },
  [AVATAR_EMOTIONS.LISTENING]: { tilt: -2, rotate: 0, scale: 1.04, filter: "brightness(1.08) saturate(1.1)", brow: "attentive", gazeY: 0, gazeX: 0 },
  [AVATAR_EMOTIONS.THINKING]: { tilt: 4, rotate: -5, scale: 0.97, filter: "brightness(0.9) saturate(0.85)", brow: "furrow", gazeY: -8, gazeX: -6 },
  [AVATAR_EMOTIONS.SPEAKING]: { tilt: 0, rotate: 0, scale: 1.02, filter: "brightness(1.1) contrast(1.05)", brow: "neutral", gazeY: 0, gazeX: 0 },
  [AVATAR_EMOTIONS.CURIOUS]: { tilt: -3, rotate: 2, scale: 1.05, filter: "brightness(1.1) saturate(1.15)", brow: "raised", gazeY: -2, gazeX: 4 },
  [AVATAR_EMOTIONS.IMPRESSED]: { tilt: -4, rotate: 0, scale: 1.06, filter: "brightness(1.15) saturate(1.2)", brow: "raised", gazeY: 0, gazeX: 0 },
  [AVATAR_EMOTIONS.ENCOURAGING]: { tilt: -2, rotate: 0, scale: 1.04, filter: "brightness(1.12) saturate(1.1)", brow: "soft", gazeY: 2, gazeX: 0 },
  [AVATAR_EMOTIONS.SERIOUS]: { tilt: 1, rotate: 0, scale: 1, filter: "brightness(0.95) contrast(1.1)", brow: "furrow", gazeY: 0, gazeX: 0 },
  [AVATAR_EMOTIONS.CONFUSED]: { tilt: 5, rotate: -3, scale: 1.01, filter: "brightness(1) saturate(0.9)", brow: "asymmetric", gazeY: -4, gazeX: -5 },
  [AVATAR_EMOTIONS.CONCERNED]: { tilt: 2, rotate: 0, scale: 1.02, filter: "brightness(0.98) saturate(0.95)", brow: "soft", gazeY: 3, gazeX: 0 },
  [AVATAR_EMOTIONS.GOODBYE]: { tilt: -2, rotate: 0, scale: 1.03, filter: "brightness(1.08)", brow: "soft", gazeY: 0, gazeX: 0 },
};

function Waveform({ active, level = 0, color = "bg-indigo-400" }) {
  const bars = [0.35, 0.6, 1, 0.75, 0.5, 0.85, 0.55];
  const intensity = active ? Math.max(0.25, Math.min(1, level || 0.5)) : 0.15;
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

function ExpressionOverlay({ brow, isSpeaking, mouthOpen, gazeX, gazeY, blink }) {
  const browPaths = {
    neutral: { left: "M 62 78 Q 72 74 82 78", right: "M 118 78 Q 128 74 138 78" },
    attentive: { left: "M 60 76 Q 72 72 84 76", right: "M 116 76 Q 128 72 140 76" },
    raised: { left: "M 58 74 Q 72 68 86 74", right: "M 114 74 Q 128 68 142 74" },
    furrow: { left: "M 60 80 Q 72 76 84 80", right: "M 116 80 Q 128 76 140 80" },
    soft: { left: "M 62 77 Q 72 75 82 77", right: "M 118 77 Q 128 75 138 77" },
    asymmetric: { left: "M 58 76 Q 72 72 84 78", right: "M 116 80 Q 128 78 142 76" },
  };
  const brows = browPaths[brow] || browPaths.neutral;

  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    >
      {/* Gaze shift — subtle eye highlight */}
      <g style={{ transform: `translate(${gazeX}px, ${gazeY}px)` }}>
        <ellipse cx="78" cy="88" rx="7" ry="5" fill="rgba(255,255,255,0.15)" />
        <ellipse cx="122" cy="88" rx="7" ry="5" fill="rgba(255,255,255,0.15)" />
      </g>

      {/* Eyebrows */}
      <path d={brows.left} stroke="rgba(40,25,15,0.55)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={brows.right} stroke="rgba(40,25,15,0.55)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Blink */}
      {blink && (
        <>
          <ellipse cx="78" cy="88" rx="9" ry="6" fill="rgba(255,255,255,0.75)" />
          <ellipse cx="122" cy="88" rx="9" ry="6" fill="rgba(255,255,255,0.75)" />
        </>
      )}

      {/* Mouth — lip sync */}
      {isSpeaking ? (
        <ellipse
          cx="100"
          cy="118"
          rx={10 + mouthOpen * 14}
          ry={3 + mouthOpen * 12}
          fill="rgba(80,30,30,0.45)"
          className="avatar-mouth-talk"
        />
      ) : (
        <path
          d={`M ${88 - mouthOpen * 2} 118 Q 100 ${120 + mouthOpen * 4} ${112 + mouthOpen * 2} 118`}
          stroke="rgba(80,40,30,0.35)"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

export default function HumanAvatar({
  emotion = AVATAR_EMOTIONS.IDLE,
  audioLevel = 0,
  presenterUrl = "/interviewer.jpeg",
  nodTrigger = 0,
  candidateActive = false,
  isProcessing = false,
  useImage = true,
}) {
  const [blink, setBlink] = useState(false);
  const [nod, setNod] = useState(false);
  const [reactionPulse, setReactionPulse] = useState(false);
  const prevEmotionRef = useRef(emotion);
  const listenNodRef = useRef(null);

  const cfg = EMOTION_STYLES[emotion] || EMOTION_STYLES[AVATAR_EMOTIONS.IDLE];
  const expr = EXPRESSION[emotion] || EXPRESSION[AVATAR_EMOTIONS.IDLE];

  const isSpeaking = emotion === AVATAR_EMOTIONS.SPEAKING;
  const isListening = emotion === AVATAR_EMOTIONS.LISTENING;
  const isThinking = emotion === AVATAR_EMOTIONS.THINKING || isProcessing;
  const isReaction = [AVATAR_EMOTIONS.CURIOUS, AVATAR_EMOTIONS.IMPRESSED, AVATAR_EMOTIONS.ENCOURAGING,
    AVATAR_EMOTIONS.CONFUSED, AVATAR_EMOTIONS.CONCERNED, AVATAR_EMOTIONS.SERIOUS].includes(emotion);

  const mouthOpen = isSpeaking
    ? Math.min(1, 0.2 + audioLevel * 1.4)
    : isReaction ? 0.15 : 0.05;

  const speakBob = isSpeaking ? audioLevel * 4 : 0;

  const headTransform = useMemo(() => {
    const tilt = expr.tilt + (nod ? 3 : 0) + (candidateActive && isListening ? -1 : 0);
    const rotate = expr.rotate + (isThinking ? -2 : 0);
    const scale = expr.scale + (reactionPulse ? 0.03 : 0);
    const y = speakBob + (nod ? 5 : 0);
    return `translateY(${y}px) rotate(${rotate}deg) scale(${scale})`;
  }, [expr, nod, candidateActive, isListening, isThinking, reactionPulse, speakBob]);

  // Natural blink
  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 110);
    }, 2200 + Math.random() * 2800);
    return () => clearInterval(id);
  }, []);

  // Nod on trigger
  useEffect(() => {
    if (!nodTrigger) return;
    setNod(true);
    const t = setTimeout(() => setNod(false), 480);
    return () => clearTimeout(t);
  }, [nodTrigger]);

  // Reaction pulse when emotion changes to a reactive state
  useEffect(() => {
    const prev = prevEmotionRef.current;
    prevEmotionRef.current = emotion;
    if (isReaction && prev !== emotion) {
      setReactionPulse(true);
      const t = setTimeout(() => setReactionPulse(false), 700);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [emotion, isReaction]);

  // Subtle attentive nods while listening to candidate
  useEffect(() => {
    if (!isListening || !candidateActive) {
      clearInterval(listenNodRef.current);
      listenNodRef.current = null;
      return undefined;
    }
    listenNodRef.current = setInterval(() => {
      setNod(true);
      setTimeout(() => setNod(false), 350);
    }, 3200 + Math.random() * 2000);
    return () => clearInterval(listenNodRef.current);
  }, [isListening, candidateActive]);

  const Icon = isListening ? Mic : isSpeaking ? Volume2 : isThinking ? Brain : isReaction ? Sparkles : CheckCircle;
  const animClass = isSpeaking
    ? "avatar-speak-motion"
    : isListening
      ? candidateActive ? "avatar-listen-active" : "avatar-listen-idle"
      : isThinking
        ? "avatar-think-motion"
        : isReaction
          ? "avatar-reaction-motion"
          : "avatar-breathe";

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        {/* Emotion glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-700 -z-10"
          style={{
            background: cfg.glow,
            transform: reactionPulse ? "scale(1.15)" : "scale(1)",
            opacity: isSpeaking || isReaction ? 0.9 : 0.5,
          }}
        />

        <div
          className={`relative transition-transform duration-300 ${nod ? "avatar-nod" : ""}`}
          style={{ transformOrigin: "50% 85%" }}
        >
          <div
            className={`w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br ${cfg.bg}
              ring-4 ${cfg.ring} ring-offset-4 ring-offset-gray-50 shadow-lg overflow-hidden
              flex items-center justify-center transition-all duration-500 ${animClass}`}
          >
            <div
              className="relative w-full h-full transition-all duration-400"
              style={{
                transform: headTransform,
                transformOrigin: "50% 75%",
                filter: expr.filter,
              }}
            >
              {useImage ? (
                <img
                  src={presenterUrl}
                  alt="AI Interviewer"
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                  onError={(e) => { e.target.style.display = "none"; }}
                />
              ) : null}

              {/* Emotion tint overlay */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500"
                style={{
                  background: isReaction
                    ? "radial-gradient(circle at 50% 40%, rgba(255,255,255,0.12), transparent 65%)"
                    : isThinking
                      ? "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 40%)"
                      : isListening
                        ? "radial-gradient(circle at 50% 30%, rgba(16,185,129,0.08), transparent 60%)"
                        : "transparent",
                  opacity: isSpeaking ? 0.6 : 1,
                }}
              />

              <ExpressionOverlay
                brow={expr.brow}
                isSpeaking={isSpeaking}
                mouthOpen={mouthOpen}
                gazeX={expr.gazeX}
                gazeY={expr.gazeY}
                blink={blink}
              />
            </div>

            {/* Speaking energy ring */}
            {isSpeaking && (
              <div
                className="absolute inset-2 rounded-full border-2 border-indigo-300/40 pointer-events-none avatar-speak-ring"
                style={{ opacity: 0.4 + audioLevel * 0.5 }}
              />
            )}

            {/* Listening pulse */}
            {isListening && candidateActive && (
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 pointer-events-none avatar-listen-ring" />
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm text-gray-700">
        <Icon className={`w-4 h-4 ${isReaction ? "text-amber-500" : "text-indigo-600"}`} />
        <span className="text-sm font-medium">{cfg.label}</span>
        {isSpeaking && <Waveform active={audioLevel > 0.05} level={audioLevel} color="bg-indigo-400" />}
        {isListening && <Waveform active={candidateActive} level={candidateActive ? 0.7 : 0.3} color="bg-emerald-500" />}
        {isThinking && (
          <span className="flex gap-1 ml-1" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

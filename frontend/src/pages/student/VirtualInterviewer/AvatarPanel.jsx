/**
 * AvatarPanel.jsx
 *
 * Renders the interviewer avatar.
 *
 * Priority:
 * 1. D-ID Streaming Avatar (photorealistic WebRTC avatar powered by D-ID Studio API)
 * 2. HeyGen Streaming Avatar (if token available)
 * 3. Animated CSS professional avatar fallback with live audio/state feedback
 *
 * avatarState: "idle" | "speaking" | "listening" | "thinking" | "completed"
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, Volume2, Brain, CheckCircle, Wifi, WifiOff, Sparkles } from "lucide-react";
import { interviewService } from "../../../services/interviewService";

// ── State configuration ───────────────────────────────────────────────────────

const STATE_CONFIG = {
  idle: {
    label:      "Waiting",
    color:      "from-slate-600 to-slate-700",
    ringColor:  "ring-slate-400",
    icon:       null,
    pulse:      false,
  },
  speaking: {
    label:      "Speaking",
    color:      "from-indigo-600 to-violet-700",
    ringColor:  "ring-indigo-400",
    icon:       Volume2,
    pulse:      true,
  },
  listening: {
    label:      "Listening",
    color:      "from-emerald-600 to-teal-700",
    ringColor:  "ring-emerald-400",
    icon:       Mic,
    pulse:      true,
  },
  thinking: {
    label:      "Thinking...",
    color:      "from-amber-600 to-orange-700",
    ringColor:  "ring-amber-400",
    icon:       Brain,
    pulse:      true,
  },
  completed: {
    label:      "Interview Complete",
    color:      "from-emerald-600 to-green-700",
    ringColor:  "ring-emerald-400",
    icon:       CheckCircle,
    pulse:      false,
  },
};

// ── Animated Waveform bars ────────────────────────────────────────────────────

function WaveformBars({ active, color = "bg-white" }) {
  const bars = [0.4, 0.7, 1, 0.8, 0.5, 0.9, 0.6, 1, 0.7, 0.4];
  return (
    <div className="flex items-end gap-0.5 h-8" aria-hidden="true">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all ${color} ${
            active ? "animate-pulse" : "opacity-30"
          }`}
          style={{
            height:          active ? `${h * 100}%` : "20%",
            animationDelay:  `${i * 70}ms`,
            animationDuration: `${600 + i * 60}ms`,
          }}
        />
      ))}
    </div>
  );
}

// ── Animated avatar face (CSS fallback) ──────────────────────────────────────

function AnimatedAvatar({ state }) {
  const cfg    = STATE_CONFIG[state] || STATE_CONFIG.idle;
  const Icon   = cfg.icon;
  const isSpeaking  = state === "speaking";
  const isListening = state === "listening";
  const isThinking  = state === "thinking";

  return (
    <div className="relative flex flex-col items-center">
      {/* Main circle — interviewer avatar representation */}
      <div
        className={`relative w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-gradient-to-br ${cfg.color}
          ring-4 ${cfg.ringColor} ring-offset-4 ring-offset-gray-900
          flex items-center justify-center shadow-2xl overflow-hidden
          transition-all duration-500`}
      >
        {/* Professional portrait silhouette */}
        <svg
          viewBox="0 0 200 200"
          className="absolute inset-0 w-full h-full opacity-90"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.0)" />
            </radialGradient>
          </defs>
          <rect width="200" height="200" fill="url(#bgGrad)" />

          {/* Suit / shoulders */}
          <path d="M 30 200 Q 50 140 100 130 Q 150 140 170 200 Z" fill="rgba(0,0,0,0.5)" />
          {/* Tie / collar */}
          <path d="M 90 130 L 100 160 L 110 130 Q 100 140 90 130 Z" fill="rgba(255,255,255,0.3)" />
          {/* Neck */}
          <rect x="88" y="118" width="24" height="18" rx="4" fill="rgb(200,160,120)" />
          {/* Head */}
          <ellipse cx="100" cy="90" rx="38" ry="42" fill="rgb(210,170,130)" />
          {/* Hair */}
          <ellipse cx="100" cy="55" rx="38" ry="20" fill="rgb(60,40,20)" />
          {/* Eyes */}
          <ellipse cx="85"  cy="87" rx="5" ry="6" fill="white" />
          <ellipse cx="115" cy="87" rx="5" ry="6" fill="white" />
          <ellipse cx="86"  cy="88" rx="3" ry="4" fill="rgb(50,30,10)" />
          <ellipse cx="116" cy="88" rx="3" ry="4" fill="rgb(50,30,10)" />
          {/* Nose */}
          <ellipse cx="100" cy="100" rx="4" ry="3" fill="rgb(180,130,90)" />
          {/* Mouth — animated for speaking */}
          {isSpeaking ? (
            <ellipse
              cx="100" cy="113" rx="10" ry="5"
              fill="rgb(140,60,60)"
              className="origin-center"
              style={{ animation: "mouthAnim 0.4s ease-in-out infinite alternate" }}
            />
          ) : (
            <path d="M 90 113 Q 100 118 110 113" stroke="rgb(150,90,70)" strokeWidth="2" fill="none" />
          )}
          {/* Eyebrow expression */}
          {isThinking && (
            <>
              <path d="M 79 78 Q 87 74 93 78" stroke="rgb(60,40,20)" strokeWidth="2.5" fill="none" />
              <path d="M 107 78 Q 113 74 121 78" stroke="rgb(60,40,20)" strokeWidth="2.5" fill="none" />
            </>
          )}
        </svg>

        {/* Pulse ring for active states */}
        {cfg.pulse && (
          <div
            className={`absolute inset-0 rounded-full ${cfg.ringColor.replace("ring-", "bg-").replace("-400", "-400/20")} animate-ping`}
            style={{ animationDuration: "2s" }}
          />
        )}
      </div>

      {/* State indicator below avatar */}
      <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full
        bg-white/10 backdrop-blur-sm border border-white/20 text-white`}>
        {Icon && <Icon className="w-4 h-4 animate-pulse" />}
        <span className="text-sm font-medium">{cfg.label}</span>
        {isSpeaking && <WaveformBars active color="bg-white/70" />}
        {isListening && <WaveformBars active color="bg-emerald-300/70" />}
      </div>
    </div>
  );
}

// ── D-ID WebRTC Avatar Component ─────────────────────────────────────────────

function DIDAvatar({ state, speakText, presenterUrl, onReady, onError }) {
  const videoRef = useRef(null);
  const peerRef = useRef(null);
  const streamInfoRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const lastSpokenRef = useRef("");

  useEffect(() => {
    let active = true;

    const initDID = async () => {
      try {
        const streamRes = await interviewService.createDIDStream(presenterUrl);
        if (!streamRes.data?.success || !streamRes.data?.available) {
          throw new Error(streamRes.data?.message || "D-ID Stream unavailable");
        }

        const { streamId, offer, iceServers, sessionId } = streamRes.data;
        streamInfoRef.current = { streamId, sessionId };

        const pc = new RTCPeerConnection({ iceServers: iceServers || [{ urls: "stun:stun.l.google.com:19302" }] });
        peerRef.current = pc;

        pc.ontrack = (event) => {
          if (videoRef.current && event.streams?.[0]) {
            videoRef.current.srcObject = event.streams[0];
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            interviewService.sendDIDICE(
              streamId,
              event.candidate.candidate,
              event.candidate.sdpMid,
              event.candidate.sdpMLineIndex,
              sessionId
            ).catch((e) => console.warn("ICE send error:", e));
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
            if (active) {
              setConnected(true);
              onReady?.();
            }
          }
          if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
            onError?.("D-ID Stream disconnected");
          }
        };

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await interviewService.sendDIDSDP(streamId, answer, sessionId);
      } catch (err) {
        if (active) onError?.(err.message || "D-ID connection failed");
      }
    };

    initDID();

    return () => {
      active = false;
      if (streamInfoRef.current) {
        interviewService.closeDIDStream(streamInfoRef.current.streamId, streamInfoRef.current.sessionId);
      }
      peerRef.current?.close();
    };
  }, [onReady, onError]);

  // Make avatar speak whenever speakText changes
  useEffect(() => {
    if (connected && speakText && speakText !== lastSpokenRef.current && streamInfoRef.current) {
      lastSpokenRef.current = speakText;
      interviewService.speakDIDStream(
        streamInfoRef.current.streamId,
        speakText,
        streamInfoRef.current.sessionId
      ).catch((err) => console.error("D-ID speak error:", err));
    }
  }, [speakText, connected]);

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={false}
        className={`w-72 h-72 sm:w-80 sm:h-80 rounded-full object-cover ring-4 ring-indigo-500 ring-offset-4 ring-offset-slate-950 transition-opacity duration-500 shadow-2xl ${
          connected ? "opacity-100" : "opacity-0"
        }`}
      />
      {!connected && (
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatedAvatar state="idle" />
        </div>
      )}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur border border-indigo-500/30 text-white text-xs shadow-lg">
          {connected ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <Wifi className="w-3.5 h-3.5" /> D-ID Photorealistic Stream
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400">
              <WifiOff className="w-3.5 h-3.5" /> Connecting D-ID WebRTC...
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main AvatarPanel ──────────────────────────────────────────────────────────

export default function AvatarPanel({
  avatarState = "idle",
  speakText = "",
  presenterUrl = null,
  heygenToken = null,
  isAvatarAvailable = false,
  onAvatarReady,
  onAvatarError,
}) {
  const [didFailed, setDidFailed] = useState(false);
  const [didReady, setDidReady] = useState(false);

  const handleDIDError = useCallback((msg) => {
    console.warn("[AvatarPanel] D-ID error fallback:", msg);
    setDidFailed(true);
    onAvatarError?.(msg);
  }, [onAvatarError]);

  const handleDIDReady = useCallback(() => {
    setDidReady(true);
    onAvatarReady?.();
  }, [onAvatarReady]);

  return (
    <div className="flex flex-col items-center gap-3">
      {!didFailed ? (
        <DIDAvatar
          state={avatarState}
          speakText={speakText}
          presenterUrl={presenterUrl}
          onReady={handleDIDReady}
          onError={handleDIDError}
        />
      ) : (
        <AnimatedAvatar state={avatarState} />
      )}

      {/* Mode Badge */}
      {!didFailed && didReady && (
        <p className="text-xs text-indigo-400 font-medium flex items-center gap-1.5 mt-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-300" /> Active Provider: D-ID Realtime Avatar
        </p>
      )}

      {didFailed && (
        <p className="text-xs text-amber-400 text-center mt-1">
          Avatar stream standby — running in interactive voice mode
        </p>
      )}
    </div>
  );
}

/**
 * LiveInterview — human-like video interview room with conversational state machine.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Pause, Play, Square,
  CheckCircle, AlertTriangle, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import SpeechPipeline from "../../../features/virtualInterview/SpeechPipeline";
import HumanAvatar from "../../../features/virtualInterview/HumanAvatar";
import InterviewProgressPanel from "../../../features/virtualInterview/InterviewProgressPanel";
import { interviewService, unwrapInterviewResponse } from "../../../services/interviewService";
import {
  INTERVIEWER_STATES,
  AVATAR_EMOTIONS,
  mapEmotionToAvatar,
  isReadyConfirmation,
} from "../../../features/virtualInterview/constants";
import { stopMediaStream } from "../../../features/virtualInterview/mediaAccess";

const fmt = (secs) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const buildLocalReport = (targetRole, answeredCount, avgScore) => ({
  success: true,
  targetRole,
  summary: { overallScore: avgScore ?? (answeredCount > 0 ? 68 : 0) },
  strengths: answeredCount > 0 ? ["Completed spoken answers in practice mode"] : [],
  weaknesses: ["Connect to server for full AI evaluation"],
  recommendations: ["Retry with a stable connection for dynamic follow-up questions"],
  readinessLevel: "Needs More Practice",
  evaluations: [],
});

export default function LiveInterview({ session, mediaStream: initialMediaStream, onFinish, onExit }) {
  const activeSessionId = session?.sessionId;
  const candidateName = session?.candidateName || "";
  const targetRole = session?.targetRole || "Software Engineer";
  const activeDuration = session?.totalDurationMs || 600000;
  const presenterUrl = session?.presenterUrl || "/interviewer.jpeg";

  const [state, setState] = useState(INTERVIEWER_STATES.WELCOME);
  const [emotion, setEmotion] = useState("speaking");
  const [currentQuestion, setCurrentQuestion] = useState(session?.firstQuestion || { index: 0, text: "", section: "warmup" });
  const [displayCaption, setDisplayCaption] = useState("");
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [answeredCount, setAnsweredCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.floor(activeDuration / 1000));
  const [micEnabled, setMicEnabled] = useState(true);
  const [speakerEnabled, setSpeakerEnabled] = useState(true);
  const [error, setError] = useState("");
  const [avgScore, setAvgScore] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [nodTrigger, setNodTrigger] = useState(0);
  const [phase, setPhase] = useState("welcome");
  const [waitingForReady, setWaitingForReady] = useState(session?.waitForReady ?? true);
  const [candidateStream, setCandidateStream] = useState(null);

  const speechRef = useRef(null);
  const timerRef = useRef(null);
  const stateRef = useRef(state);
  const processingRef = useRef(false);
  const listenStartRef = useRef(0);
  const welcomeStartedRef = useRef(false);

  const candidateVideoRef = useRef(null);
  const candidateStreamRef = useRef(initialMediaStream || null);

  useEffect(() => { stateRef.current = state; }, [state]);

  // Candidate self-view — reuse stream from pre-check when available
  useEffect(() => {
    let stream = initialMediaStream || null;

    const attach = (s) => {
      candidateStreamRef.current = s;
      setCandidateStream(s);
      if (candidateVideoRef.current && s?.getVideoTracks?.().length) {
        candidateVideoRef.current.srcObject = s;
        candidateVideoRef.current.play?.().catch(() => {});
      }
    };

    if (stream) {
      attach(stream);
      if (!stream.getVideoTracks?.().length) {
        navigator.mediaDevices
          ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
          .then((videoOnly) => attach(videoOnly))
          .catch(() => {});
      }
    } else {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user" }, audio: false })
        .then((s) => {
          attach(s);
        })
        .catch(() => {});
    }

    return () => {
      stopMediaStream(candidateStreamRef.current);
      candidateStreamRef.current = null;
    };
  }, [initialMediaStream]);

  const handleEndRef = useRef(() => {});

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleEndRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const speakAI = useCallback((text, onDone, pauseMs = 0) => {
    if (!text?.trim()) { onDone?.(); return; }
    setDisplayCaption(text);
    if (!speakerEnabled) {
      setTimeout(onDone, 400);
      return;
    }
    speechRef.current?.stopListening();
    setState(INTERVIEWER_STATES.SPEAKING);
    setEmotion("speaking");

    const startSpeak = () => {
      speechRef.current?.speak(text, () => {
        setEmotion("listening");
        onDone?.();
      });
    };

    if (pauseMs > 0) {
      setState(INTERVIEWER_STATES.THINKING);
      setEmotion("thinking");
      setTimeout(startSpeak, pauseMs);
    } else {
      startSpeak();
    }
  }, [speakerEnabled]);

  const beginListening = useCallback(() => {
    setState(INTERVIEWER_STATES.LISTENING);
    setEmotion("listening");
    if (waitingForReady) {
      setDisplayCaption("Say \"Yes\" or \"I'm ready\" when you'd like to begin.");
    }
    listenStartRef.current = Date.now();
    speechRef.current?.startListening();
  }, [waitingForReady]);

  const activateListening = useCallback(() => {
    if (!micEnabled) {
      setError("Microphone is off. Turn it on to respond.");
      return;
    }
    setTranscript("");
    setFinalTranscript("");
    beginListening();
  }, [micEnabled, beginListening]);

  // Opening sequence — welcome + wait for ready
  useEffect(() => {
    if (welcomeStartedRef.current) return;

    const greeting = (session?.speakText || session?.greeting || "").trim();
    const firstQ = session?.firstQuestion;
    if (!greeting) return;

    let attempts = 0;
    const maxAttempts = 40;

    const startWelcome = () => {
      if (welcomeStartedRef.current) return;
      if (!speechRef.current?.speak) {
        attempts += 1;
        if (attempts < maxAttempts) {
          setTimeout(startWelcome, 100);
        } else {
          setError("Voice engine failed to start. Refresh and try again.");
          setState(INTERVIEWER_STATES.ERROR);
        }
        return;
      }

      welcomeStartedRef.current = true;
      setDisplayCaption(greeting);
      setState(INTERVIEWER_STATES.SPEAKING);
      setEmotion("speaking");

      speechRef.current.speak(greeting, () => {
        if (waitingForReady) {
          beginListening();
        } else if (firstQ?.text) {
          speakAI(firstQ.text, () => activateListening());
        } else {
          activateListening();
        }
      });
    };

    const timer = setTimeout(startWelcome, 250);
    return () => clearTimeout(timer);
  }, [session?.sessionId]);

  const processAnswer = useCallback(async (answer) => {
    if (processingRef.current) return;
    processingRef.current = true;
    speechRef.current?.stopListening();
    setTranscript("");
    setFinalTranscript("");
    setState(INTERVIEWER_STATES.ANALYZING);
    setEmotion("thinking");

    const durationMs = Date.now() - listenStartRef.current;

    try {
      // Ready confirmation before first question
      if (waitingForReady && isReadyConfirmation(answer)) {
        setWaitingForReady(false);
        if (!activeSessionId?.startsWith("local-")) {
          const res = unwrapInterviewResponse(
            await interviewService.confirmReady(activeSessionId)
          );
          speakAI(res.speakText, () => {
            setCurrentQuestion(res.nextQuestion || currentQuestion);
            setPhase(res.phase || "introduction");
            processingRef.current = false;
            activateListening();
          }, res.thinkingPauseMs || 500);
          return;
        }
        speakAI(`Great. Let's begin. ${session?.firstQuestion?.text || "Tell me about yourself."}`, () => {
          setWaitingForReady(false);
          processingRef.current = false;
          activateListening();
        }, 600);
        return;
      }

      if (activeSessionId?.startsWith("local-")) {
        throw new Error("offline");
      }

      const res = unwrapInterviewResponse(
        await interviewService.submitAnswer(activeSessionId, {
          transcript: answer,
          questionIndex: currentQuestion.index,
          durationMs,
        })
      );

      setAnsweredCount((c) => c + 1);
      if (res.avgScore) setAvgScore(res.avgScore);
      setPhase(res.phase || phase);
      setEmotion(res.emotion || "speaking");
      setNodTrigger((n) => n + 1);

      const nextQ = res.nextQuestion;
      if (nextQ) {
        setCurrentQuestion({
          index: nextQ.index ?? currentQuestion.index + 1,
          text: nextQ.text,
          section: nextQ.section || "general",
        });
      }

      setState(INTERVIEWER_STATES.THINKING);
      speakAI(
        res.speakText || nextQ?.text || "Thank you. Let's continue.",
        () => {
          processingRef.current = false;
          activateListening();
        },
        res.thinkingPauseMs || 800
      );
    } catch {
      setAnsweredCount((c) => c + 1);
      setNodTrigger((n) => n + 1);
      const fallbacks = [
        "That's interesting. Can you walk me through a specific example from that experience?",
        "I see. What was the most challenging part of that for you?",
        "Alright. How did you measure whether that approach was successful?",
      ];
      const line = fallbacks[answeredCount % fallbacks.length];
      setState(INTERVIEWER_STATES.THINKING);
      speakAI(`Okay. ${line}`, () => {
        setCurrentQuestion((q) => ({ ...q, index: q.index + 1, text: line }));
        processingRef.current = false;
        activateListening();
      }, 900);
    }
  }, [activeSessionId, currentQuestion, waitingForReady, session, speakAI, activateListening, answeredCount, phase]);

  const handleListeningEnd = useCallback(() => {
    if (stateRef.current === INTERVIEWER_STATES.COMPLETED || processingRef.current) return;
    const answer = finalTranscript.trim();
    if (answer.length >= 2 && stateRef.current === INTERVIEWER_STATES.LISTENING) {
      processAnswer(answer);
      return;
    }
    if (stateRef.current === INTERVIEWER_STATES.LISTENING) {
      speechRef.current?.startListening();
    }
  }, [finalTranscript, processAnswer]);

  const handleEnd = useCallback(async () => {
    clearInterval(timerRef.current);
    speechRef.current?.stopListening();
    speechRef.current?.stopSpeaking();
    setState(INTERVIEWER_STATES.COMPLETED);
    setEmotion("goodbye");

    const closing = "Thank you for your time today. I'll now prepare your performance report.";
    speechRef.current?.speak(closing);

    try {
      let reportData = null;
      if (activeSessionId?.startsWith("local-")) {
        reportData = buildLocalReport(targetRole, answeredCount, avgScore);
      } else {
        const res = unwrapInterviewResponse(await interviewService.end(activeSessionId));
        if (res?.success) reportData = res;
      }
      setTimeout(() => onFinish?.(reportData), 2800);
    } catch {
      onFinish?.(buildLocalReport(targetRole, answeredCount, avgScore));
    }
  }, [activeSessionId, targetRole, answeredCount, avgScore, onFinish]);

  handleEndRef.current = handleEnd;

  const handlePause = () => {
    if (state === INTERVIEWER_STATES.PAUSED) {
      activateListening();
    } else {
      speechRef.current?.stopListening();
      speechRef.current?.stopSpeaking();
      setState(INTERVIEWER_STATES.PAUSED);
    }
  };

  const totalExpected = Math.ceil((activeDuration / 1000 / 60) * 1.5);
  const progress = Math.min(100, Math.round((answeredCount / Math.max(totalExpected, 1)) * 100));
  const avatarEmotion = mapEmotionToAvatar(emotion);
  const statusKey = state === INTERVIEWER_STATES.FOLLOW_UP ? "follow_up"
    : state === INTERVIEWER_STATES.ANALYZING ? "analyzing"
    : state === INTERVIEWER_STATES.THINKING ? "thinking"
    : state === INTERVIEWER_STATES.SPEAKING ? "speaking"
    : state === INTERVIEWER_STATES.LISTENING ? "listening"
    : state;

  return (
    <div className="min-h-full bg-gray-100 text-gray-900 flex flex-col relative">
      <SpeechPipeline
        ref={speechRef}
        onTranscript={(text, isFinal) => {
          setTranscript(text);
          if (isFinal) setFinalTranscript(text);
        }}
        onListeningStart={() => setState(INTERVIEWER_STATES.LISTENING)}
        onListeningEnd={handleListeningEnd}
        onSpeakStart={() => { setState(INTERVIEWER_STATES.SPEAKING); setEmotion("speaking"); }}
        onSpeakEnd={() => setAudioLevel(0)}
        onBargeIn={() => {
          setState(INTERVIEWER_STATES.LISTENING);
          setEmotion("listening");
        }}
        onAudioLevel={setAudioLevel}
        onSpeechStarted={() => setNodTrigger((n) => n + 1)}
        onError={(msg) => { setError(msg); toast.error(msg); }}
      />

      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="font-semibold text-sm">Live interview</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 capitalize">{phase}</span>
        </div>
        <span className={`font-mono text-sm font-bold ${timeLeft < 60 ? "text-red-600" : ""}`}>{fmt(timeLeft)}</span>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 p-4 overflow-auto">
        <InterviewProgressPanel
          questionNumber={answeredCount + 1}
          totalExpected={totalExpected}
          progress={progress}
          currentTopic={currentQuestion.section}
          timeLeft={timeLeft}
          status={statusKey}
          avgScore={avgScore}
        />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[320px]">
          {/* Interviewer */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center shadow-sm relative">
            <p className="absolute top-3 left-3 text-xs font-semibold text-gray-500 uppercase">AI interviewer</p>
            <HumanAvatar
              emotion={avatarEmotion}
              audioLevel={audioLevel}
              presenterUrl={presenterUrl}
              nodTrigger={nodTrigger}
            />
            <div className="mt-4 w-full max-w-md rounded-xl bg-gray-50 border border-gray-200 p-3 min-h-[72px]">
              {state === INTERVIEWER_STATES.ANALYZING || state === INTERVIEWER_STATES.THINKING ? (
                <div className="flex items-center gap-2 text-indigo-600 text-sm">
                  <Loader className="w-4 h-4 animate-spin" /> Processing your answer…
                </div>
              ) : (
                <p className="text-sm text-gray-800 leading-relaxed">{displayCaption || currentQuestion.text || "…"}</p>
              )}
            </div>
          </div>

          {/* Candidate */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden relative shadow-sm">
            <p className="absolute top-3 left-3 text-xs font-semibold text-gray-300 uppercase z-10">You</p>
            {candidateStream?.getVideoTracks?.().length ? (
              <video
                autoPlay
                playsInline
                muted
                ref={candidateVideoRef}
                className="w-full h-full min-h-[280px] object-cover"
                style={{ transform: "scaleX(-1)" }}
              />
            ) : (
              <div className="w-full min-h-[280px] flex items-center justify-center text-gray-500 text-sm">Camera off</div>
            )}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
              <p className="text-xs text-gray-300 mb-1">
                {state === INTERVIEWER_STATES.LISTENING ? "● Listening…" : "Your response"}
              </p>
              <p className="text-sm text-white line-clamp-3">
                {transcript || finalTranscript || (state === INTERVIEWER_STATES.LISTENING ? "Speak naturally…" : "…")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-4 mb-2 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <footer className="bg-white border-t border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMicEnabled((v) => !v)} className={`p-2.5 rounded-lg border ${micEnabled ? "bg-gray-100" : "bg-red-50 border-red-200"}`}>
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-600" />}
          </button>
          <button type="button" onClick={() => { setSpeakerEnabled((v) => !v); if (speakerEnabled) speechRef.current?.stopSpeaking(); }} className="p-2.5 rounded-lg border bg-gray-100">
            {speakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button type="button" onClick={handlePause} className="p-2.5 rounded-lg border bg-gray-100">
            {state === INTERVIEWER_STATES.PAUSED ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
        </div>

        {state === INTERVIEWER_STATES.LISTENING && waitingForReady && (
          <button
            type="button"
            onClick={() => processAnswer("Yes, I'm ready")}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium"
          >
            I'm ready
          </button>
        )}

        {state === INTERVIEWER_STATES.LISTENING && !waitingForReady && (
          <button
            type="button"
            onClick={() => {
              const a = finalTranscript.trim() || transcript.trim();
              if (a.length >= 2) processAnswer(a);
              else toast("No speech detected yet", { icon: "🎤" });
            }}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
          >
            Finish answer
          </button>
        )}

        <button
          type="button"
          onClick={() => { if (window.confirm("End interview and generate report?")) handleEnd(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
        >
          <Square className="w-3.5 h-3.5" /> End interview
        </button>
      </footer>

      {state === INTERVIEWER_STATES.COMPLETED && (
        <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold">Interview complete</h2>
            <p className="text-gray-500 text-sm">Generating your performance report…</p>
          </div>
        </div>
      )}
    </div>
  );
}

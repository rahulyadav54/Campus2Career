/**
 * LiveInterview.jsx
 *
 * Main interview screen. Manages the full state machine:
 * IDLE → AI_SPEAKING → WAITING_FOR_STUDENT → LISTENING → PROCESSING → AI_THINKING → AI_SPEAKING → ...
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic, MicOff, Volume2, VolumeX, Pause, Play, Square,
  Clock, BarChart2, CheckCircle, AlertTriangle, Loader,
} from "lucide-react";
import toast from "react-hot-toast";
import AvatarPanel from "./AvatarPanel";
import VoiceEngine from "./VoiceEngine";
import interviewService from "../../../services/interviewService";

// ── Interview state machine states ────────────────────────────────────────────

const STATES = {
  IDLE:              "idle",
  AI_SPEAKING:       "ai_speaking",
  WAITING:           "waiting",
  LISTENING:         "listening",
  PROCESSING:        "processing",
  AI_THINKING:       "ai_thinking",
  PAUSED:            "paused",
  COMPLETED:         "completed",
  ERROR:             "error",
};

// Map interview state → avatar state
const toAvatarState = (state) => ({
  [STATES.IDLE]:        "idle",
  [STATES.AI_SPEAKING]: "speaking",
  [STATES.WAITING]:     "idle",
  [STATES.LISTENING]:   "listening",
  [STATES.PROCESSING]:  "thinking",
  [STATES.AI_THINKING]: "thinking",
  [STATES.PAUSED]:      "idle",
  [STATES.COMPLETED]:   "completed",
  [STATES.ERROR]:       "idle",
}[state] || "idle");

// ── Helper: format seconds as MM:SS ───────────────────────────────────────────
const fmt = (secs) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function LiveInterview({
  sessionId,
  greeting,
  firstQuestion,
  totalDurationMs,
  presenterUrl,
  heygenToken,
  isAvatarAvailable,
  onComplete,
  onFinish,
  onExit,
  session,
}) {
  const activeSessionId    = sessionId || session?.sessionId;
  const activeGreeting     = greeting || session?.greeting;
  const activeFirstQ       = firstQuestion || session?.firstQuestion;
  const activeDuration     = totalDurationMs || session?.totalDurationMs || 600000;
  const activePresenterUrl = presenterUrl || session?.presenterUrl;
  const activeOnFinish     = onFinish || onComplete;

  // ── State ───────────────────────────────────────────────────────────────────

  const [interviewState, setInterviewState]   = useState(STATES.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState(activeFirstQ || { index: 0, text: "", section: "general" });
  const [transcript, setTranscript]           = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [questionCount, setQuestionCount]     = useState(1);
  const [answeredCount, setAnsweredCount]     = useState(0);
  const [timeLeft, setTimeLeft]               = useState(Math.floor(activeDuration / 1000));
  const [micEnabled, setMicEnabled]           = useState(true);
  const [speakerEnabled, setSpeakerEnabled]   = useState(true);
  const [error, setError]                     = useState("");
  const [avgScore, setAvgScore]               = useState(null);

  const voiceRef      = useRef(null);
  const timerRef      = useRef(null);
  const stateRef      = useRef(STATES.IDLE);
  const bargeInRef    = useRef(false);
  const processingRef = useRef(false);

  // Keep stateRef in sync
  useEffect(() => { stateRef.current = interviewState; }, [interviewState]);

  // ── Timer ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (stateRef.current !== STATES.COMPLETED) {
            toast("⏰ Time's up! Ending interview…", { icon: "⏰" });
            handleEnd();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── On mount: greet first, then enable the microphone ───────────────────────

  useEffect(() => {
    voiceRef.current?.setInterviewActive(true);

    if (!activeGreeting && !activeFirstQ?.text) return;
    const text = activeGreeting
      ? `${activeGreeting} ${activeFirstQ?.text || ""}`
      : activeFirstQ?.text || "";

    setCurrentQuestion(activeFirstQ || { index: 0, text, section: "general" });

    const t = setTimeout(() => {
      speakAI(text, () => {
        setInterviewState(STATES.LISTENING);
        voiceRef.current?.startListening();
      });
    }, 800);
    return () => {
      clearTimeout(t);
      voiceRef.current?.setInterviewActive(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice helpers ────────────────────────────────────────────────────────────

  const speakAI = useCallback((text, onDone) => {
    if (!speakerEnabled) { onDone?.(); return; }
    voiceRef.current?.stopListening();
    setInterviewState(STATES.AI_SPEAKING);
    voiceRef.current?.speak(text, onDone);
  }, [speakerEnabled]);

  const activateListening = useCallback(() => {
    if (!micEnabled) return;
    setTranscript("");
    setFinalTranscript("");
    setInterviewState(STATES.LISTENING);
    bargeInRef.current = false;
    voiceRef.current?.startListening();
  }, [micEnabled]);

  // ── Voice engine callbacks ──────────────────────────────────────────────────

  const handleTranscript = useCallback((text, isFinal) => {
    setTranscript(text);
    if (isFinal) setFinalTranscript(text);
  }, []);

  const handleBargeIn = useCallback(() => {
    bargeInRef.current = true;
    setInterviewState(STATES.LISTENING);
  }, []);

  const handleSpeechError = useCallback((msg) => {
    setError(msg);
    setInterviewState(STATES.ERROR);
    toast.error(msg);
  }, []);

  // ── Process student's answer ────────────────────────────────────────────────

  const processAnswer = useCallback(async (answer) => {
    if (processingRef.current) return;
    processingRef.current = true;

    bargeInRef.current = false;
    setTranscript("");
    setFinalTranscript("");
    voiceRef.current?.stopListening();
    setInterviewState(STATES.PROCESSING);

    try {
      if (activeSessionId?.startsWith("local-")) {
        throw new Error("Client session mode");
      }
      const res = await interviewService.submitAnswer(activeSessionId, {
        transcript:    answer,
        questionIndex: currentQuestion.index,
      });

      setAnsweredCount(prev => prev + 1);
      const data = res.data?.data || res.data || res;
      if (data?.avgScore) setAvgScore(data.avgScore);

      const nextQ = data?.nextQuestion || res.nextQuestion;
      const speakText = data?.speakText || res.speakText || nextQ?.text || "Great job. Let's move to the next question.";

      setCurrentQuestion({
        index:   nextQ?.index ?? currentQuestion.index + 1,
        text:    nextQ?.text || "Tell me about a technical challenge you resolved recently.",
        section: nextQ?.section || "technical",
      });
      setQuestionCount(prev => prev + 1);

      setInterviewState(STATES.AI_THINKING);

      setTimeout(() => {
        if (stateRef.current === STATES.AI_THINKING) {
          speakAI(speakText, () => {
            processingRef.current = false;
            setInterviewState(STATES.LISTENING);
            voiceRef.current?.startListening();
          });
        } else {
          processingRef.current = false;
        }
      }, 500);

    } catch (err) {
      console.warn("[LiveInterview] processAnswer fallback:", err.message);
      const mockQuestions = [
        { text: "Can you describe a technical challenge you faced in a recent project and how you resolved it?", section: "technical" },
        { text: "How do you prioritize tasks when working under tight deadlines?", section: "behavioral" },
        { text: "What are your core strengths and areas you are currently working to improve?", section: "hr" },
        { text: "Where do you see yourself professionally in the next three years?", section: "hr" },
      ];
      setAnsweredCount(prev => prev + 1);
      const nextIndex = currentQuestion.index + 1;
      const mockQ = mockQuestions[(nextIndex - 1) % mockQuestions.length];
      const speakText = `Thank you for your answer. ${mockQ.text}`;

      setCurrentQuestion({
        index: nextIndex,
        text: mockQ.text,
        section: mockQ.section,
      });
      setQuestionCount(prev => prev + 1);

      setInterviewState(STATES.AI_THINKING);

      setTimeout(() => {
        speakAI(speakText, () => {
          processingRef.current = false;
          setInterviewState(STATES.LISTENING);
          voiceRef.current?.startListening();
        });
      }, 500);
    }
  }, [activeSessionId, currentQuestion, speakAI]);

  const handleListeningEnd = useCallback(() => {
    if (stateRef.current === STATES.COMPLETED || processingRef.current) return;

    const answer = finalTranscript.trim();
    if (answer.length >= 3 && (stateRef.current === STATES.LISTENING || bargeInRef.current)) {
      processAnswer(answer);
      return;
    }

    if (stateRef.current !== STATES.PROCESSING && stateRef.current !== STATES.COMPLETED) {
      setInterviewState(STATES.LISTENING);
      voiceRef.current?.startListening();
    }
  }, [finalTranscript, processAnswer]);

  // ── Manual finish answer button ──────────────────────────────────────────────

  const handleFinishAnswer = useCallback(() => {
    if (processingRef.current) return;
    if (stateRef.current !== STATES.LISTENING && stateRef.current !== STATES.AI_SPEAKING) return;
    voiceRef.current?.stopListening();
    const answer = finalTranscript.trim() || transcript.trim();
    if (answer.length < 3) {
      toast("No answer detected. Please speak into your microphone.", { icon: "🎤" });
      voiceRef.current?.startListening();
      return;
    }
    processAnswer(answer);
  }, [finalTranscript, transcript, processAnswer]);

  // ── End interview ────────────────────────────────────────────────────────────

  const handleEnd = useCallback(async () => {
    clearInterval(timerRef.current);
    voiceRef.current?.stopListening();
    voiceRef.current?.stopSpeaking();
    voiceRef.current?.setInterviewActive(false);
    setInterviewState(STATES.COMPLETED);

    const endText = "Thank you for your time. That concludes our interview. I'll now generate your performance report.";
    voiceRef.current?.speak(endText);

    try {
      let reportData = null;
      if (!activeSessionId?.startsWith("local-")) {
        const res = await interviewService.end(activeSessionId);
        reportData = res.data?.data || res.data || res;
      }
      setTimeout(() => activeOnFinish?.(reportData), 2500);
    } catch (err) {
      console.error("[LiveInterview] endInterview error:", err);
      activeOnFinish?.(null);
    }
  }, [activeSessionId, activeOnFinish]);

  // ── Pause / resume ───────────────────────────────────────────────────────────

  const handlePause = useCallback(() => {
    if (interviewState === STATES.PAUSED) {
      setInterviewState(STATES.LISTENING);
      voiceRef.current?.startListening();
    } else {
      voiceRef.current?.stopListening();
      voiceRef.current?.stopSpeaking();
      setInterviewState(STATES.PAUSED);
    }
  }, [interviewState]);

  // ── Progress ─────────────────────────────────────────────────────────────────

  const totalExpected  = Math.ceil((activeDuration / 1000 / 60) * 1.5); // ~1.5 Qs per min
  const progress       = Math.min(100, Math.round((answeredCount / Math.max(totalExpected, 1)) * 100));
  const isTimeLow      = timeLeft < 60;

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-gray-950 text-white flex flex-col">
      {/* VoiceEngine — non-rendering */}
      <VoiceEngine
        ref={voiceRef}
        onTranscript={handleTranscript}
        onListeningStart={() => setInterviewState(STATES.LISTENING)}
        onListeningEnd={handleListeningEnd}
        onSpeakStart={() => setInterviewState(STATES.AI_SPEAKING)}
        onSpeakEnd={() => {}}
        onBargeIn={handleBargeIn}
        onError={handleSpeechError}
      />

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-gray-900/80 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-gray-200">AI Virtual Interview</span>
          <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-400 capitalize">
            {currentQuestion.section}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-mono font-bold ${isTimeLow ? "text-red-400 animate-pulse" : "text-gray-200"}`}>
          <Clock className="w-4 h-4" />
          {fmt(timeLeft)}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-auto">

        {/* Left: Avatar + question */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 lg:p-10">
          {/* Avatar */}
          <AvatarPanel
            avatarState={toAvatarState(interviewState)}
            speakText={currentQuestion.text}
            presenterUrl={activePresenterUrl}
            heygenToken={heygenToken}
            isAvatarAvailable={isAvatarAvailable}
          />

          {/* Current question */}
          <div className="max-w-lg w-full">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
              {interviewState === STATES.AI_THINKING || interviewState === STATES.PROCESSING ? (
                <div className="flex items-center gap-3 text-indigo-300">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Analyzing your answer…</span>
                </div>
              ) : interviewState === STATES.PAUSED ? (
                <p className="text-amber-300 text-sm font-medium flex items-center gap-2">
                  <Pause className="w-4 h-4" /> Interview paused
                </p>
              ) : (
                <p className="text-white text-base sm:text-lg leading-relaxed font-medium">
                  {currentQuestion.text || "Preparing your next question…"}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="max-w-lg w-full">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>Question {answeredCount + 1}</span>
              <span>{progress}% through</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Transcript + controls */}
        <div className="w-full lg:w-96 flex flex-col border-t lg:border-t-0 lg:border-l border-white/10 bg-gray-900/50">

          {/* Transcript panel */}
          <div className="flex-1 p-5 overflow-y-auto">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full transition-colors ${
                interviewState === STATES.LISTENING ? "bg-emerald-400 animate-pulse" : "bg-gray-600"
              }`} />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {interviewState === STATES.LISTENING ? "Listening…" : "Your Answer"}
              </span>
            </div>

            {transcript || finalTranscript ? (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {transcript || finalTranscript}
              </p>
            ) : (
              <p className="text-gray-600 text-sm italic">
                {interviewState === STATES.LISTENING
                  ? "Speak now — I'm listening…"
                  : interviewState === STATES.WAITING
                  ? "Preparing to listen…"
                  : "Your response will appear here."}
              </p>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-red-900/40 border border-red-700/50">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-300 text-xs">{error}</p>
              </div>
            )}

            {avgScore !== null && (
              <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <BarChart2 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs text-gray-400">Running score:</span>
                <span className="text-sm font-bold text-indigo-300">{avgScore}/100</span>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 border-t border-white/10 flex flex-col gap-3">
            {/* Finish answer (manual fallback) */}
            {interviewState === STATES.LISTENING && (
              <button
                onClick={handleFinishAnswer}
                id="finish-answer-btn"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Finish Answer
              </button>
            )}

            {/* Icon controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* Mic toggle */}
                <button
                  onClick={() => setMicEnabled(v => !v)}
                  title={micEnabled ? "Mute microphone" : "Unmute microphone"}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    micEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-900/50 hover:bg-red-900/70"
                  }`}
                >
                  {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-red-400" />}
                </button>

                {/* Speaker toggle */}
                <button
                  onClick={() => {
                    setSpeakerEnabled(v => !v);
                    if (speakerEnabled) voiceRef.current?.stopSpeaking();
                  }}
                  title={speakerEnabled ? "Mute speaker" : "Unmute speaker"}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    speakerEnabled ? "bg-white/10 hover:bg-white/20" : "bg-red-900/50 hover:bg-red-900/70"
                  }`}
                >
                  {speakerEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
                </button>

                {/* Pause / resume */}
                <button
                  onClick={handlePause}
                  disabled={interviewState === STATES.COMPLETED}
                  title={interviewState === STATES.PAUSED ? "Resume" : "Pause"}
                  className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition disabled:opacity-30"
                >
                  {interviewState === STATES.PAUSED
                    ? <Play className="w-4 h-4" />
                    : <Pause className="w-4 h-4" />}
                </button>
              </div>

              {/* End interview */}
              <button
                onClick={() => {
                  if (window.confirm("End the interview now and generate your report?")) handleEnd();
                }}
                disabled={interviewState === STATES.COMPLETED}
                id="end-interview-btn"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-900/60 hover:bg-red-700 text-red-300 hover:text-white text-sm font-semibold transition disabled:opacity-30"
              >
                <Square className="w-3.5 h-3.5" />
                End Interview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Completed overlay */}
      {interviewState === STATES.COMPLETED && (
        <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Interview Complete</h2>
            <p className="text-gray-400">Generating your performance report…</p>
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      )}
    </div>
  );
}

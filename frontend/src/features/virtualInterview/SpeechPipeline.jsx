/**
 * SpeechPipeline — STT/TTS with interruption support.
 * Browser speechSynthesis with sentence chunking (Chrome drops long utterances).
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { unlockAudioOutput } from "./mediaAccess";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const MAX_CHUNK_MS = 30000;
const CHUNK_GAP_MS = 60;

/** Split into short chunks so Chrome TTS does not cut off mid-sentence */
function splitSpeechChunks(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return [];

  const sentences = trimmed.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [trimmed];
  const chunks = [];
  let buffer = "";

  for (const sentence of sentences) {
    const part = sentence.trim();
    if (!part) continue;

    const candidate = buffer ? `${buffer} ${part}` : part;
    if (candidate.length <= 140) {
      buffer = candidate;
      continue;
    }

    if (buffer) chunks.push(buffer);
    if (part.length <= 180) {
      buffer = part;
    } else {
      const words = part.split(/\s+/);
      let slice = "";
      for (const word of words) {
        const next = slice ? `${slice} ${word}` : word;
        if (next.length > 140 && slice) {
          chunks.push(slice);
          slice = word;
        } else {
          slice = next;
        }
      }
      buffer = slice;
    }
  }

  if (buffer) chunks.push(buffer);
  return chunks.length ? chunks : [trimmed];
}

const SpeechPipeline = forwardRef(function SpeechPipeline(
  {
    onTranscript,
    onListeningStart,
    onListeningEnd,
    onSpeakStart,
    onSpeakEnd,
    onBargeIn,
    onError,
    onAudioLevel,
    onSpeechStarted,
    onSpeechPaused,
    onSpeechEnded,
  },
  ref
) {
  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== "undefined" ? window.speechSynthesis : null);
  const listeningRef = useRef(false);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const speakTokenRef = useRef(0);
  const keepAliveRef = useRef(null);
  const levelTimerRef = useRef(null);
  const hadSpeechRef = useRef(false);
  const unlockedRef = useRef(false);
  const doneRef = useRef(null);
  const speakStartedRef = useRef(false);

  useEffect(() => {
    if (!synthRef.current) return undefined;
    const load = () => synthRef.current.getVoices();
    load();
    synthRef.current.addEventListener?.("voiceschanged", load);
    return () => synthRef.current?.removeEventListener?.("voiceschanged", load);
  }, []);

  const clearKeepAlive = useCallback(() => {
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (levelTimerRef.current) {
      clearInterval(levelTimerRef.current);
      levelTimerRef.current = null;
    }
  }, []);

  const getPreferredVoice = useCallback(() => {
    const voices = synthRef.current?.getVoices() || [];
    return (
      voices.find((v) => v.lang === "en-IN" || v.lang === "en_IN")
      || voices.find((v) => /en-GB|en_GB/i.test(v.lang) && /google|microsoft|natural/i.test(v.name))
      || voices.find((v) => v.lang?.startsWith("en") && /google|microsoft|natural|zira|david|samantha/i.test(v.name))
      || voices.find((v) => v.lang?.startsWith("en"))
      || voices[0]
      || null
    );
  }, []);

  const waitForVoices = useCallback(async () => {
    if (!synthRef.current) return [];
    const pick = () => synthRef.current.getVoices() || [];
    if (pick().length) return pick();
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(pick()), 800);
      const onChange = () => {
        clearTimeout(timer);
        synthRef.current?.removeEventListener?.("voiceschanged", onChange);
        resolve(pick());
      };
      synthRef.current.addEventListener?.("voiceschanged", onChange);
    });
  }, []);

  const ensureUnlocked = useCallback(async () => {
    if (unlockedRef.current) return;
    await unlockAudioOutput();
    unlockedRef.current = true;
  }, []);

  const hardStopSpeech = useCallback(() => {
    clearKeepAlive();
    try {
      synthRef.current?.cancel();
    } catch {
      /* ignore */
    }
    speakingRef.current = false;
    speakStartedRef.current = false;
    onAudioLevel?.(0);
  }, [clearKeepAlive, onAudioLevel]);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    doneRef.current = null;
    hardStopSpeech();
    onSpeakEnd?.();
  }, [hardStopSpeech, onSpeakEnd]);

  const startSpeakKeepAlive = useCallback((token) => {
    clearKeepAlive();
    keepAliveRef.current = setInterval(() => {
      if (token !== speakTokenRef.current) {
        clearKeepAlive();
        return;
      }
      const synth = synthRef.current;
      if (!synth) return;
      // Only resume — never call finish() here. Chrome falsely reports
      // !speaking between chunks and cuts audio short if we finish early.
      if (synth.paused) synth.resume();
    }, 250);

    levelTimerRef.current = setInterval(() => {
      if (!speakingRef.current) return;
      onAudioLevel?.(0.25 + Math.random() * 0.55);
    }, 120);
  }, [clearKeepAlive, onAudioLevel]);

  const speakChunk = useCallback((chunk, token, voice) => new Promise((resolve) => {
    if (token !== speakTokenRef.current || !synthRef.current) {
      resolve(false);
      return;
    }

    let settled = false;
    const settle = (ok) => {
      if (settled || token !== speakTokenRef.current) return;
      settled = true;
      resolve(ok);
    };

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = 0.93;
    utterance.pitch = 1;
    utterance.volume = 1;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    const maxMs = Math.min(MAX_CHUNK_MS, Math.max(4000, chunk.length * 100));
    const safety = setTimeout(() => settle(true), maxMs);

    utterance.onstart = () => {
      if (token !== speakTokenRef.current) return;
      speakingRef.current = true;
      if (!speakStartedRef.current) {
        speakStartedRef.current = true;
        onSpeakStart?.();
        onAudioLevel?.(0.45);
        startSpeakKeepAlive(token);
      }
    };

    utterance.onend = () => {
      clearTimeout(safety);
      settle(true);
    };

    utterance.onerror = (event) => {
      clearTimeout(safety);
      if (event?.error && event.error !== "interrupted" && event.error !== "canceled") {
        console.warn("[SpeechPipeline] TTS chunk error:", event.error, chunk.slice(0, 40));
      }
      settle(event?.error !== "interrupted" && event?.error !== "canceled");
    };

    try {
      const synth = synthRef.current;
      synth.resume();
      synth.speak(utterance);
      setTimeout(() => {
        if (token === speakTokenRef.current) synth.resume();
      }, 40);
    } catch (err) {
      clearTimeout(safety);
      console.warn("[SpeechPipeline] speak chunk failed:", err);
      settle(false);
    }
  }), [onAudioLevel, onSpeakStart, startSpeakKeepAlive]);

  const speak = useCallback(async (text, onDone) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      onDone?.();
      return;
    }

    if (!synthRef.current) {
      onError?.("Speech synthesis is not available in this browser. Use Chrome or Edge.");
      onDone?.();
      return;
    }

    const token = ++speakTokenRef.current;
    doneRef.current = onDone;
    hardStopSpeech();

    await ensureUnlocked();
    await waitForVoices();

    if (token !== speakTokenRef.current) return;

    await new Promise((r) => setTimeout(r, 100));
    if (token !== speakTokenRef.current) return;

    const chunks = splitSpeechChunks(trimmed);
    const voice = getPreferredVoice();

    try {
      synthRef.current.cancel();
      synthRef.current.resume();
    } catch {
      /* ignore */
    }

    for (let i = 0; i < chunks.length; i += 1) {
      if (token !== speakTokenRef.current) return;

      const ok = await speakChunk(chunks[i], token, voice);
      if (!ok || token !== speakTokenRef.current) break;

      if (i < chunks.length - 1) {
        await new Promise((r) => setTimeout(r, CHUNK_GAP_MS));
      }
    }

    if (token !== speakTokenRef.current) return;

    clearKeepAlive();
    speakingRef.current = false;
    speakStartedRef.current = false;
    onAudioLevel?.(0);
    onSpeakEnd?.();

    const cb = doneRef.current;
    doneRef.current = null;
    cb?.();
  }, [
    clearKeepAlive,
    ensureUnlocked,
    getPreferredVoice,
    hardStopSpeech,
    onAudioLevel,
    onError,
    onSpeakEnd,
    speakChunk,
    waitForVoices,
  ]);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    }
    listeningRef.current = false;
    if (hadSpeechRef.current) onSpeechEnded?.();
    hadSpeechRef.current = false;
  }, [onSpeechEnded]);

  const startListening = useCallback(() => {
    if (speakingRef.current) return;

    if (!SpeechRecognition) {
      onError?.("Speech recognition needs Chrome or Edge.");
      return;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        /* ignore */
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-IN";
    let finalTranscript = "";

    recognition.onstart = () => {
      listeningRef.current = true;
      onListeningStart?.();
    };

    recognition.onresult = (event) => {
      // Barge-in only when mic is intentionally active and interviewer is speaking
      if (speakingRef.current && listeningRef.current) {
        const latest = event.results[event.results.length - 1];
        const txt = latest?.[0]?.transcript?.trim() || "";
        if (latest?.isFinal && txt.split(/\s+/).filter(Boolean).length >= 4) {
          stopSpeaking();
          onBargeIn?.();
        }
      }

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += `${result[0].transcript} `;
          onTranscript?.(finalTranscript.trim(), true);
          if (!hadSpeechRef.current) {
            hadSpeechRef.current = true;
            onSpeechStarted?.();
          }
        } else {
          interim += result[0].transcript;
          onTranscript?.(`${finalTranscript}${interim}`.trim(), false);
          onSpeechPaused?.();
        }
      }

      clearTimeout(silenceTimerRef.current);
      if (finalTranscript.trim().length > 3) {
        silenceTimerRef.current = setTimeout(() => stopListening(), 2800);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        onError?.("Microphone access denied. Please allow microphone access.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        onError?.("I couldn't hear you clearly. Please try again.");
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      recognitionRef.current = null;
      onListeningEnd?.();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      /* ignore */
    }
  }, [
    onBargeIn,
    onError,
    onListeningEnd,
    onListeningStart,
    onSpeechPaused,
    onSpeechStarted,
    onTranscript,
    stopListening,
    stopSpeaking,
  ]);

  useEffect(
    () => () => {
      clearTimeout(silenceTimerRef.current);
      speakTokenRef.current += 1;
      hardStopSpeech();
      stopListening();
    },
    [hardStopSpeech, stopListening]
  );

  useImperativeHandle(
    ref,
    () => ({
      speak,
      stopSpeaking,
      startListening,
      stopListening,
      unlockAudio: ensureUnlocked,
      isListening: () => listeningRef.current,
      isSpeaking: () => speakingRef.current,
      isSupported: () => Boolean(SpeechRecognition),
    }),
    [ensureUnlocked, speak, startListening, stopListening, stopSpeaking]
  );

  return null;
});

export default SpeechPipeline;

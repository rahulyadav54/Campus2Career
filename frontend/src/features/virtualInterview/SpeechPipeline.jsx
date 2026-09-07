/**
 * SpeechPipeline — STT/TTS with interruption support.
 * Browser speechSynthesis is the primary voice path (reliable in Chrome/Edge).
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import { unlockAudioOutput } from "./mediaAccess";

const SpeechRecognition =
  typeof window !== "undefined"
    ? window.SpeechRecognition || window.webkitSpeechRecognition || null
    : null;

const MAX_SPEAK_MS = 60000;

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
    onAudioLevel?.(0);
  }, [clearKeepAlive, onAudioLevel]);

  const stopSpeaking = useCallback(() => {
    speakTokenRef.current += 1;
    doneRef.current = null;
    hardStopSpeech();
    onSpeakEnd?.();
  }, [hardStopSpeech, onSpeakEnd]);

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

    // Another speak/stop happened while we waited
    if (token !== speakTokenRef.current) return;

    // Brief pause after cancel so Chrome accepts the next utterance
    await new Promise((r) => setTimeout(r, 80));
    if (token !== speakTokenRef.current) return;

    let finished = false;
    const finish = () => {
      if (finished || token !== speakTokenRef.current) return;
      finished = true;
      clearKeepAlive();
      speakingRef.current = false;
      onAudioLevel?.(0);
      onSpeakEnd?.();
      const cb = doneRef.current;
      doneRef.current = null;
      cb?.();
    };

    const utterance = new SpeechSynthesisUtterance(trimmed);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voice = getPreferredVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang || "en-US";
    } else {
      utterance.lang = "en-US";
    }

    const maxMs = Math.min(MAX_SPEAK_MS, Math.max(6000, trimmed.length * 90));
    const safety = setTimeout(finish, maxMs);

    utterance.onstart = () => {
      if (token !== speakTokenRef.current) return;
      speakingRef.current = true;
      onSpeakStart?.();
      onAudioLevel?.(0.45);

      // Chrome bug: speechSynthesis can freeze unless periodically resumed
      clearKeepAlive();
      keepAliveRef.current = setInterval(() => {
        if (token !== speakTokenRef.current) {
          clearKeepAlive();
          return;
        }
        const synth = synthRef.current;
        if (!synth) return;
        if (synth.paused) synth.resume();
        if (!synth.speaking && !synth.pending) {
          clearKeepAlive();
          finish();
        }
      }, 200);

      // Fake lip-sync amplitude while speaking
      levelTimerRef.current = setInterval(() => {
        if (!speakingRef.current) return;
        onAudioLevel?.(0.25 + Math.random() * 0.55);
      }, 120);
    };

    utterance.onend = () => {
      clearTimeout(safety);
      finish();
    };

    utterance.onerror = (event) => {
      clearTimeout(safety);
      // "interrupted" / "canceled" are expected when we stop or replace speech
      if (event?.error && event.error !== "interrupted" && event.error !== "canceled") {
        console.warn("[SpeechPipeline] TTS error:", event.error);
      }
      finish();
    };

    try {
      const synth = synthRef.current;
      synth.cancel();
      synth.resume();
      synth.speak(utterance);
      // Second resume helps some Chrome builds start audio
      setTimeout(() => {
        if (token === speakTokenRef.current) synth.resume();
      }, 30);
    } catch (err) {
      clearTimeout(safety);
      console.warn("[SpeechPipeline] speak failed:", err);
      onError?.("Could not play interviewer voice. Check speaker volume and try Chrome/Edge.");
      finish();
    }
  }, [
    clearKeepAlive,
    ensureUnlocked,
    getPreferredVoice,
    hardStopSpeech,
    onAudioLevel,
    onError,
    onSpeakEnd,
    onSpeakStart,
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
      if (speakingRef.current) {
        const latest = event.results[event.results.length - 1];
        const txt = latest?.[0]?.transcript?.trim() || "";
        if (latest?.isFinal && txt.split(/\s+/).length >= 2) {
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
        silenceTimerRef.current = setTimeout(() => stopListening(), 2200);
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

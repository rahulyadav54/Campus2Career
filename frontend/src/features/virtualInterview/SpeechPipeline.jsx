/**
 * SpeechPipeline — unified STT/TTS with interruption + lip-sync audio levels.
 * Browser speech synthesis is primary (most reliable in Chrome/Edge).
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import interviewService from "../../services/interviewService";
import { unlockAudioOutput } from "./mediaAccess";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const NEURAL_TTS_TIMEOUT_MS = 2500;
const MAX_SPEAK_MS = 45000;
const USE_NEURAL_TTS = import.meta.env.VITE_USE_NEURAL_TTS === "true";

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
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);
  const speechRequestRef = useRef(0);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const hadSpeechRef = useRef(false);
  const synthKeepAliveRef = useRef(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => synthRef.current.getVoices();
    loadVoices();
    synthRef.current.addEventListener("voiceschanged", loadVoices);
    return () => synthRef.current?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const stopSynthKeepAlive = useCallback(() => {
    if (synthKeepAliveRef.current) {
      clearInterval(synthKeepAliveRef.current);
      synthKeepAliveRef.current = null;
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
  }, []);

  const startAnalyser = useCallback((audio) => {
    stopAnalyser();
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        onAudioLevel?.(Math.min(1, avg / 80));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* analyser optional */
    }
  }, [onAudioLevel, stopAnalyser]);

  const getPreferredVoice = useCallback(() => {
    const voices = synthRef.current?.getVoices() || [];
    return voices.find((v) => v.lang === "en-IN" || v.lang === "en_IN")
      || voices.find((v) => v.lang.startsWith("en") && /natural|neural|google|microsoft|online/i.test(v.name))
      || voices.find((v) => v.lang.startsWith("en-GB"))
      || voices.find((v) => v.lang.startsWith("en-US"))
      || voices.find((v) => v.lang.startsWith("en"));
  }, []);

  const waitForVoices = useCallback(() => new Promise((resolve) => {
    if (!synthRef.current) return resolve([]);
    const pick = () => synthRef.current.getVoices() || [];
    const existing = pick();
    if (existing.length) return resolve(existing);
    const timer = setTimeout(() => resolve(pick()), 600);
    synthRef.current.onvoiceschanged = () => {
      clearTimeout(timer);
      resolve(pick());
    };
  }), []);

  const ensureAudioUnlocked = useCallback(async () => {
    if (!unlockedRef.current) {
      await unlockAudioOutput();
      unlockedRef.current = true;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    speechRequestRef.current += 1;
    stopSynthKeepAlive();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    synthRef.current?.cancel();
    speakingRef.current = false;
    stopAnalyser();
    onAudioLevel?.(0);
  }, [onAudioLevel, stopAnalyser, stopSynthKeepAlive]);

  const speakWithBrowser = useCallback(async (text, onDone, requestId) => {
    if (!text?.trim() || !synthRef.current) {
      onDone?.();
      return false;
    }

    await ensureAudioUnlocked();
    await waitForVoices();
    if (requestId !== speechRequestRef.current) return false;

    const synth = synthRef.current;
    synth.cancel();
    await new Promise((r) => setTimeout(r, 50));
    if (requestId !== speechRequestRef.current) return false;

    return new Promise((resolve) => {
      let finished = false;
      let started = false;

      const finish = () => {
        if (finished || requestId !== speechRequestRef.current) return;
        finished = true;
        stopSynthKeepAlive();
        speakingRef.current = false;
        stopAnalyser();
        onAudioLevel?.(0);
        onSpeakEnd?.();
        onDone?.();
        resolve(true);
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-US";
      }

      const maxMs = Math.min(MAX_SPEAK_MS, Math.max(5000, text.length * 80));
      const safety = setTimeout(finish, maxMs);
      const startWatch = setTimeout(() => {
        if (!started && !finished) {
          synth.cancel();
          clearTimeout(safety);
          finish();
        }
      }, 1200);

      utterance.onstart = () => {
        started = true;
        clearTimeout(startWatch);
        speakingRef.current = true;
        onSpeakStart?.();
        stopSynthKeepAlive();
        synthKeepAliveRef.current = setInterval(() => {
          if (!synth.speaking) {
            stopSynthKeepAlive();
            return;
          }
          if (synth.paused) synth.resume();
        }, 250);
      };
      utterance.onend = () => {
        clearTimeout(safety);
        clearTimeout(startWatch);
        finish();
      };
      utterance.onerror = () => {
        clearTimeout(safety);
        clearTimeout(startWatch);
        finish();
      };

      try {
        synth.resume();
        synth.speak(utterance);
        synth.resume();
      } catch {
        clearTimeout(safety);
        clearTimeout(startWatch);
        finish();
      }
    });
  }, [ensureAudioUnlocked, getPreferredVoice, onSpeakStart, onSpeakEnd, onAudioLevel, stopAnalyser, stopSynthKeepAlive, waitForVoices]);

  const speakWithNeural = useCallback(async (text, onDone, requestId) => {
    await ensureAudioUnlocked();
    const blob = await interviewService.synthesizeSpeech(text, NEURAL_TTS_TIMEOUT_MS);
    if (requestId !== speechRequestRef.current) return false;
    if (!blob || blob.size < 512) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.volume = 1;
    audioRef.current = audio;
    audioUrlRef.current = url;

    return new Promise((resolve) => {
      let finished = false;
      const finish = (ok) => {
        if (finished || requestId !== speechRequestRef.current) return;
        finished = true;
        if (!ok) {
          if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
          audioUrlRef.current = null;
          audioRef.current = null;
        }
        resolve(ok);
      };

      audio.onplay = () => {
        speakingRef.current = true;
        onSpeakStart?.();
        startAnalyser(audio);
      };
      audio.onended = () => {
        speakingRef.current = false;
        stopAnalyser();
        onAudioLevel?.(0);
        onSpeakEnd?.();
        onDone?.();
        finish(true);
      };
      audio.onerror = () => finish(false);

      audio.play().catch(() => finish(false));
    });
  }, [ensureAudioUnlocked, onSpeakStart, onSpeakEnd, onAudioLevel, startAnalyser, stopAnalyser]);

  const speak = useCallback(async (text, onDone) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      onDone?.();
      return;
    }

    const requestId = ++speechRequestRef.current;
    stopSpeaking();
    await ensureAudioUnlocked();

    if (USE_NEURAL_TTS) {
      let neuralOk = false;
      try {
        neuralOk = await speakWithNeural(trimmed, onDone, requestId);
      } catch {
        neuralOk = false;
      }
      if (requestId !== speechRequestRef.current) return;
      if (neuralOk) return;
    }

    await speakWithBrowser(trimmed, onDone, requestId);
  }, [ensureAudioUnlocked, speakWithBrowser, speakWithNeural, stopSpeaking]);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    listeningRef.current = false;
    if (hadSpeechRef.current) onSpeechEnded?.();
    hadSpeechRef.current = false;
  }, [onSpeechEnded]);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported. Please use Chrome or Edge.");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          onTranscript?.(finalTranscript.trim(), true);
          if (!hadSpeechRef.current) {
            hadSpeechRef.current = true;
            onSpeechStarted?.();
          }
        } else {
          interim += result[0].transcript;
          onTranscript?.((finalTranscript + interim).trim(), false);
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
    try { recognition.start(); } catch { /* ignore */ }
  }, [onTranscript, onListeningStart, onListeningEnd, onError, onBargeIn, onSpeechStarted, onSpeechPaused, stopListening, stopSpeaking]);

  useEffect(() => () => {
    clearTimeout(silenceTimerRef.current);
    stopSpeaking();
    stopListening();
    stopAnalyser();
  }, [stopSpeaking, stopListening, stopAnalyser]);

  useImperativeHandle(ref, () => ({
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    unlockAudio: ensureAudioUnlocked,
    isListening: () => listeningRef.current,
    isSpeaking: () => speakingRef.current,
    isSupported: () => !!SpeechRecognition,
  }), [speak, stopSpeaking, startListening, stopListening, ensureAudioUnlocked]);

  return null;
});

export default SpeechPipeline;

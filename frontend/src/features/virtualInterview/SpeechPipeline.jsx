/**
 * SpeechPipeline — unified STT/TTS with interruption + lip-sync audio levels.
 * Browser TTS is primary (reliable); neural TTS is optional with strict timeout.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import interviewService from "../../services/interviewService";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const NEURAL_TTS_TIMEOUT_MS = 3500;
const MAX_SPEAK_MS = 45000;

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
  const voicesReadyRef = useRef(false);

  useEffect(() => {
    if (!synthRef.current) return;
    const loadVoices = () => {
      voicesReadyRef.current = (synthRef.current.getVoices() || []).length > 0;
    };
    loadVoices();
    synthRef.current.addEventListener("voiceschanged", loadVoices);
    return () => synthRef.current?.removeEventListener("voiceschanged", loadVoices);
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
      onAudioLevel?.(0.35);
    }
  }, [onAudioLevel, stopAnalyser]);

  const getPreferredVoice = useCallback(() => {
    const voices = synthRef.current?.getVoices() || [];
    return voices.find((v) => v.lang === "en-IN" || v.lang === "en_IN")
      || voices.find((v) => v.lang.startsWith("en") && /natural|neural|google|microsoft/i.test(v.name))
      || voices.find((v) => v.lang.startsWith("en"));
  }, []);

  const waitForVoices = useCallback(() => new Promise((resolve) => {
    if (!synthRef.current) return resolve(null);
    const existing = synthRef.current.getVoices();
    if (existing.length) return resolve(existing);
    const timer = setTimeout(() => resolve(synthRef.current.getVoices()), 400);
    synthRef.current.onvoiceschanged = () => {
      clearTimeout(timer);
      resolve(synthRef.current.getVoices());
    };
  }), []);

  const stopSpeaking = useCallback(() => {
    speechRequestRef.current += 1;
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
  }, [onAudioLevel, stopAnalyser]);

  const speakWithBrowser = useCallback(async (text, onDone, requestId) => {
    if (!text?.trim() || !synthRef.current) {
      onDone?.();
      return false;
    }

    await waitForVoices();
    if (requestId !== speechRequestRef.current) return false;

    synthRef.current.cancel();

    return new Promise((resolve) => {
      let finished = false;
      const finish = () => {
        if (finished || requestId !== speechRequestRef.current) return;
        finished = true;
        speakingRef.current = false;
        stopAnalyser();
        onAudioLevel?.(0);
        onSpeakEnd?.();
        onDone?.();
        resolve(true);
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.94;
      utterance.pitch = 1;
      const voice = getPreferredVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-IN";
      }

      const maxMs = Math.min(MAX_SPEAK_MS, Math.max(4000, text.length * 70));
      const safety = setTimeout(finish, maxMs);

      utterance.onstart = () => {
        speakingRef.current = true;
        onSpeakStart?.();
        onAudioLevel?.(0.4);
      };
      utterance.onend = () => {
        clearTimeout(safety);
        finish();
      };
      utterance.onerror = () => {
        clearTimeout(safety);
        finish();
      };

      try {
        synthRef.current.speak(utterance);
        if (synthRef.current.paused) synthRef.current.resume();
      } catch {
        clearTimeout(safety);
        finish();
      }
    });
  }, [getPreferredVoice, onSpeakStart, onSpeakEnd, onAudioLevel, stopAnalyser, waitForVoices]);

  const speakWithNeural = useCallback(async (text, onDone, requestId) => {
    const blob = await interviewService.synthesizeSpeech(text, NEURAL_TTS_TIMEOUT_MS);
    if (requestId !== speechRequestRef.current) return false;

    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
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

      audio.play()
        .catch(() => finish(false));
    });
  }, [onSpeakStart, onSpeakEnd, onAudioLevel, startAnalyser, stopAnalyser]);

  const speak = useCallback(async (text, onDone) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
      onDone?.();
      return;
    }

    const requestId = ++speechRequestRef.current;
    stopSpeaking();

    let neuralOk = false;
    try {
      neuralOk = await speakWithNeural(trimmed, onDone, requestId);
    } catch {
      neuralOk = false;
    }

    if (requestId !== speechRequestRef.current) return;

    if (!neuralOk) {
      await speakWithBrowser(trimmed, onDone, requestId);
    }
  }, [speakWithBrowser, speakWithNeural, stopSpeaking]);

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
    isListening: () => listeningRef.current,
    isSpeaking: () => speakingRef.current,
    isSupported: () => !!SpeechRecognition,
  }), [speak, stopSpeaking, startListening, stopListening]);

  return null;
});

export default SpeechPipeline;

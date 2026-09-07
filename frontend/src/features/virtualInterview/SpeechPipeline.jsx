/**
 * SpeechPipeline — unified STT/TTS with interruption + lip-sync audio levels.
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";
import interviewService from "../../services/interviewService";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

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
  const synthRef = useRef(window.speechSynthesis);
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
      || voices.find((v) => v.lang.startsWith("en") && /natural|neural|google/i.test(v.name))
      || voices.find((v) => v.lang.startsWith("en"));
  }, []);

  const speakWithBrowser = useCallback((text, onDone) => {
    if (!text || !synthRef.current) { onDone?.(); return; }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    const voice = getPreferredVoice();
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang; }
    else utterance.lang = "en-IN";
    utterance.onstart = () => { speakingRef.current = true; onSpeakStart?.(); };
    utterance.onend = () => { speakingRef.current = false; onSpeakEnd?.(); onDone?.(); };
    utterance.onerror = () => { speakingRef.current = false; onSpeakEnd?.(); onDone?.(); };
    synthRef.current.speak(utterance);
  }, [getPreferredVoice, onSpeakStart, onSpeakEnd]);

  const stopSpeaking = useCallback(() => {
    speechRequestRef.current += 1;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (audioUrlRef.current) { URL.revokeObjectURL(audioUrlRef.current); audioUrlRef.current = null; }
    synthRef.current?.cancel();
    speakingRef.current = false;
    stopAnalyser();
    onAudioLevel?.(0);
  }, [onAudioLevel, stopAnalyser]);

  const speak = useCallback(async (text, onDone) => {
    if (!text) return;
    const requestId = ++speechRequestRef.current;
    stopSpeaking();

    try {
      const blob = await interviewService.synthesizeSpeech(text);
      if (requestId !== speechRequestRef.current) return;
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      audio.onplay = () => {
        speakingRef.current = true;
        onSpeakStart?.();
        startAnalyser(audio);
      };
      audio.onended = () => {
        if (requestId !== speechRequestRef.current) return;
        speakingRef.current = false;
        stopAnalyser();
        onAudioLevel?.(0);
        onSpeakEnd?.();
        onDone?.();
      };
      audio.onerror = () => {
        if (requestId !== speechRequestRef.current) return;
        speakWithBrowser(text, onDone);
      };
      await audio.play();
    } catch {
      if (requestId === speechRequestRef.current) speakWithBrowser(text, onDone);
    }
  }, [onSpeakStart, onSpeakEnd, onAudioLevel, speakWithBrowser, startAnalyser, stopSpeaking]);

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

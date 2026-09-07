/**
 * VoiceEngine.jsx
 *
 * A non-rendering React component that manages:
 *   - Browser STT (SpeechRecognition API)
 *   - Browser TTS (speechSynthesis API)
 *
 * Exposes imperative handles via ref so parent can call:
 *   voiceRef.current.speak(text)
 *   voiceRef.current.startListening()
 *   voiceRef.current.stopListening()
 */

import { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from "react";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const VoiceEngine = forwardRef(function VoiceEngine(
  {
    onTranscript,     // (text: string, isFinal: boolean) => void
    onListeningStart, // () => void
    onListeningEnd,   // () => void
    onSpeakStart,     // () => void
    onSpeakEnd,       // () => void
    onError,          // (msg: string) => void
  },
  ref
) {
  const recognitionRef = useRef(null);
  const synthRef       = useRef(window.speechSynthesis);
  const listeningRef   = useRef(false);
  const speakingRef    = useRef(false);
  const silenceTimerRef = useRef(null);

  // ── TTS ─────────────────────────────────────────────────────────────────────

  const speak = useCallback((text, onDone) => {
    if (!text || speakingRef.current) return;
    const synth = synthRef.current;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.95;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    // Prefer a natural-sounding English voice
    const voices = synth.getVoices();
    const preferred = voices.find(v =>
      v.lang.startsWith("en") && (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural"))
    ) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => {
      speakingRef.current = true;
      onSpeakStart?.();
    };
    utterance.onend = () => {
      speakingRef.current = false;
      onSpeakEnd?.();
      onDone?.();
    };
    utterance.onerror = (e) => {
      speakingRef.current = false;
      onSpeakEnd?.();
      // Interrupted is not an error
      if (e.error !== "interrupted") onError?.("TTS error: " + e.error);
      onDone?.();
    };

    synth.speak(utterance);
  }, [onSpeakStart, onSpeakEnd, onError]);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    speakingRef.current = false;
  }, []);

  // ── STT ─────────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (listeningRef.current) return;

    stopSpeaking();

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-US";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {
      listeningRef.current = true;
      onListeningStart?.();
    };

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
          onTranscript?.(finalTranscript.trim(), true);
        } else {
          interim += result[0].transcript;
          onTranscript?.((finalTranscript + interim).trim(), false);
        }
      }

      // Auto-end on 2s silence after content
      clearTimeout(silenceTimerRef.current);
      if (finalTranscript.trim().length > 5) {
        silenceTimerRef.current = setTimeout(() => {
          stopListening();
        }, 2000);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        onError?.("Microphone access denied. Please allow microphone access in your browser settings.");
      } else if (event.error === "no-speech") {
        // Soft — restart
      } else if (event.error !== "aborted") {
        onError?.("Speech recognition error: " + event.error);
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      onListeningEnd?.();
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onListeningStart, onListeningEnd, onTranscript, onError, stopSpeaking]);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    listeningRef.current = false;
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      clearTimeout(silenceTimerRef.current);
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  // ── Expose API ────────────────────────────────────────────────────────────────

  useImperativeHandle(ref, () => ({
    speak,
    stopSpeaking,
    startListening,
    stopListening,
    isListening:  () => listeningRef.current,
    isSpeaking:   () => speakingRef.current,
    isSupported:  () => !!SpeechRecognition,
  }), [speak, stopSpeaking, startListening, stopListening]);

  return null; // Non-rendering engine
});

export default VoiceEngine;

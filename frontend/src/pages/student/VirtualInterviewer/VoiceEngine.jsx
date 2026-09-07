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

  // Helper to select Indian English voice or fallback
  const getPreferredVoice = useCallback(() => {
    const synth = synthRef.current;
    if (!synth) return null;
    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    // 1. Indian English specific (en-IN or contains India/Indian/Hindi)
    const indianVoice = voices.find(v =>
      (v.lang === "en-IN" || v.lang === "en_IN" || v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("indian")) &&
      (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural"))
    ) || voices.find(v =>
      v.lang === "en-IN" || v.lang === "en_IN" || v.name.toLowerCase().includes("india") || v.name.toLowerCase().includes("indian") || v.name.toLowerCase().includes("hindi")
    );
    if (indianVoice) return indianVoice;

    // 2. High quality natural English voice fallback
    const naturalVoice = voices.find(v =>
      v.lang.startsWith("en") && (v.name.toLowerCase().includes("google") || v.name.toLowerCase().includes("natural") || v.name.toLowerCase().includes("neural"))
    );
    if (naturalVoice) return naturalVoice;

    // 3. General English fallback
    return voices.find(v => v.lang.startsWith("en")) || voices[0];
  }, []);

  // ── TTS ─────────────────────────────────────────────────────────────────────

  const speak = useCallback((text, onDone) => {
    if (!text) return;
    const synth = synthRef.current;
    if (!synth) { onDone?.(); return; }

    // Stop previous utterance
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate   = 0.98;
    utterance.pitch  = 1.0;
    utterance.volume = 1.0;

    const preferred = getPreferredVoice();
    if (preferred) {
      utterance.voice = preferred;
      utterance.lang  = preferred.lang || "en-IN";
    } else {
      utterance.lang  = "en-IN";
    }

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
      if (e.error !== "interrupted") onError?.("TTS error: " + e.error);
      onDone?.();
    };

    synth.speak(utterance);
  }, [getPreferredVoice, onSpeakStart, onSpeakEnd, onError]);

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    speakingRef.current = false;
  }, []);

  // ── STT ─────────────────────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      onError?.("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (listeningRef.current) return;

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = "en-IN";
    recognition.maxAlternatives = 1;

    let finalTranscript = "";

    recognition.onstart = () => {
      listeningRef.current = true;
      onListeningStart?.();
    };

    recognition.onresult = (event) => {
      // ChatGPT Voice Mode Interruption: If user starts speaking while AI is talking, stop AI speech!
      if (speakingRef.current) {
        stopSpeaking();
        onSpeakEnd?.();
      }

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

      // Auto-end on 2s silence after speech content
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
        // Soft error
      } else if (event.error !== "aborted") {
        onError?.("Speech recognition error: " + event.error);
      }
    };

    recognition.onend = () => {
      listeningRef.current = false;
      onListeningEnd?.();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch { /* ignore if already started */ }
  }, [onListeningStart, onListeningEnd, onTranscript, onError, stopSpeaking, onSpeakEnd]);

  const stopListening = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    listeningRef.current = false;
  }, []);

  // ── Cleanup on unmount ───────────────────────────────────────────────────────

  useEffect(() => {
    const synth = synthRef.current;
    if (synth && synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = () => {
        synth.getVoices();
      };
    }
    return () => {
      clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
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

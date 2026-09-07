/**
 * PreInterviewFlow — camera/mic checks + welcome before live interview.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, CheckCircle, AlertCircle, ChevronRight, RefreshCw } from "lucide-react";
import {
  attachStreamToVideo,
  getMediaErrorMessage,
  isMediaSupported,
  requestInterviewMedia,
  stopMediaStream,
} from "./mediaAccess";

export default function PreInterviewFlow({ candidateName, targetRole, sessionReady = true, onComplete }) {
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const stopMicMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setMicLevel(0);
  }, []);

  const startMicMeter = useCallback((stream) => {
    stopMicMeter();
    const audioTrack = stream?.getAudioTracks?.()[0];
    if (!audioTrack) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
        setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      /* optional meter */
    }
  }, [stopMicMeter]);

  const initMedia = useCallback(async () => {
    setLoading(true);
    setError("");
    setCameraOk(false);
    setMicOk(false);
    stopMicMeter();
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    try {
      const { stream, hasVideo, hasAudio } = await requestInterviewMedia();
      streamRef.current = stream;
      setCameraOk(hasVideo);
      setMicOk(hasAudio);

      if (hasAudio) startMicMeter(stream);
      if (videoRef.current) attachStreamToVideo(videoRef.current, hasVideo ? stream : null);
    } catch (err) {
      setError(getMediaErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [startMicMeter, stopMicMeter]);

  useEffect(() => {
    initMedia();
    return () => {
      stopMicMeter();
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    };
  }, [initMedia, stopMicMeter]);

  useEffect(() => {
    if (cameraOk && streamRef.current && videoRef.current) {
      attachStreamToVideo(videoRef.current, streamRef.current);
    }
  }, [cameraOk, loading]);

  const canContinue = micOk && sessionReady;
  const steps = [
    { id: "camera", label: "Camera check", icon: Camera, ok: cameraOk, hint: cameraOk ? "Ready" : loading ? "Checking…" : "Optional" },
    { id: "audio", label: "Microphone check", icon: Mic, ok: micOk, hint: micOk ? "Ready" : "Required" },
    { id: "ready", label: "Ready to begin", icon: CheckCircle, ok: canContinue, hint: canContinue ? "Ready" : "Waiting for mic" },
  ];

  const handleEnter = () => {
    stopMicMeter();
    const stream = streamRef.current;
    streamRef.current = null;
    onComplete?.(stream);
  };

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Virtual interview</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Prepare for your session</h1>
          <p className="text-gray-500 text-sm mt-2">
            {targetRole} interview{candidateName ? ` · ${candidateName}` : ""}
          </p>
        </header>

        <div className="grid sm:grid-cols-3 gap-3">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 text-center ${
                  s.ok ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${s.ok ? "text-green-600" : "text-gray-400"}`} />
                <p className="text-sm font-medium text-gray-800">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" /> Camera preview
            </p>
            <button
              type="button"
              onClick={initMedia}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Retry access
            </button>
          </div>

          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: "scaleX(-1)" }}
            />
            {!cameraOk && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm px-6 text-center gap-2">
                <Camera className="w-8 h-8 opacity-50" />
                {loading ? "Requesting camera access…" : "Camera preview unavailable"}
                {micOk && !cameraOk && (
                  <span className="text-xs text-gray-500">Microphone is ready — you can still continue.</span>
                )}
              </div>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" /> Microphone level
              </span>
              <span>{micOk ? (micLevel > 8 ? "Receiving audio" : "Speak to test") : "No input"}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${micOk ? "bg-emerald-500" : "bg-gray-300"}`}
                style={{ width: `${micOk ? Math.max(6, micLevel) : 0}%` }}
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p>{error}</p>
                {!isMediaSupported() && (
                  <p className="mt-1 text-xs text-red-600">Use Chrome or Edge on localhost or HTTPS.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
          <p>Allow camera and microphone when your browser prompts you. If you don't see a prompt, use Retry access or check site permissions in the address bar.</p>
          <p className="mt-2 text-gray-500">The interviewer uses your microphone for speech recognition. Camera is optional but recommended.</p>
        </div>

        <button
          type="button"
          disabled={!canContinue || loading}
          onClick={handleEnter}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
        >
          {!sessionReady ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Preparing session…
            </>
          ) : (
            <>
              Enter interview room <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

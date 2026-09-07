/**
 * PreInterviewFlow — camera/mic checks before live interview (user-gesture first).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Mic, CheckCircle, AlertCircle, ChevronRight, RefreshCw, Video } from "lucide-react";
import { isMediaSupported, unlockAudioOutput } from "./mediaAccess";
import { useVideoBinding } from "./useCandidateMedia";

export default function PreInterviewFlow({
  candidateName,
  targetRole,
  sessionReady = true,
  media,
  onComplete,
}) {
  const videoRef = useRef(null);
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const {
    stream,
    cameraOk,
    micOk,
    loading,
    error,
    permissionRequested,
    requestAll,
    requestCameraOnly,
  } = media;

  useVideoBinding(videoRef, stream);

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

  const startMicMeter = useCallback((mediaStream) => {
    stopMicMeter();
    const audioTrack = mediaStream?.getAudioTracks?.()[0];
    if (!audioTrack) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaStreamSource(mediaStream);
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
      /* optional */
    }
  }, [stopMicMeter]);

  useEffect(() => {
    if (micOk && stream) startMicMeter(stream);
    else stopMicMeter();
  }, [micOk, stream, startMicMeter, stopMicMeter]);

  const canContinue = micOk && sessionReady;

  const handleEnable = async () => {
    try {
      await requestAll();
    } catch {
      /* error shown in UI */
    }
  };

  const handleEnter = async () => {
    stopMicMeter();
    await unlockAudioOutput();
    onComplete?.();
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

        {!permissionRequested ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mx-auto">
              <Video className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Enable camera & microphone</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Click below — your browser will ask for permission. This is required for the interview room.
            </p>
            {!isMediaSupported() && (
              <p className="text-sm text-red-600">Use Chrome or Edge on HTTPS or localhost.</p>
            )}
            <button
              type="button"
              onClick={handleEnable}
              disabled={loading || !isMediaSupported()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6 py-3 text-white font-semibold disabled:opacity-50"
            >
              <Camera className="w-5 h-5" />
              Allow camera & microphone
            </button>
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { label: "Camera check", icon: Camera, ok: cameraOk, hint: cameraOk ? "Ready" : "Click turn on below" },
                { label: "Microphone check", icon: Mic, ok: micOk, hint: micOk ? "Ready" : "Required" },
                { label: "Ready to begin", icon: CheckCircle, ok: canContinue, hint: canContinue ? "Ready" : "Waiting" },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className={`rounded-xl border p-4 text-center ${s.ok ? "border-green-200 bg-green-50" : "border-gray-200 bg-white"}`}>
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
                <div className="flex gap-2">
                  {!cameraOk && (
                    <button type="button" onClick={() => requestCameraOnly().catch(() => {})} disabled={loading} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50">
                      Turn on camera
                    </button>
                  )}
                  <button type="button" onClick={handleEnable} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                    Retry
                  </button>
                </div>
              </div>

              <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
                <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0" style={{ transform: "scaleX(-1)" }} />
                {!cameraOk && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-400 text-sm px-6 text-center gap-2 bg-gray-900/80">
                    <Camera className="w-8 h-8 opacity-50" />
                    {loading ? "Opening camera…" : "Camera not active"}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                  <span className="flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Microphone level</span>
                  <span>{micOk ? (micLevel > 8 ? "Receiving audio" : "Speak to test") : "No input"}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full transition-all ${micOk ? "bg-emerald-500" : "bg-gray-300"}`} style={{ width: `${micOk ? Math.max(6, micLevel) : 0}%` }} />
                </div>
              </div>

              {error && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </>
        )}

        {permissionRequested && (
          <button
            type="button"
            disabled={!canContinue || loading}
            onClick={handleEnter}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
          >
            {!sessionReady ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Preparing session…</>
            ) : (
              <>Enter interview room <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

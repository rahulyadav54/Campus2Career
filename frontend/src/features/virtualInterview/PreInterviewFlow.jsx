/**
 * PreInterviewFlow — camera/mic checks + welcome before live interview.
 */

import { useEffect, useRef, useState } from "react";
import { Camera, Mic, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";

export default function PreInterviewFlow({ candidateName, targetRole, onComplete }) {
  const [step, setStep] = useState("camera");
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setCameraOk(true);
        setMicOk(true);
        setError("");
      } catch (err) {
        setError(err.name === "NotAllowedError"
          ? "Camera or microphone permission was denied. Please allow access to continue."
          : "Could not access camera or microphone.");
      }
    };
    init();
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const steps = [
    { id: "camera", label: "Camera check", icon: Camera, ok: cameraOk },
    { id: "audio", label: "Microphone check", icon: Mic, ok: micOk },
    { id: "ready", label: "Ready to begin", icon: CheckCircle, ok: cameraOk && micOk },
  ];

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
                <p className="text-xs text-gray-500 mt-1">{s.ok ? "Ready" : "Checking…"}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4 text-indigo-600" /> Camera preview
          </p>
          <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden relative">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
            {!cameraOk && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                Waiting for camera…
              </div>
            )}
          </div>
          {error && (
            <div className="mt-3 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-gray-700 leading-relaxed">
          <p>You'll join a live-style video interview. Speak naturally — you can pause, clarify, or interrupt if needed.</p>
          <p className="mt-2 text-gray-500">The interviewer will ask follow-up questions based on your answers, not a fixed script.</p>
        </div>

        <button
          type="button"
          disabled={!cameraOk || !micOk}
          onClick={() => {
            streamRef.current?.getTracks().forEach((t) => t.stop());
            onComplete?.();
          }}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold transition"
        >
          Enter interview room <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

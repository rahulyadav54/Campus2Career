/**
 * CandidateVideo — displays the shared candidate camera stream.
 */

import { useRef } from "react";
import { Camera, RefreshCw } from "lucide-react";
import { useVideoBinding } from "./useCandidateMedia";

export default function CandidateVideo({
  stream,
  cameraOk = false,
  loading = false,
  error = "",
  onEnableCamera,
  className = "",
  minHeight = "280px",
}) {
  const videoRef = useRef(null);
  useVideoBinding(videoRef, stream);

  const showVideo = cameraOk && stream;

  return (
    <div className={`relative bg-gray-900 overflow-hidden ${className}`} style={{ minHeight }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${showVideo ? "opacity-100 z-0" : "opacity-0"}`}
        style={{ transform: "scaleX(-1)" }}
      />
      {!showVideo && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-gray-400 text-sm gap-3 px-4 text-center">
          <Camera className="w-10 h-10 opacity-40" />
          <span>{error || "Camera is off or blocked"}</span>
          <button
            type="button"
            onClick={onEnableCamera}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Turn on camera
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * CandidateVideo — keeps video element mounted and binds stream reliably.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, RefreshCw } from "lucide-react";
import {
  attachStreamToVideo,
  hasLiveVideo,
  mergeMediaStreams,
  requestCameraStream,
  stopMediaStream,
} from "./mediaAccess";

export default function CandidateVideo({
  mediaStream,
  className = "",
  minHeight = "280px",
  onStreamChange,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(mediaStream || null);
  const ownedVideoRef = useRef(null);
  const [cameraLive, setCameraLive] = useState(hasLiveVideo(mediaStream));
  const [retrying, setRetrying] = useState(false);

  const bindVideo = useCallback((stream) => {
    streamRef.current = stream;
    setCameraLive(hasLiveVideo(stream));
    if (videoRef.current) attachStreamToVideo(videoRef.current, stream);
    onStreamChange?.(stream);
  }, [onStreamChange]);

  useEffect(() => {
    let stream = mediaStream || null;

    const ensureVideo = async () => {
      if (hasLiveVideo(stream)) {
        bindVideo(stream);
        return;
      }

      setRetrying(true);
      try {
        const videoStream = await requestCameraStream();
        ownedVideoRef.current = videoStream;
        stream = mergeMediaStreams(stream, videoStream);
        bindVideo(stream);
      } catch {
        bindVideo(stream);
      } finally {
        setRetrying(false);
      }
    };

    ensureVideo();

    return () => {
      if (ownedVideoRef.current) {
        stopMediaStream(ownedVideoRef.current);
        ownedVideoRef.current = null;
      }
    };
  }, [mediaStream, bindVideo]);

  const retryCamera = async () => {
    setRetrying(true);
    try {
      if (ownedVideoRef.current) stopMediaStream(ownedVideoRef.current);
      const videoStream = await requestCameraStream();
      ownedVideoRef.current = videoStream;
      const merged = mergeMediaStreams(streamRef.current, videoStream);
      bindVideo(merged);
    } catch {
      setCameraLive(false);
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className={`relative bg-gray-900 overflow-hidden ${className}`} style={{ minHeight }}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover ${cameraLive ? "opacity-100" : "opacity-0"}`}
        style={{ transform: "scaleX(-1)" }}
      />
      {!cameraLive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-sm gap-3 px-4 text-center">
          <Camera className="w-10 h-10 opacity-40" />
          <span>Camera is off or blocked</span>
          <button
            type="button"
            onClick={retryCamera}
            disabled={retrying}
            className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-xs text-white border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retrying ? "animate-spin" : ""}`} />
            Turn on camera
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * useCandidateMedia — single shared camera/mic stream for the interview session.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachStreamToVideo,
  getMediaErrorMessage,
  hasLiveVideo,
  requestCameraStream,
  requestInterviewMedia,
  stopMediaStream,
} from "./mediaAccess";

export function useCandidateMedia() {
  const streamRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraOk, setCameraOk] = useState(false);
  const [micOk, setMicOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [permissionRequested, setPermissionRequested] = useState(false);

  const applyStream = useCallback((nextStream, hasVideo, hasAudio) => {
    stopMediaStream(streamRef.current);
    streamRef.current = nextStream;
    setStream(nextStream);
    setCameraOk(Boolean(hasVideo));
    setMicOk(Boolean(hasAudio));
  }, []);

  /** Must be called from a user click (button) for reliable browser permissions. */
  const requestAll = useCallback(async () => {
    setLoading(true);
    setError("");
    setPermissionRequested(true);
    try {
      const result = await requestInterviewMedia();
      applyStream(result.stream, result.hasVideo, result.hasAudio);
      return result;
    } catch (err) {
      setError(getMediaErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyStream]);

  const requestCameraOnly = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const videoStream = await requestCameraStream();
      const audioTracks = streamRef.current?.getAudioTracks?.() || [];
      const merged = new MediaStream([
        ...videoStream.getVideoTracks(),
        ...audioTracks,
      ]);
      applyStream(merged, true, audioTracks.length > 0 || micOk);
      return merged;
    } catch (err) {
      setError(getMediaErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [applyStream, micOk]);

  const release = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setCameraOk(false);
    setMicOk(false);
    setPermissionRequested(false);
    setError("");
  }, []);

  return {
    stream,
    streamRef,
    cameraOk,
    micOk,
    loading,
    error,
    permissionRequested,
    requestAll,
    requestCameraOnly,
    release,
    hasLiveVideo: hasLiveVideo(stream),
  };
}

/**
 * Binds a MediaStream to a video element whenever either is ready.
 */
export function useVideoBinding(videoRef, stream) {
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasLiveVideo(stream)) return;

    attachStreamToVideo(video, stream);

    const track = stream.getVideoTracks()[0];
    const onEnded = () => attachStreamToVideo(video, stream);
    track?.addEventListener("ended", onEnded);

    return () => track?.removeEventListener("ended", onEnded);
  }, [videoRef, stream]);
}

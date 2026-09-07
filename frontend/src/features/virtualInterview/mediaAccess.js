const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isMediaSupported() {
  return Boolean(
    typeof window !== "undefined"
    && window.isSecureContext
    && navigator.mediaDevices?.getUserMedia
  );
}

export function getMediaErrorMessage(error) {
  const name = error?.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Camera or microphone permission was denied. Click the lock icon in your browser address bar and allow Camera + Microphone, then retry.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera or microphone was found on this device.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Your camera or microphone is in use by another app. Close other video apps (Zoom, Teams, etc.) and retry.";
  }
  if (name === "OverconstrainedError") {
    return "Could not start the camera with the requested settings. Try retry or use a different browser.";
  }
  if (!isMediaSupported()) {
    return "Camera and microphone require HTTPS or localhost in Chrome/Edge.";
  }
  return error?.message || "Could not access camera or microphone.";
}

export function mergeMediaStreams(...streams) {
  const merged = new MediaStream();
  const seen = new Set();
  streams.filter(Boolean).forEach((stream) => {
    stream.getTracks().forEach((track) => {
      const key = `${track.kind}:${track.label}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.addTrack(track);
      }
    });
  });
  return merged;
}

export async function requestCameraStream() {
  if (!isMediaSupported()) {
    throw Object.assign(new Error("Media not supported"), { name: "NotSupportedError" });
  }

  const attempts = [
    { video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: "user" }, audio: false },
    { video: true, audio: false },
  ];

  let lastError = null;
  for (let round = 0; round < 2; round += 1) {
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (stream.getVideoTracks().length > 0) return stream;
        stream.getTracks().forEach((t) => t.stop());
      } catch (error) {
        lastError = error;
        if (error?.name === "NotReadableError") await sleep(300);
      }
    }
    await sleep(200);
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoInput = devices.find((d) => d.kind === "videoinput" && d.deviceId);
    if (videoInput?.deviceId) {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: videoInput.deviceId } },
        audio: false,
      });
      if (stream.getVideoTracks().length > 0) return stream;
      stream.getTracks().forEach((t) => t.stop());
    }
  } catch (error) {
    lastError = error;
  }

  throw lastError || new Error("Could not access camera");
}

export async function requestMicrophoneStream() {
  if (!isMediaSupported()) {
    throw Object.assign(new Error("Media not supported"), { name: "NotSupportedError" });
  }

  const attempts = [
    { audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, video: false },
    { audio: true, video: false },
  ];

  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (stream.getAudioTracks().length > 0) return stream;
      stream.getTracks().forEach((t) => t.stop());
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Could not access microphone");
}

/**
 * Request camera + microphone separately, then merge — works on more Windows setups.
 */
export async function requestInterviewMedia() {
  let videoStream = null;
  let audioStream = null;
  let lastError = null;

  try {
    videoStream = await requestCameraStream();
  } catch (error) {
    lastError = error;
  }

  try {
    audioStream = await requestMicrophoneStream();
  } catch (error) {
    lastError = error;
  }

  const stream = mergeMediaStreams(videoStream, audioStream);
  const hasVideo = stream.getVideoTracks().length > 0;
  const hasAudio = stream.getAudioTracks().length > 0;

  if (!hasVideo && !hasAudio) {
    throw lastError || new Error("Could not access camera or microphone");
  }

  return { stream, hasVideo, hasAudio };
}

export function attachStreamToVideo(videoEl, stream) {
  if (!videoEl || !stream?.getVideoTracks?.().length) return;

  if (videoEl.srcObject !== stream) {
    videoEl.srcObject = stream;
  }

  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.autoplay = true;

  const play = () => {
    const promise = videoEl.play();
    if (promise?.catch) promise.catch(() => {});
  };

  if (videoEl.readyState >= 2) {
    play();
  } else {
    videoEl.onloadedmetadata = play;
    play();
  }
}

export function stopMediaStream(stream) {
  stream?.getTracks?.().forEach((track) => {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  });
}

export function hasLiveVideo(stream) {
  const track = stream?.getVideoTracks?.()?.[0];
  return Boolean(track && track.readyState === "live" && track.enabled);
}

/** Unlock speaker output after a user click (required by Chrome autoplay rules). */
export async function unlockAudioOutput() {
  if (typeof window === "undefined") return;

  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    await new Promise((r) => setTimeout(r, 10));
    await ctx.close();
  } catch {
    /* ignore */
  }

  try {
    const probe = new Audio();
    probe.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
    probe.volume = 0.01;
    await probe.play();
    probe.pause();
  } catch {
    /* ignore */
  }

  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  }
}

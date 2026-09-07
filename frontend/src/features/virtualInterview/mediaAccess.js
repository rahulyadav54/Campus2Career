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
    return "Camera or microphone permission was denied. Click the lock icon in your browser address bar and allow access, then retry.";
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
    return "Camera and microphone require a secure connection (HTTPS or localhost) and a supported browser like Chrome or Edge.";
  }
  return error?.message || "Could not access camera or microphone.";
}

/**
 * Try several constraint sets — many Windows setups fail when audio+video are requested together.
 */
export async function requestInterviewMedia() {
  if (!isMediaSupported()) {
    throw Object.assign(new Error("Media not supported"), { name: "NotSupportedError" });
  }

  const attempts = [
    {
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    },
    { video: true, audio: true },
    { video: { facingMode: "user" }, audio: true },
    { video: true, audio: false },
    { video: false, audio: true },
  ];

  let lastError = null;

  for (let round = 0; round < 2; round += 1) {
    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const hasVideo = stream.getVideoTracks().length > 0;
        const hasAudio = stream.getAudioTracks().length > 0;
        if (!hasVideo && !hasAudio) {
          stream.getTracks().forEach((t) => t.stop());
          continue;
        }
        return { stream, hasVideo, hasAudio };
      } catch (error) {
        lastError = error;
        if (error?.name === "NotReadableError" || error?.name === "AbortError") {
          await sleep(350);
        }
      }
    }
    await sleep(250);
  }

  throw lastError || new Error("Could not access camera or microphone");
}

export function attachStreamToVideo(videoEl, stream) {
  if (!videoEl || !stream) return;
  videoEl.srcObject = stream;
  const playPromise = videoEl.play();
  if (playPromise?.catch) {
    playPromise.catch(() => {});
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

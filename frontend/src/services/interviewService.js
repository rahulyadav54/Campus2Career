/**
 * interviewService.js
 * Frontend API client for the AI Virtual Interviewer.
 * All calls go through the existing apiClient (handles JWT auth automatically).
 */

import { apiClient } from "./apiClient";
import { API_URL } from "../config/api";

const BASE = "/api/interviews";

/** apiClient returns parsed JSON directly — not an axios-style { data } wrapper. */
export const unwrapInterviewResponse = (res) => {
  if (!res || typeof res !== "object") return res;
  if (res.data !== undefined && res.success === undefined && res.sessionId === undefined) {
    return res.data;
  }
  return res;
};

export const interviewService = {
  /** Start a new interview session */
  start: (config) =>
    apiClient.post(`${BASE}/start`, config, { timeout: 12000 }),

  /** Submit an answer and get the next action */
  submitAnswer: (sessionId, payload) =>
    apiClient.post(`${BASE}/${sessionId}/answer`, payload, { timeout: 60000 }),

  /** Confirm candidate is ready to begin */
  confirmReady: (sessionId) =>
    apiClient.post(`${BASE}/${sessionId}/answer`, { confirmReady: true }, { timeout: 30000 }),

  /** End the interview and generate the final report */
  end: (sessionId) =>
    apiClient.post(`${BASE}/${sessionId}/end`, {}, { timeout: 90000 }),

  /** Generate natural neural speech — returns audio Blob (falls back quickly) */
  synthesizeSpeech: async (text, timeoutMs = 4000) => {
    const token = localStorage.getItem("token");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${API_URL}${BASE}/tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text: String(text).slice(0, 1200) }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Neural speech unavailable");
      return res.blob();
    } finally {
      clearTimeout(timer);
    }
  },

  /** Get session state (for recovery) */
  getSession: (sessionId) =>
    apiClient.get(`${BASE}/${sessionId}`),

  /** Get the final report for a completed session */
  getReport: (sessionId) =>
    apiClient.get(`${BASE}/${sessionId}/report`),

  /** Get student's interview history */
  getHistory: () =>
    apiClient.get(`${BASE}/history`),

  /** Get HeyGen avatar streaming token (proxied through backend) */
  getAvatarToken: () =>
    apiClient.post(`${BASE}/avatar/token`, {}),

  /** D-ID Streaming Avatar helpers */
  createDIDStream: (presenterUrl) =>
    apiClient.post(`${BASE}/did/stream`, { presenterUrl }),

  sendDIDSDP: (streamId, answer, sessionId) =>
    apiClient.post(`${BASE}/did/sdp`, { streamId, answer, sessionId }),

  sendDIDICE: (streamId, candidate, sdpMid, sdpMLineIndex, sessionId) =>
    apiClient.post(`${BASE}/did/ice`, { streamId, candidate, sdpMid, sdpMLineIndex, sessionId }),

  speakDIDStream: (streamId, text, sessionId, voiceId) =>
    apiClient.post(`${BASE}/did/speak`, { streamId, text, sessionId, voiceId }),

  closeDIDStream: (streamId, sessionId) =>
    apiClient.delete(`${BASE}/did/stream/${streamId}`, { data: { sessionId } }),
};

export default interviewService;

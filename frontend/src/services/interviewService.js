/**
 * interviewService.js
 * Frontend API client for the AI Virtual Interviewer.
 * All calls go through the existing apiClient (handles JWT auth automatically).
 */

import { apiClient } from "./apiClient";

const BASE = "/api/interviews";

export const interviewService = {
  /** Start a new interview session */
  start: (config) =>
    apiClient.post(`${BASE}/start`, config, { timeout: 30000 }),

  /** Submit an answer and get the next action */
  submitAnswer: (sessionId, payload) =>
    apiClient.post(`${BASE}/${sessionId}/answer`, payload, { timeout: 30000 }),

  /** End the interview and generate the final report */
  end: (sessionId) =>
    apiClient.post(`${BASE}/${sessionId}/end`, {}, { timeout: 30000 }),

  /** Generate natural neural speech for the interviewer */
  synthesizeSpeech: (text) =>
    apiClient.post(`${BASE}/tts`, { text }, { responseType: "blob", timeout: 30000 }),

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

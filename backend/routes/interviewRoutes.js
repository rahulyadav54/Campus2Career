import express from "express";
import rateLimit from "express-rate-limit";
import { protect, studentOnly } from "../middleware/authMiddleware.js";
import {
  startInterview,
  submitAnswer,
  endInterview,
  getSession,
  getReport,
  getHistory,
  getAvatarToken,
  createDIDStream,
  sendDIDSDP,
  sendDIDICE,
  speakDIDStream,
  closeDIDStream,
} from "../controllers/interviewController.js";

const router = express.Router();

// Rate limiter for expensive AI endpoints
const aiLimiter = rateLimit({
  windowMs:       60 * 1000,   // 1 minute
  max:            15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { message: "Too many interview requests — please wait a moment" },
});

// All routes require authentication + student role
router.use(protect, studentOnly);

// History & avatar token (no heavy AI — no aiLimiter needed)
router.get("/history",                  getHistory);
router.post("/avatar/token",            getAvatarToken);

// D-ID Streaming Avatar routes
router.post("/did/stream",              createDIDStream);
router.post("/did/sdp",                 sendDIDSDP);
router.post("/did/ice",                 sendDIDICE);
router.post("/did/speak",               speakDIDStream);
router.delete("/did/stream/:streamId",  closeDIDStream);

// Session lifecycle
router.post("/start",                   aiLimiter, startInterview);
router.post("/:sessionId/answer",       aiLimiter, submitAnswer);
router.post("/:sessionId/end",          aiLimiter, endInterview);

// Session retrieval
router.get("/:sessionId",               getSession);
router.get("/:sessionId/report",        getReport);

export default router;

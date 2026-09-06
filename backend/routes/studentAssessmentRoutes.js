import express from "express";
import { protect, studentOnly } from "../middleware/authMiddleware.js";
import {
  getMyAssessments,
  startAssessment,
  saveAnswer,
  submitAttempt,
  getAttempt,
  logIntegrityEvent,
  getMyResults,
} from "../controllers/assessmentCandidateController.js";

const router = express.Router();
router.use(protect, studentOnly);

router.get("/me", getMyAssessments);
router.post("/:id/start", startAssessment);
router.post("/attempts/:attemptId/save", saveAnswer);
router.post("/attempts/:attemptId/submit", submitAttempt);
router.get("/attempts/:attemptId", getAttempt);
router.post("/attempts/:attemptId/integrity-events", logIntegrityEvent);
router.get("/results", getMyResults);

export default router;

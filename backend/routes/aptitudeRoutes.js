import express from "express";
import { protect, studentOnly, adminOnly } from "../middleware/authMiddleware.js";
import {
  createTest,
  publishTest,
  listTests,
  getTestById,
  startAttempt,
  submitAttempt,
  getMyAttempts,
  getAttemptResult
} from "../controllers/aptitudeController.js";

const router = express.Router();

// Admin: test management
router.post("/admin/create-test", protect, adminOnly, createTest);
router.put("/admin/:id/publish", protect, adminOnly, publishTest);

// Student + Admin: browse tests
router.get("/tests", protect, listTests);
router.get("/tests/:id", protect, getTestById);

// Student: attempts
router.post("/tests/:id/start", protect, studentOnly, startAttempt);
router.post("/tests/:id/submit", protect, studentOnly, submitAttempt);
router.get("/my-attempts", protect, studentOnly, getMyAttempts);
router.get("/results/:attemptId", protect, getAttemptResult);

export default router;
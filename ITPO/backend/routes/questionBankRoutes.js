import express from "express";
import { protect, adminOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  createQuestion, listQuestions, updateQuestion, deleteQuestion,
  createTemplate, listTemplates, startAttempt, submitAttempt, getAttemptHistory
} from "../controllers/questionBankController.js";

const router = express.Router();
router.use(protect);

// Admin: question bank management
router.post("/questions", adminOnly, createQuestion);
router.get("/questions", adminOnly, listQuestions);
router.put("/questions/:id", adminOnly, updateQuestion);
router.delete("/questions/:id", adminOnly, deleteQuestion);

// Admin: assessment templates
router.post("/templates", adminOnly, createTemplate);
router.get("/templates", listTemplates);

// Student: timed attempts
router.post("/templates/:templateId/start", studentOnly, startAttempt);
router.post("/attempts/:attemptId/submit", studentOnly, submitAttempt);
router.get("/attempts/history", studentOnly, getAttemptHistory);

export default router;

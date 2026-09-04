import express from "express";
import { getCareerAdvice, parseResumeAI, calculateReadinessScore } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// AI Career Advisor chatbot endpoint (public - no auth required for demo)
router.post("/career-advisor", getCareerAdvice);

// AI Resume Parser endpoint
router.post("/parse-resume", protect, parseResumeAI);

// Predictive Placement Readiness Score endpoint
router.get("/readiness-score", protect, calculateReadinessScore);
router.get("/readiness-score/:studentId", protect, calculateReadinessScore);

export default router;

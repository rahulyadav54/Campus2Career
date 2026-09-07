import express from "express";
import { protect, studentOnly } from "../middleware/authMiddleware.js";
import { getSkillGapAnalysis, getSkillGapAnalysisForStudent } from "../controllers/skillGapController.js";

const router = express.Router();

router.get("/analysis", protect, studentOnly, getSkillGapAnalysis);
router.get("/analysis/:studentId", protect, getSkillGapAnalysisForStudent);

export default router;

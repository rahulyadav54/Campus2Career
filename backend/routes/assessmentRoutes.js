import express from "express";
import { protect, studentOnly } from "../middleware/authMiddleware.js";
import { getMyAssessments, submitAssessment } from "../controllers/assessmentController.js";

const router = express.Router();
router.use(protect, studentOnly);
router.post("/", submitAssessment);
router.get("/me", getMyAssessments);

export default router;
import express from "express";
import { getCareerAdvice, parseResumeAI, calculateReadinessScore, importResumeFromFile } from "../controllers/aiController.js";
import { protect, studentOnly } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const aiStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resumes/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const aiUpload = multer({
  storage: aiStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
  }
});

// AI Career Advisor chatbot endpoint (public - no auth required for demo)
router.post("/career-advisor", getCareerAdvice);

// AI Resume Parser endpoint
router.post("/parse-resume", protect, parseResumeAI);

// ATS Resume Import endpoint - parses resume and auto-updates student profile
router.post("/import-resume", protect, studentOnly, aiUpload.single("resume"), importResumeFromFile);

// Predictive Placement Readiness Score endpoint
router.get("/readiness-score", protect, calculateReadinessScore);
router.get("/readiness-score/:studentId", protect, calculateReadinessScore);

export default router;

import express from "express";
import multer from "multer";
import path from "path";
import {
  listTemplates,
  listResumes,
  getCareerDashboard,
  createResume,
  getResume,
  updateResume,
  deleteResume,
  duplicateResume,
  uploadResume,
  analyzeResume,
  improveResumeSection,
  tailorResume,
  applyChanges,
  aiGenerate,
  getJobMatches,
  getCompanyMatches,
  getSkillGaps,
  exportHtml,
  exportText,
  getInterviewContext,
} from "../controllers/resumeOptimizerController.js";
import { protect, studentOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/resumes/"),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `resume-${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".pdf", ".docx"].includes(ext)) return cb(null, true);
    cb(new Error("Only PDF and DOCX files are allowed"));
  },
});

router.use(protect, studentOnly);

router.get("/templates", listTemplates);
router.get("/dashboard", getCareerDashboard);
router.get("/jobs/match", getJobMatches);
router.get("/companies", getCompanyMatches);
router.get("/skill-gaps", getSkillGaps);

router.get("/", listResumes);
router.post("/", createResume);
router.post("/upload", upload.single("resume"), uploadResume);
router.post("/ai-generate", aiGenerate);

router.get("/:id", getResume);
router.put("/:id", updateResume);
router.delete("/:id", deleteResume);
router.post("/:id/duplicate", duplicateResume);
router.post("/:id/analyze", analyzeResume);
router.post("/:id/improve", improveResumeSection);
router.post("/:id/tailor", tailorResume);
router.post("/:id/apply-changes", applyChanges);
router.get("/:id/export/html", exportHtml);
router.get("/:id/export/text", exportText);
router.get("/:id/interview-context", getInterviewContext);

export default router;

import express from "express";
import { protect, adminOnly, recruiterOnly, staffOnly } from "../middleware/authMiddleware.js";
import {
  getSettings,
  updateSettings,
  getDashboard,
  listAssessments,
  createAssessment,
  getAssessment,
  updateAssessment,
  deleteAssessment,
  publishAssessment,
  duplicateAssessment,
  getCandidates,
  inviteCandidates,
  assignToCandidates,
  getResults,
  shortlistCandidates,
  importQuestions,
  getAssessmentStats,
  downloadTemplate,
} from "../controllers/assessmentManagementController.js";

const router = express.Router();

router.use(protect);
router.use(staffOnly);

router.get("/dashboard", getDashboard);
router.get("/", listAssessments);
router.post("/", createAssessment);
router.get("/:id", getAssessment);
router.put("/:id", updateAssessment);
router.delete("/:id", deleteAssessment);
router.post("/:id/publish", publishAssessment);
router.post("/:id/duplicate", duplicateAssessment);
router.get("/:id/candidates", getCandidates);
router.post("/:id/invite", inviteCandidates);
router.post("/:id/assign", assignToCandidates);
router.get("/:id/results", getResults);
router.post("/:id/shortlist", shortlistCandidates);
router.post("/:id/import", importQuestions);
router.get("/:id/stats", getAssessmentStats);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/template/download", downloadTemplate);

export default router;

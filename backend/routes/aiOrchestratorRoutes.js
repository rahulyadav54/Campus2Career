import express from "express";
import { protect, studentOnly, adminOnly } from "../middleware/authMiddleware.js";
import {
  orchestrateCareerRequest,
  getMyCareerMission,
  generateCareerMissionForStudent,
  getAICommandCenter,
  getAILogs,
  getAIOverviewForAdmin,
  getResumeIntelligence,
  getMockInterviewPlan,
  getRecruiterShortlist,
  getPlacementReadiness,
  getInstitutionInsights,
} from "../controllers/aiOrchestratorController.js";

const router = express.Router();

router.post("/orchestrator", protect, orchestrateCareerRequest);
router.get("/career/mission", protect, studentOnly, getMyCareerMission);
router.post("/career/mission", protect, generateCareerMissionForStudent);
router.get("/resume/intelligence", protect, getResumeIntelligence);
router.get("/interview/plan", protect, getMockInterviewPlan);
router.get("/recruiter/shortlist", protect, getRecruiterShortlist);
router.get("/placement/readiness", protect, getPlacementReadiness);
router.get("/institution/insights", protect, getInstitutionInsights);
router.get("/command-center", protect, getAICommandCenter);
router.get("/automation-log", protect, getAILogs);
router.get("/overview", protect, adminOnly, getAIOverviewForAdmin);

export default router;

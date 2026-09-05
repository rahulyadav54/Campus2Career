import express from "express";
import { protect, adminOnly, studentOnly, staffOnly } from "../middleware/authMiddleware.js";
import {
  createPathway, listAllPathways, updatePathway, deletePathway,
  listPathways, getCareerGuidance, getSkillMapping, getLearningRecommendations,
  createResource, listResources, deleteResource
} from "../controllers/careerPathwayController.js";
import {
  getSkillDemandAnalytics, getPlacementReadinessAnalytics,
  getSkillDemandTrends
} from "../controllers/analyticsController.js";
import { chatWithAdvisor } from "../controllers/aiController.js";

const router = express.Router();
router.use(protect);

// Admin: pathway management
router.post("/pathways", adminOnly, createPathway);
router.get("/pathways/all", adminOnly, listAllPathways);
router.put("/pathways/:id", adminOnly, updatePathway);
router.delete("/pathways/:id", adminOnly, deletePathway);

// All authenticated: browse pathways
router.get("/pathways", listPathways);

// Student: personalised career guidance, skill mapping, and learning recommendations
router.get("/guidance", studentOnly, getCareerGuidance);
router.get("/skill-mapping", studentOnly, getSkillMapping);
router.get("/learning/recommendations", studentOnly, getLearningRecommendations);

// Admin / institution: analytics
router.get("/analytics/skill-demand", staffOnly, getSkillDemandAnalytics);
router.get("/analytics/skill-demand-trends", staffOnly, getSkillDemandTrends);
router.get("/analytics/placement-readiness", staffOnly, getPlacementReadinessAnalytics);

// Admin: learning resource management
router.post("/resources", adminOnly, createResource);
router.delete("/resources/:id", adminOnly, deleteResource);

// All authenticated: browse resources
router.get("/resources", listResources);

// AI Career Advisor (student + academician)
router.post("/ai/chat", chatWithAdvisor);

export default router;

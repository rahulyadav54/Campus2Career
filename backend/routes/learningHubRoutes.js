import express from "express";
import { protect, adminOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  getLearningHub,
  getLearningStats,
  getRecommendations,
  getSkillGapCourseList,
  listBookmarks,
  toggleBookmark,
  trackCourseView,
  listLearningPaths,
  getLearningPath,
  learningAssistant,
  verifyCertificate,
  getCategories,
  createLearningPath,
  updateLearningPath,
  deleteLearningPath,
} from "../controllers/learningHubController.js";

const router = express.Router();

// Public
router.get("/certificates/verify/:certificateId", verifyCertificate);
router.get("/categories", getCategories);

// Student learning hub
router.get("/hub", protect, studentOnly, getLearningHub);
router.get("/stats", protect, studentOnly, getLearningStats);
router.get("/recommendations", protect, studentOnly, getRecommendations);
router.get("/skill-gaps", protect, studentOnly, getSkillGapCourseList);
router.get("/bookmarks", protect, studentOnly, listBookmarks);
router.post("/bookmarks/:courseId", protect, studentOnly, toggleBookmark);
router.post("/recently-viewed/:courseId", protect, studentOnly, trackCourseView);
router.get("/paths", protect, listLearningPaths);
router.get("/paths/:id", protect, getLearningPath);
router.post("/assistant", protect, studentOnly, learningAssistant);

// Admin learning paths
router.post("/paths", protect, adminOnly, createLearningPath);
router.put("/paths/:id", protect, adminOnly, updateLearningPath);
router.delete("/paths/:id", protect, adminOnly, deleteLearningPath);

export default router;

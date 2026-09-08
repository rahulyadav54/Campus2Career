import express from "express";
import { protect, adminOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollCourse, updateProgress, completeCourse, getMyEnrollments, getEnrollment,
  completeLesson, getCourseStats, addModule, addLesson, updateModule, updateLesson,
  deleteModule, deleteLesson, adminListCourses,
} from "../controllers/courseController.js";

const router = express.Router();

// Student-specific routes (before :id)
router.get("/my/enrollments", protect, studentOnly, getMyEnrollments);
router.get("/my/enrollments/:courseId", protect, studentOnly, getEnrollment);

// Admin stats & list
router.get("/admin/stats", protect, adminOnly, getCourseStats);
router.get("/admin/all", protect, adminOnly, adminListCourses);

// Catalog
router.get("/", listCourses);
router.post("/", protect, adminOnly, createCourse);

// Course actions
router.post("/:courseId/enroll", protect, studentOnly, enrollCourse);
router.post("/:courseId/progress", protect, studentOnly, updateProgress);
router.post("/:courseId/complete", protect, studentOnly, completeCourse);
router.post("/:courseId/lessons/:lessonId/complete", protect, studentOnly, completeLesson);

// Admin module/lesson management
router.post("/:courseId/modules", protect, adminOnly, addModule);
router.put("/:courseId/modules/:moduleId", protect, adminOnly, updateModule);
router.delete("/:courseId/modules/:moduleId", protect, adminOnly, deleteModule);
router.post("/:courseId/lessons", protect, adminOnly, addLesson);
router.put("/:courseId/lessons/:lessonId", protect, adminOnly, updateLesson);
router.delete("/:courseId/lessons/:lessonId", protect, adminOnly, deleteLesson);

router.get("/:id", getCourse);
router.put("/:id", protect, adminOnly, updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);

export default router;

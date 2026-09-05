import express from "express";
import { protect, adminOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  listCourses, getCourse, createCourse, updateCourse, deleteCourse,
  enrollCourse, updateProgress, completeCourse, getMyEnrollments, getEnrollment
} from "../controllers/courseController.js";

const router = express.Router();

// Public course catalog
router.get("/", listCourses);
router.get("/:id", getCourse);

// Student actions
router.post("/:courseId/enroll", protect, studentOnly, enrollCourse);
router.post("/:courseId/progress", protect, studentOnly, updateProgress);
router.post("/:courseId/complete", protect, studentOnly, completeCourse);
router.get("/my/enrollments", protect, studentOnly, getMyEnrollments);
router.get("/my/enrollments/:courseId", protect, studentOnly, getEnrollment);

// Admin management
router.post("/", protect, adminOnly, createCourse);
router.put("/:id", protect, adminOnly, updateCourse);
router.delete("/:id", protect, adminOnly, deleteCourse);

export default router;

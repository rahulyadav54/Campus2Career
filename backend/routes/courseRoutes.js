import express from "express";
import { protect, adminOnly, staffOnly, studentOnly } from "../middleware/authMiddleware.js";
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

// Admin/staff management
router.post("/", protect, staffOnly, createCourse);
router.put("/:id", protect, staffOnly, updateCourse);
router.delete("/:id", protect, staffOnly, deleteCourse);

export default router;

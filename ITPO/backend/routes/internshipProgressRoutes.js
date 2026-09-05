import express from "express";
import { protect, studentOnly, mentorOnly } from "../middleware/authMiddleware.js";
import {
  createProgress, getMyProgress, addWeeklyUpdate, submitCompletion,
  getMenteeRecords, addMentorFeedback, issueCertificate, getAllRecords, getRecord
} from "../controllers/internshipProgressController.js";
import { adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

// Student routes
router.post("/", studentOnly, createProgress);
router.get("/me", studentOnly, getMyProgress);
router.post("/:id/weekly-update", studentOnly, addWeeklyUpdate);
router.post("/:id/complete", studentOnly, submitCompletion);

// Mentor routes
router.get("/mentees", mentorOnly, getMenteeRecords);
router.post("/:id/feedback", mentorOnly, addMentorFeedback);
router.post("/:id/certificate", mentorOnly, issueCertificate);

// Admin route
router.get("/all", adminOnly, getAllRecords);

// Shared: record detail (owner / mentor / staff)
router.get("/:id", getRecord);

export default router;

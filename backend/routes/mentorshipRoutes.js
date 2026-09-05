import express from "express";
import { protect, mentorOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  listMentorshipSessions, getMentorshipSession,
  createMentorshipSession, updateMentorshipSession, deleteMentorshipSession
} from "../controllers/mentorshipController.js";

const router = express.Router();

router.use(protect);

// Mentor: view and manage own sessions
router.get("/mentor/sessions", mentorOnly, listMentorshipSessions);
router.post("/mentor/sessions", mentorOnly, createMentorshipSession);
router.put("/mentor/sessions/:id", mentorOnly, updateMentorshipSession);
router.delete("/mentor/sessions/:id", mentorOnly, deleteMentorshipSession);

// Student: view own sessions
router.get("/student/sessions", studentOnly, listMentorshipSessions);

export default router;

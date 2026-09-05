import MentorshipSession from "../models/MentorshipSessionModel.js";
import User from "../models/UserModel.js";

export const listMentorshipSessions = async (req, res) => {
  try {
    const { role, studentId } = req.query;
    let filter = {};
    if (role === "mentor") filter.mentor = req.user._id;
    else if (role === "student") filter.student = req.user._id;
    else if (studentId) filter.student = studentId;

    const sessions = await MentorshipSession.find(filter)
      .populate("mentor", "name email department")
      .populate("student", "name email department rollNo")
      .sort({ scheduledAt: -1 });
    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ message: "Failed to load mentorship sessions", error: err.message });
  }
};

export const getMentorshipSession = async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id)
      .populate("mentor", "name email department")
      .populate("student", "name email department rollNo");
    if (!session) return res.status(404).json({ message: "Session not found" });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ message: "Failed to load session", error: err.message });
  }
};

export const createMentorshipSession = async (req, res) => {
  try {
    const session = await MentorshipSession.create({ ...req.body, mentor: req.user._id });
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ message: "Failed to create session", error: err.message });
  }
};

export const updateMentorshipSession = async (req, res) => {
  try {
    const session = await MentorshipSession.findById(req.params.id);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const allowed = ["topic", "description", "scheduledAt", "durationMinutes", "mode", "meetingLink", "notes", "feedback", "rating", "status", "completedAt"];
    allowed.forEach((field) => { if (req.body[field] !== undefined) session[field] = req.body[field]; });

    await session.save();
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(400).json({ message: "Failed to update session", error: err.message });
  }
};

export const deleteMentorshipSession = async (req, res) => {
  try {
    await MentorshipSession.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete session", error: err.message });
  }
};

import Workshop from "../models/Workshop.js";
import GuestLecture from "../models/GuestLecture.js";
import InnovationChallenge from "../models/InnovationChallenge.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";
import GuestLectureRegistration from "../models/GuestLectureRegistration.js";
import ChallengeRegistration from "../models/ChallengeRegistration.js";
import ProjectApplication from "../models/ProjectApplication.js";

export const listWorkshops = async (req, res) => {
  try {
    const items = await Workshop.find({ status: "published" }).sort({ date: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load workshops", error: err.message });
  }
};

export const listGuestLectures = async (req, res) => {
  try {
    const items = await GuestLecture.find({ status: "published" }).sort({ date: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load guest lectures", error: err.message });
  }
};

export const listChallenges = async (req, res) => {
  try {
    const items = await InnovationChallenge.find({ status: "published" }).sort({ startDate: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load innovation challenges", error: err.message });
  }
};

export const listProjects = async (req, res) => {
  try {
    const items = await LiveIndustryProject.find({ status: "published" }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load live industry projects", error: err.message });
  }
};

export const createWorkshop = async (req, res) => {
  try {
    const item = await Workshop.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create workshop", error: err.message });
  }
};

export const createGuestLecture = async (req, res) => {
  try {
    const item = await GuestLecture.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create guest lecture", error: err.message });
  }
};

export const createChallenge = async (req, res) => {
  try {
    const item = await InnovationChallenge.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create innovation challenge", error: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const item = await LiveIndustryProject.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create live industry project", error: err.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const item = await Workshop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update workshop", error: err.message });
  }
};

export const updateGuestLecture = async (req, res) => {
  try {
    const item = await GuestLecture.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update guest lecture", error: err.message });
  }
};

export const updateChallenge = async (req, res) => {
  try {
    const item = await InnovationChallenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update innovation challenge", error: err.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const item = await LiveIndustryProject.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update live industry project", error: err.message });
  }
};

export const deleteWorkshop = async (req, res) => {
  try {
    await Workshop.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Workshop deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete workshop", error: err.message });
  }
};

export const deleteGuestLecture = async (req, res) => {
  try {
    await GuestLecture.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Guest lecture deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete guest lecture", error: err.message });
  }
};

export const deleteChallenge = async (req, res) => {
  try {
    await InnovationChallenge.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Innovation challenge deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete innovation challenge", error: err.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    await LiveIndustryProject.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Live industry project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete live industry project", error: err.message });
  }
};

export const registerForWorkshop = async (req, res) => {
  try {
    const item = await Workshop.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Workshop not found" });

    const existing = await WorkshopRegistration.findOne({ workshop: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this workshop" });

    await WorkshopRegistration.create({ workshop: item._id, student: req.user._id });
    item.registeredCount = (item.registeredCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Registered successfully", registeredCount: item.registeredCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to register", error: err.message });
  }
};

export const registerForGuestLecture = async (req, res) => {
  try {
    const item = await GuestLecture.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Guest lecture not found" });

    const existing = await GuestLectureRegistration.findOne({ guestLecture: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this guest lecture" });

    await GuestLectureRegistration.create({ guestLecture: item._id, student: req.user._id });
    item.registeredCount = (item.registeredCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Registered successfully", registeredCount: item.registeredCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to register", error: err.message });
  }
};

export const registerForChallenge = async (req, res) => {
  try {
    const item = await InnovationChallenge.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Innovation challenge not found" });

    const existing = await ChallengeRegistration.findOne({ challenge: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this challenge" });

    await ChallengeRegistration.create({
      challenge: item._id,
      student: req.user._id,
      teamName: req.body?.teamName,
      teamMembers: req.body?.teamMembers || []
    });

    res.json({ success: true, message: "Registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to register", error: err.message });
  }
};

export const applyToProject = async (req, res) => {
  try {
    const item = await LiveIndustryProject.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Live industry project not found" });

    const existing = await ProjectApplication.findOne({ project: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already applied for this project" });

    await ProjectApplication.create({
      project: item._id,
      student: req.user._id,
      coverLetter: req.body?.coverLetter
    });

    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Applied successfully", applicantsCount: item.applicantsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
};

export const getMyCollaborations = async (req, res) => {
  try {
    const [workshops, guestLectures, challenges, projects] = await Promise.all([
      Workshop.find({ createdBy: req.user._id }),
      GuestLecture.find({ createdBy: req.user._id }),
      InnovationChallenge.find({ createdBy: req.user._id }),
      LiveIndustryProject.find({ createdBy: req.user._id })
    ]);

    const [workshopRegs, guestLectureRegs, challengeRegs, projectApps] = await Promise.all([
      WorkshopRegistration.find({ student: req.user._id }).populate("workshop"),
      GuestLectureRegistration.find({ student: req.user._id }).populate("guestLecture"),
      ChallengeRegistration.find({ student: req.user._id }).populate("challenge"),
      ProjectApplication.find({ student: req.user._id }).populate("project")
    ]);

    res.json({ success: true, data: { workshops, guestLectures, challenges, projects, workshopRegs, guestLectureRegs, challengeRegs, projectApps } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load collaborations", error: err.message });
  }
};

export const getCollaborationStats = async (req, res) => {
  try {
    const [workshops, guestLectures, challenges, projects] = await Promise.all([
      Workshop.countDocuments(),
      GuestLecture.countDocuments(),
      InnovationChallenge.countDocuments(),
      LiveIndustryProject.countDocuments()
    ]);
    res.json({ success: true, data: { workshops, guestLectures, challenges, projects } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats", error: err.message });
  }
};

import Workshop from "../models/Workshop.js";
import GuestLecture from "../models/GuestLecture.js";
import InnovationChallenge from "../models/InnovationChallenge.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";
import GuestLectureRegistration from "../models/GuestLectureRegistration.js";
import ChallengeRegistration from "../models/ChallengeRegistration.js";
import ProjectApplication from "../models/ProjectApplication.js";
import {
  parseRegistrationDetails,
  registrationsToRows,
  exportRegistrationsCsv,
  exportRegistrationsXlsx,
} from "../services/collaborationRegistration.js";

const REGISTRY = {
  workshops: {
    ItemModel: Workshop,
    RegModel: WorkshopRegistration,
    regField: "workshop",
    type: "workshops",
    countField: "registeredCount",
  },
  "guest-lectures": {
    ItemModel: GuestLecture,
    RegModel: GuestLectureRegistration,
    regField: "guestLecture",
    type: "guest-lectures",
    countField: "registeredCount",
  },
  challenges: {
    ItemModel: InnovationChallenge,
    RegModel: ChallengeRegistration,
    regField: "challenge",
    type: "challenges",
    countField: null,
  },
  projects: {
    ItemModel: LiveIndustryProject,
    RegModel: ProjectApplication,
    regField: "project",
    type: "projects",
    countField: "applicantsCount",
  },
};

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
    const body = { ...req.body };
    if (Array.isArray(body.tags) && !body.skills) body.skills = body.tags;
    if (typeof body.tags === "string" && !body.skills) {
      body.skills = body.tags.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (body.instructor && !body.organizer) body.organizer = body.instructor;
    if (body.capacity) body.maxParticipants = Number(body.capacity);
    body.status = body.status || "published";
    const item = await Workshop.create({ ...body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create workshop", error: err.message });
  }
};

export const createGuestLecture = async (req, res) => {
  try {
    const body = { ...req.body };
    if (body.instructor && !body.speaker) body.speaker = body.instructor;
    if (body.title && !body.topic) body.topic = body.title;
    if (!body.organization) body.organization = body.organizer || "Campus Partner";
    if (!body.designation) body.designation = "Industry Expert";
    if (Array.isArray(body.tags) && !body.skills) body.skills = body.tags;
    if (body.capacity) body.maxParticipants = Number(body.capacity);
    body.status = body.status || "published";
    const item = await GuestLecture.create({ ...body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create guest lecture", error: err.message });
  }
};

export const createChallenge = async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.organizer) body.organizer = "Campus2Career";
    if (!body.theme) body.theme = body.title || "Innovation";
    if (body.deadline && !body.registrationDeadline) body.registrationDeadline = body.deadline;
    if (!body.startDate) body.startDate = body.registrationDeadline || new Date();
    if (!body.endDate) body.endDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    if (body.teamSize) body.maxTeamSize = Number(body.teamSize);
    if (typeof body.tags === "string") {
      body.skills = body.tags.split(",").map((s) => s.trim()).filter(Boolean);
    }
    body.status = body.status === "open" || !body.status ? "published" : body.status;
    const item = await InnovationChallenge.create({ ...body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create innovation challenge", error: err.message });
  }
};

export const createProject = async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.skills) && !body.skillsRequired) {
      body.skillsRequired = body.skills;
    }
    if (body.deadline && !body.applicationDeadline) {
      body.applicationDeadline = body.deadline;
    }
    if (body.capacity) body.capacity = Number(body.capacity);
    body.status = body.status || "published";

    const item = await LiveIndustryProject.create({ ...body, createdBy: req.user._id });
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
    const cfg = REGISTRY.workshops;
    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Workshop not found" });

    const existing = await cfg.RegModel.findOne({ workshop: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this workshop" });

    const details = parseRegistrationDetails(req.body, req.user);
    await cfg.RegModel.create({ workshop: item._id, student: req.user._id, details });
    item.registeredCount = (item.registeredCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Registered successfully", registeredCount: item.registeredCount });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to register", error: err.message });
  }
};

export const registerForGuestLecture = async (req, res) => {
  try {
    const cfg = REGISTRY["guest-lectures"];
    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Guest lecture not found" });

    const existing = await cfg.RegModel.findOne({ guestLecture: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this guest lecture" });

    const details = parseRegistrationDetails(req.body, req.user);
    await cfg.RegModel.create({ guestLecture: item._id, student: req.user._id, details });
    item.registeredCount = (item.registeredCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Registered successfully", registeredCount: item.registeredCount });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to register", error: err.message });
  }
};

export const registerForChallenge = async (req, res) => {
  try {
    const cfg = REGISTRY.challenges;
    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Innovation challenge not found" });

    const existing = await cfg.RegModel.findOne({ challenge: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already registered for this challenge" });

    const details = parseRegistrationDetails(req.body, req.user, { requireTeamName: true });
    await cfg.RegModel.create({
      challenge: item._id,
      student: req.user._id,
      details,
      teamName: details.teamName,
    });

    res.json({ success: true, message: "Registered successfully" });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to register", error: err.message });
  }
};

export const applyToProject = async (req, res) => {
  try {
    const cfg = REGISTRY.projects;
    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Live industry project not found" });

    const existing = await cfg.RegModel.findOne({ project: item._id, student: req.user._id });
    if (existing) return res.status(400).json({ message: "Already applied for this project" });

    const details = parseRegistrationDetails(req.body, req.user);
    await cfg.RegModel.create({
      project: item._id,
      student: req.user._id,
      details,
      coverLetter: details.coverLetter || req.body?.coverLetter,
    });

    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();

    res.json({ success: true, message: "Applied successfully", applicantsCount: item.applicantsCount });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message || "Failed to apply", error: err.message });
  }
};

/** Staff: list all registrations for a collaboration item */
export const listItemRegistrations = async (req, res) => {
  try {
    const type = req.params.type;
    const cfg = REGISTRY[type];
    if (!cfg) return res.status(400).json({ message: "Invalid collaboration type" });

    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const filter = { [cfg.regField]: item._id };
    const regs = await cfg.RegModel.find(filter)
      .populate("student", "name email phone department year rollNo institution")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: regs,
      count: regs.length,
      item: { _id: item._id, title: item.title },
      type,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load registrations", error: err.message });
  }
};

/** Staff: export registrations as CSV or Excel */
export const exportItemRegistrations = async (req, res) => {
  try {
    const type = req.params.type;
    const cfg = REGISTRY[type];
    if (!cfg) return res.status(400).json({ message: "Invalid collaboration type" });

    const item = await cfg.ItemModel.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });

    const filter = { [cfg.regField]: item._id };
    const regs = await cfg.RegModel.find(filter)
      .populate("student", "name email phone department year rollNo institution")
      .sort({ createdAt: -1 });

    const rows = registrationsToRows(regs, type);
    const safeTitle = (item.title || "registrations").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_");
    const format = String(req.query.format || "csv").toLowerCase();

    if (format === "xlsx" || format === "excel") {
      const { content, filename, contentType } = exportRegistrationsXlsx(rows, `${safeTitle}_registrations.xlsx`);
      res.setHeader("Content-Type", contentType);
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(content);
    }

    const { content, filename, contentType } = exportRegistrationsCsv(rows, `${safeTitle}_registrations.csv`);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(content);
  } catch (err) {
    res.status(500).json({ message: "Failed to export registrations", error: err.message });
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

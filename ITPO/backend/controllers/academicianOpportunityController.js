import FacultyDevelopmentProgram from "../models/FacultyDevelopmentProgram.js";
import FacultyInternship from "../models/FacultyInternship.js";
import ConsultancyOpportunity from "../models/ConsultancyOpportunity.js";
import ResearchCollaboration from "../models/ResearchCollaboration.js";

const extractApplicants = (req) => {
  const body = req.body || {};
  return {
    name: body.name,
    email: body.email,
    phone: body.phone,
    institution: body.institution,
    designation: body.designation,
    experience: body.experience,
    motivation: body.motivation
  };
};

export const listFdps = async (req, res) => {
  try {
    const items = await FacultyDevelopmentProgram.find({ status: "published" }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load FDPs", error: err.message });
  }
};

export const listFacultyInternships = async (req, res) => {
  try {
    const items = await FacultyInternship.find({ status: "published" }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load faculty internships", error: err.message });
  }
};

export const listConsultancies = async (req, res) => {
  try {
    const items = await ConsultancyOpportunity.find({ status: "published" }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load consultancy opportunities", error: err.message });
  }
};

export const listResearch = async (req, res) => {
  try {
    const items = await ResearchCollaboration.find({ status: "published" }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ message: "Failed to load research collaborations", error: err.message });
  }
};

export const createFdp = async (req, res) => {
  try {
    const item = await FacultyDevelopmentProgram.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create FDP", error: err.message });
  }
};

export const createFacultyInternship = async (req, res) => {
  try {
    const item = await FacultyInternship.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create faculty internship", error: err.message });
  }
};

export const createConsultancy = async (req, res) => {
  try {
    const item = await ConsultancyOpportunity.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create consultancy opportunity", error: err.message });
  }
};

export const createResearch = async (req, res) => {
  try {
    const item = await ResearchCollaboration.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to create research collaboration", error: err.message });
  }
};

export const updateFdp = async (req, res) => {
  try {
    const item = await FacultyDevelopmentProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update FDP", error: err.message });
  }
};

export const updateFacultyInternship = async (req, res) => {
  try {
    const item = await FacultyInternship.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update faculty internship", error: err.message });
  }
};

export const updateConsultancy = async (req, res) => {
  try {
    const item = await ConsultancyOpportunity.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update consultancy opportunity", error: err.message });
  }
};

export const updateResearch = async (req, res) => {
  try {
    const item = await ResearchCollaboration.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(400).json({ message: "Failed to update research collaboration", error: err.message });
  }
};

export const deleteFdp = async (req, res) => {
  try {
    await FacultyDevelopmentProgram.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "FDP deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete FDP", error: err.message });
  }
};

export const deleteFacultyInternship = async (req, res) => {
  try {
    await FacultyInternship.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Faculty internship deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete faculty internship", error: err.message });
  }
};

export const deleteConsultancy = async (req, res) => {
  try {
    await ConsultancyOpportunity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Consultancy opportunity deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete consultancy opportunity", error: err.message });
  }
};

export const deleteResearch = async (req, res) => {
  try {
    await ResearchCollaboration.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Research collaboration deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete research collaboration", error: err.message });
  }
};

export const applyToFdp = async (req, res) => {
  try {
    const item = await FacultyDevelopmentProgram.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "FDP not found" });
    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();
    res.json({ success: true, message: "Applied successfully", applicants: item.applicantsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
};

export const applyToFacultyInternship = async (req, res) => {
  try {
    const item = await FacultyInternship.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Faculty internship not found" });
    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();
    res.json({ success: true, message: "Applied successfully", applicants: item.applicantsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
};

export const applyToConsultancy = async (req, res) => {
  try {
    const item = await ConsultancyOpportunity.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Consultancy opportunity not found" });
    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();
    res.json({ success: true, message: "Applied successfully", applicants: item.applicantsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
};

export const applyToResearch = async (req, res) => {
  try {
    const item = await ResearchCollaboration.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Research collaboration not found" });
    item.applicantsCount = (item.applicantsCount || 0) + 1;
    await item.save();
    res.json({ success: true, message: "Applied successfully", applicants: item.applicantsCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to apply", error: err.message });
  }
};

export const getMyAcademicianApplications = async (req, res) => {
  try {
    const [fdps, facultyInternships, consultancies, research] = await Promise.all([
      FacultyDevelopmentProgram.find({ createdBy: req.user._id }),
      FacultyInternship.find({ createdBy: req.user._id }),
      ConsultancyOpportunity.find({ createdBy: req.user._id }),
      ResearchCollaboration.find({ createdBy: req.user._id })
    ]);
    res.json({ success: true, data: { fdps, facultyInternships, consultancies, research } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load applications", error: err.message });
  }
};

export const getAcademicianStats = async (req, res) => {
  try {
    const [fdps, facultyInternships, consultancies, research] = await Promise.all([
      FacultyDevelopmentProgram.countDocuments(),
      FacultyInternship.countDocuments(),
      ConsultancyOpportunity.countDocuments(),
      ResearchCollaboration.countDocuments()
    ]);
    res.json({ success: true, data: { fdps, facultyInternships, consultancies, research } });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats", error: err.message });
  }
};

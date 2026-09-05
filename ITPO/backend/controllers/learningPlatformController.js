import LearningPlatform from "../models/LearningPlatformModel.js";

export const listPlatforms = async (req, res) => {
  try {
    const platforms = await LearningPlatform.find({ isActive: true }).sort({ name: 1 });
    res.json({ success: true, data: platforms });
  } catch (err) {
    res.status(500).json({ message: "Failed to load learning platforms", error: err.message });
  }
};

export const getPlatform = async (req, res) => {
  try {
    const platform = await LearningPlatform.findById(req.params.id);
    if (!platform) return res.status(404).json({ message: "Platform not found" });
    res.json({ success: true, data: platform });
  } catch (err) {
    res.status(500).json({ message: "Failed to load platform", error: err.message });
  }
};

export const createPlatform = async (req, res) => {
  try {
    const platform = await LearningPlatform.create(req.body);
    res.status(201).json({ success: true, data: platform });
  } catch (err) {
    res.status(400).json({ message: "Failed to create platform", error: err.message });
  }
};

export const updatePlatform = async (req, res) => {
  try {
    const platform = await LearningPlatform.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: platform });
  } catch (err) {
    res.status(400).json({ message: "Failed to update platform", error: err.message });
  }
};

export const deletePlatform = async (req, res) => {
  try {
    await LearningPlatform.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Platform removed" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete platform", error: err.message });
  }
};

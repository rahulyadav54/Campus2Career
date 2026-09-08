import PreferenceService from "../services/notifications/preferenceService.js";
import NotificationService from "../services/notificationService.js";

export const getPreferences = async (req, res) => {
  try {
    const prefs = await PreferenceService.getOrCreate(req.user._id);
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ message: "Failed to load preferences", error: err.message });
  }
};

export const updatePreferences = async (req, res) => {
  try {
    const { email, inApp, digestFrequency } = req.body;
    const updates = {};
    if (email) updates.email = email;
    if (inApp) updates.inApp = inApp;
    if (digestFrequency) updates.digestFrequency = digestFrequency;
    const prefs = await PreferenceService.update(req.user._id, updates);
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ message: "Failed to update preferences", error: err.message });
  }
};

export const getEmailHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await NotificationService.getUserEmailHistory(req.user._id, { page, limit });
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ message: "Failed to load email history", error: err.message });
  }
};

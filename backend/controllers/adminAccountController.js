import fs from "fs";
import path from "path";
import multer from "multer";
import User from "../models/UserModel.js";
import AuthSession from "../models/AuthSession.js";
import AuditLog from "../models/AuditLogModel.js";
import AuditService from "../services/auditService.js";
import { mergeAdminSettings } from "../constants/adminSettingsDefaults.js";
import { parseUserAgent } from "../utils/userAgent.js";

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = "uploads/avatars";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".png";
    cb(null, `admin-${req.user._id}-${Date.now()}${ext}`);
  },
});

export const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (allowed.test(file.mimetype) || allowed.test(ext.replace(".", ""))) return cb(null, true);
    cb(new Error("Only JPEG, PNG, or WebP images are allowed"));
  },
});

export const getAccountOverview = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      success: true,
      user: user.getPublicProfile(),
      settings: mergeAdminSettings(user.adminSettings),
      security: {
        emailVerified: Boolean(user.isVerified),
        phoneVerified: Boolean(user.phoneVerified),
        twoFactor: {
          supported: false,
          enabled: false,
          message: "Two-factor authentication is not connected to the current JWT authentication provider.",
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load account", error: err.message });
  }
};

export const updateAdminSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    const next = mergeAdminSettings({ ...mergeAdminSettings(user.adminSettings), ...req.body });
    if (req.body.appearance) next.appearance = { ...next.appearance, ...req.body.appearance };
    if (req.body.locale) next.locale = { ...next.locale, ...req.body.locale };
    if (req.body.dashboard) next.dashboard = { ...next.dashboard, ...req.body.dashboard };
    if (req.body.notifications) {
      next.notifications = {
        ...next.notifications,
        ...req.body.notifications,
        channels: { ...next.notifications.channels, ...(req.body.notifications.channels || {}) },
        categories: { ...next.notifications.categories, ...(req.body.notifications.categories || {}) },
      };
    }
    if (req.body.privacy) next.privacy = { ...next.privacy, ...req.body.privacy };

    user.adminSettings = next;
    user.activityLog.push({ action: "Settings changed", date: new Date() });
    await user.save();
    await AuditService.log({
      user: user._id,
      action: "settings_changed",
      resource: "settings",
      details: { keys: Object.keys(req.body) },
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
      severity: "low",
    });
    res.json({ success: true, settings: mergeAdminSettings(user.adminSettings) });
  } catch (err) {
    res.status(500).json({ message: "Failed to save settings", error: err.message });
  }
};

export const uploadAdminAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No image uploaded" });
    const backendUrl = (process.env.BACKEND_URL || "").replace(/\/$/, "") || `${req.protocol}://${req.get("host")}`;
    const user = await User.findById(req.user._id);
    user.profileImage = `${backendUrl}/uploads/avatars/${req.file.filename}`;
    user.activityLog.push({ action: "Updated profile", date: new Date() });
    await user.save();
    res.json({ success: true, profileImage: user.profileImage, user: user.getPublicProfile() });
  } catch (err) {
    res.status(500).json({ message: "Failed to upload photo", error: err.message });
  }
};

export const getAdminActivityLog = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = String(req.query.search || "").trim();
    const action = String(req.query.action || "").trim();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const filter = { user: req.user._id };
    if (action) filter.action = new RegExp(action, "i");
    if (search) filter.action = new RegExp(search, "i");
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate && !Number.isNaN(startDate.getTime())) filter.timestamp.$gte = startDate;
      if (endDate && !Number.isNaN(endDate.getTime())) filter.timestamp.$lte = endDate;
    }

    const [logs, total, user] = await Promise.all([
      AuditLog.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit),
      AuditLog.countDocuments(filter),
      User.findById(req.user._id).select("activityLog name"),
    ]);

    let items = logs.map((log) => {
      const ua = parseUserAgent(log.userAgent);
      return {
        id: log._id,
        action: log.action,
        date: log.timestamp,
        user: req.user.name,
        device: log.userAgent ? `${ua.browser} • ${ua.os}` : null,
        ip: log.ipAddress || null,
      };
    });

    if (!items.length && user?.activityLog?.length) {
      const fallback = [...user.activityLog]
        .filter((entry) => {
          if (search && !String(entry.action || "").toLowerCase().includes(search.toLowerCase())) return false;
          if (action && !String(entry.action || "").toLowerCase().includes(action.toLowerCase())) return false;
          const d = new Date(entry.date);
          if (startDate && d < startDate) return false;
          if (endDate && d > endDate) return false;
          return true;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const start = (page - 1) * limit;
      items = fallback.slice(start, start + limit).map((entry, idx) => ({
        id: `${entry.date}-${idx}`,
        action: entry.action,
        date: entry.date,
        user: user.name,
        device: null,
        ip: null,
      }));
      return res.json({
        success: true,
        items,
        page,
        totalPages: Math.max(1, Math.ceil(fallback.length / limit)),
        total: fallback.length,
      });
    }

    res.json({
      success: true,
      items,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load activity log", error: err.message });
  }
};

export const deactivateOwnAccount = async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (confirm !== "DEACTIVATE") {
      return res.status(400).json({ message: "Type DEACTIVATE to confirm" });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await user.comparePassword(password || "");
    if (!ok) return res.status(400).json({ message: "Password is incorrect" });

    user.isActive = false;
    await user.save();
    await AuthSession.updateMany({ user: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
    await AuditService.logSecurityEvent(user._id, "account_deactivated", {}, req, "critical");
    res.json({ success: true, message: "Account deactivated" });
  } catch (err) {
    res.status(500).json({ message: "Failed to deactivate account", error: err.message });
  }
};

export const deleteOwnAccount = async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (confirm !== "DELETE") {
      return res.status(400).json({ message: "Type DELETE to confirm account deletion" });
    }
    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await user.comparePassword(password || "");
    if (!ok) return res.status(400).json({ message: "Password is incorrect" });

    const adminCount = await User.countDocuments({ role: "admin", isActive: { $ne: false } });
    if (user.role === "admin" && adminCount <= 1) {
      return res.status(400).json({ message: "Cannot delete the last administrator account" });
    }

    await AuthSession.deleteMany({ user: user._id });
    await AuditService.logSecurityEvent(user._id, "account_deleted", {}, req, "critical");
    await User.findByIdAndDelete(user._id);
    res.json({ success: true, message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete account", error: err.message });
  }
};

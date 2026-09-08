import User from "../models/UserModel.js";
import AuthSession from "../models/AuthSession.js";
import AuditService from "../services/auditService.js";
import NotificationService from "../services/notificationService.js";
import { EVENTS } from "../constants/notificationEvents.js";
import { getFrontendBaseUrl } from "../utils/frontendUrl.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { clientIp } from "../utils/userAgent.js";

const generateToken = (id, extras = {}) => {
  return jwt.sign({ id, ...extras }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
};

const issueSessionToken = async (user, req) => {
  const sessionId = crypto.randomUUID();
  await AuthSession.create({
    user: user._id,
    sessionId,
    userAgent: req.get("User-Agent") || "",
    ipAddress: clientIp(req),
    lastActiveAt: new Date(),
  });
  return generateToken(user._id, { sid: sessionId, tv: user.tokenVersion || 0 });
};

const passwordMeetsPolicy = (password = "") => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};

export const refreshToken = async (req, res) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "No token, not authorized" });
    }

    // Verify the signature but allow already-expired tokens so a session can
    // be seamlessly renewed before the user is forced to log in again.
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({ success: true, token: generateToken(user._id, { sid: decoded.sid, tv: user.tokenVersion || 0 }) });
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

// @route GET /api/auth/check-email/:email
export const checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const existing = await User.findOne({ email });
    
    res.json({
      exists: !!existing,
      email
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @route POST /api/auth/register-student
export const registerStudent = async (req, res) => {
  try {
    const { name, email, password, phone, department, year, rollNo, cgpa, skills } = req.body;

    
    // Check email first
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    
    if (existingEmail) {
      return res.status(400).json({ 
        message: "This email address is already registered",
        field: "email"
      });
    }
    
    // Then check roll number
    const existingRollNo = await User.findOne({ rollNo });
    if (existingRollNo) {
      return res.status(400).json({ 
        message: "This roll number is already registered",
        field: "rollNo"
      });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      phone, 
      department, 
      year, 
      rollNo, 
      cgpa: parseFloat(cgpa),
      skills: skills || [],
      role: "student",
      status: "active",
    });
    await user.save();

    const token = await issueSessionToken(user, req);

    res.status(201).json({
      success: true,
      message: "Registration successful. Awaiting admin approval.",
      token,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation error", errors });
    }
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @route POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, department, year, rollNo, cgpa, skills, role, company, institution, designation } = req.body;
    const acceptedRoles = ["student", "recruiter", "academician"];
    if (!acceptedRoles.includes(role || "student")) {
      return res.status(400).json({ message: "Invalid registration role" });
    }
    
    const isRecruiter = role === "recruiter";
    
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ 
        message: "This email address is already registered",
        field: "email"
      });
    }
    
    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ 
          message: "This roll number is already registered",
          field: "rollNo"
        });
      }
    }

    const userData = { 
      name, 
      email, 
      password, 
      phone,
      role: role || "student"
    };
    
    if (!isRecruiter) {
      userData.department = department;
      userData.year = year;
      userData.rollNo = rollNo;
      userData.cgpa = parseFloat(cgpa) || 0;
      userData.skills = skills || [];
      userData.status = "pending";
    }
    
    if (isRecruiter) {
      userData.company = company;
      userData.status = "pending";
    }

    if (role === "academician") {
      userData.institution = institution;
      userData.designation = designation;
      userData.status = "pending";
    }

    const user = new User(userData);
    await user.save();

    const token = await issueSessionToken(user, req);

    res.status(201).json({
      success: true,
      message: isRecruiter ? "Registration submitted. Awaiting admin approval." : "Registration successful. Awaiting admin approval.",
      token,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.keys(err.errors).reduce((acc, key) => {
        acc[key] = err.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: "Validation error", errors });
    }
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @route POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
    
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status === "pending") {
      return res.status(403).json({ message: "Account pending approval" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Update last login and add activity log
    user.lastLogin = new Date();
    user.activityLog.push({ action: 'Logged in', date: new Date() });
    await user.save();

    await AuditService.logLogin(user._id, req, true);

    res.status(200).json({
      success: true,
      token: await issueSessionToken(user, req),
      role: user.role,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @route GET /api/auth/profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedMentor', 'name email');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// @route PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // List of fields that can be updated
    const allowedFields = [
      'name', 'phone', 'department', 'year', 'cgpa',
      'description', 'skills', 'socialLinks', 'projects',
      'experiences', 'course', 'specialization', 'backlogs',
      'designation', 'employeeId'
    ];

    // Update only allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        // Handle special cases
        if (field === 'cgpa') {
          user[field] = parseFloat(req.body[field]) || 0;
        } else if (field === 'backlogs') {
          user[field] = parseInt(req.body[field]) || 0;
        } else {
          user[field] = req.body[field];
        }
      }
    }

    // Handle nested updates for socialLinks
    if (req.body.socialLinks) {
      user.socialLinks = {
        linkedin: req.body.socialLinks.linkedin || "",
        github: req.body.socialLinks.github || "",
        portfolio: req.body.socialLinks.portfolio || "",
        twitter: req.body.socialLinks.twitter || "",
        leetcode: req.body.socialLinks.leetcode || "",
        codeforces: req.body.socialLinks.codeforces || "",
        hackerrank: req.body.socialLinks.hackerrank || "",
      };
    }

    try {
      // Add activity log
      user.activityLog.push({ action: 'Updated profile', date: new Date() });
      await user.save();
      await AuditService.logProfileUpdated(user._id, Object.keys(req.body), req);

      res.json({
        message: "Profile updated successfully",
        user: user.getPublicProfile(),
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      
      // Check for validation errors
      if (saveError.name === 'ValidationError') {
        return res.status(400).json({
          message: "Validation error",
          errors: Object.keys(saveError.errors).reduce((acc, key) => {
            acc[key] = saveError.errors[key].message;
            return acc;
          }, {})
        });
      }
      
      throw saveError;
    }
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ 
      message: "Failed to update profile",
      error: error.message 
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword, signOutOtherDevices } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    if (confirmPassword !== undefined && confirmPassword !== newPassword) {
      return res.status(400).json({ message: "New password and confirmation do not match" });
    }
    if (!passwordMeetsPolicy(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const matches = await user.comparePassword(currentPassword);
    if (!matches) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.activityLog.push({ action: "Password changed", date: new Date() });
    if (signOutOtherDevices) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }
    await user.save();

    if (signOutOtherDevices) {
      await AuthSession.updateMany(
        { user: user._id, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
    }

    await AuditService.logSecurityEvent(user._id, "password_changed", { signOutOtherDevices: !!signOutOtherDevices }, req, "high");

    const token = signOutOtherDevices
      ? await issueSessionToken(user, req)
      : generateToken(user._id, { sid: req.sessionId, tv: user.tokenVersion });

    res.json({
      success: true,
      message: "Password updated successfully",
      token,
    });

    setImmediate(() => {
      NotificationService.notify({
        userId: user._id,
        event: EVENTS.PASSWORD_CHANGED,
        data: { userId: user._id, role: user.role },
      }).catch((e) => console.error("[changePassword] notification error:", e.message));
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to change password", error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    if (req.sessionId) {
      await AuthSession.updateOne(
        { sessionId: req.sessionId, user: req.user._id },
        { $set: { revokedAt: new Date() } }
      );
    }
    req.user.activityLog.push({ action: "Logged out", date: new Date() });
    await req.user.save();
    await AuditService.logLogout(req.user._id, req);
    res.json({ success: true, message: "Logged out" });
  } catch (err) {
    res.status(500).json({ message: "Logout failed", error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").toLowerCase().trim();
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    let rawToken = null;
    if (user) {
      rawToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000);
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${getFrontendBaseUrl()}/forgot-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
      setImmediate(() => {
        NotificationService.notify({
          userId: user._id,
          event: EVENTS.PASSWORD_RESET,
          data: { userId: user._id, resetUrl, expiryMinutes: "60", role: user.role },
        }).catch((e) => console.error("[forgotPassword] notification error:", e.message));
      });
    }

    const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
    res.json({
      success: true,
      message: emailConfigured
        ? "If an account exists for that email, password reset instructions have been sent."
        : "If an account exists for that email, a reset was recorded. Outbound email is not configured on this server, so no message was sent. Contact a platform administrator.",
      emailConfigured,
    });
  } catch (err) {
    res.status(500).json({ message: "Unable to process password reset", error: err.message });
  }
};

export const listSessions = async (req, res) => {
  try {
    const sessions = await AuthSession.find({ user: req.user._id, revokedAt: null }).sort({ lastActiveAt: -1 });
    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.sessionId,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress || null,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        current: s.sessionId === req.sessionId,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load sessions", error: err.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (sessionId === req.sessionId) {
      return res.status(400).json({ message: "Use log out to end the current session" });
    }
    const session = await AuthSession.findOne({ sessionId, user: req.user._id, revokedAt: null });
    if (!session) return res.status(404).json({ message: "Session not found" });
    session.revokedAt = new Date();
    await session.save();
    await AuditService.logSecurityEvent(req.user._id, "session_revoked", { sessionId }, req, "medium");
    res.json({ success: true, message: "Session revoked" });
  } catch (err) {
    res.status(500).json({ message: "Failed to revoke session", error: err.message });
  }
};

export const revokeOtherSessions = async (req, res) => {
  try {
    const filter = { user: req.user._id, revokedAt: null };
    if (req.sessionId) filter.sessionId = { $ne: req.sessionId };
    const result = await AuthSession.updateMany(filter, { $set: { revokedAt: new Date() } });
    await AuditService.logSecurityEvent(req.user._id, "sessions_revoked", { count: result.modifiedCount }, req, "high");
    res.json({ success: true, message: "Signed out of other devices", revoked: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: "Failed to sign out other devices", error: err.message });
  }
};


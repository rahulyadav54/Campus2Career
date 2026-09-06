import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import AuthSession from "../models/AuthSession.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({ message: "Account is deactivated" });
      }

      if (decoded.tv !== undefined && decoded.tv !== req.user.tokenVersion) {
        return res.status(401).json({ message: "Session expired. Please login again." });
      }

      if (decoded.sid) {
        const session = await AuthSession.findOne({
          sessionId: decoded.sid,
          user: req.user._id,
          revokedAt: null,
        });
        if (!session) {
          return res.status(401).json({ message: "Session expired. Please login again." });
        }
        req.sessionId = decoded.sid;
        const stale = Date.now() - new Date(session.lastActiveAt).getTime() > 5 * 60 * 1000;
        if (stale) {
          session.lastActiveAt = new Date();
          session.save().catch(() => {});
        }
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "No token, not authorized" });
  }
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

export const mentorOnly = (req, res, next) => {
  if (req.user && req.user.role === "mentor") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Mentor only." });
  }
};

export const recruiterOnly = (req, res, next) => {
  if (req.user && req.user.role === "recruiter") {
    next();
  }
  else {
    res.status(403).json({ message: "Access denied. Recruiter only." });
  }
}

export const studentOnly = (req, res, next) => {
  if (req.user && req.user.role === "student") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Student only." });
  }
};

export const academicianOnly = (req, res, next) => {
  if (req.user && req.user.role === "academician") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Academician only." });
  }
};

export const institutionOnly = (req, res, next) => {
  if (req.user && (req.user.role === "institution" || req.user.role === "admin")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Institution admin only." });
  }
};

// Staff = admin or institution admin (for analytics / management dashboards)
export const staffOnly = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "institution")) {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin or institution staff only." });
  }
};

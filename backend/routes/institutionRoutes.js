import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  createInstitution, listInstitutions, assignInstitutionAdmin,
  getMyInstitution, updateInstitution, getInstitutionDashboard,
  getInstitutionStudents, approveInstitutionStudent,
  verifyInstitutionPortfolio, getPendingPortfolioItems
} from "../controllers/institutionController.js";

const router = express.Router();
router.use(protect);

const institutionAdminOnly = (req, res, next) => {
  if (req.user && (req.user.role === "institution" || req.user.role === "admin")) return next();
  res.status(403).json({ message: "Access denied. Institution admin only." });
};

// Admin-only routes
router.post("/", adminOnly, createInstitution);
router.get("/all", adminOnly, listInstitutions);
router.put("/:id/assign-admin", adminOnly, assignInstitutionAdmin);

// Institution admin routes
router.get("/me", institutionAdminOnly, getMyInstitution);
router.put("/me", institutionAdminOnly, updateInstitution);
router.get("/me/dashboard", institutionAdminOnly, getInstitutionDashboard);
router.get("/me/students", institutionAdminOnly, getInstitutionStudents);
router.put("/me/students/:id/approve", institutionAdminOnly, approveInstitutionStudent);
router.get("/me/portfolio/pending", institutionAdminOnly, getPendingPortfolioItems);
router.patch("/me/portfolio/:id/verify", institutionAdminOnly, verifyInstitutionPortfolio);

export default router;

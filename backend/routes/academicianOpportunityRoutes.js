import express from "express";
import { protect, adminOnly, institutionOnly, staffOnly, academicianOnly } from "../middleware/authMiddleware.js";
import {
  listFdps, listFacultyInternships, listConsultancies, listResearch,
  createFdp, createFacultyInternship, createConsultancy, createResearch,
  updateFdp, updateFacultyInternship, updateConsultancy, updateResearch,
  deleteFdp, deleteFacultyInternship, deleteConsultancy, deleteResearch,
  applyToFdp, applyToFacultyInternship, applyToConsultancy, applyToResearch,
  getMyAcademicianApplications, getAcademicianStats
} from "../controllers/academicianOpportunityController.js";

const router = express.Router();

router.use(protect);

// Public listing for all published opportunities
router.get("/fdps", listFdps);
router.get("/faculty-internships", listFacultyInternships);
router.get("/consultancies", listConsultancies);
router.get("/research", listResearch);

// Admin/institution management
router.post("/fdps", staffOnly, createFdp);
router.put("/fdps/:id", staffOnly, updateFdp);
router.delete("/fdps/:id", staffOnly, deleteFdp);

router.post("/faculty-internships", staffOnly, createFacultyInternship);
router.put("/faculty-internships/:id", staffOnly, updateFacultyInternship);
router.delete("/faculty-internships/:id", staffOnly, deleteFacultyInternship);

router.post("/consultancies", staffOnly, createConsultancy);
router.put("/consultancies/:id", staffOnly, updateConsultancy);
router.delete("/consultancies/:id", staffOnly, deleteConsultancy);

router.post("/research", staffOnly, createResearch);
router.put("/research/:id", staffOnly, updateResearch);
router.delete("/research/:id", staffOnly, deleteResearch);

// Applications
router.post("/:type/:id/apply", academicianOnly, async (req, res) => {
  const { type, id } = req.params;
  if (type === "fdps") return applyToFdp(req, res);
  if (type === "faculty-internships") return applyToFacultyInternship(req, res);
  if (type === "consultancies") return applyToConsultancy(req, res);
  if (type === "research") return applyToResearch(req, res);
  return res.status(400).json({ message: "Invalid opportunity type" });
});

router.get("/applications/me", academicianOnly, getMyAcademicianApplications);
router.get("/stats", staffOnly, getAcademicianStats);

export default router;

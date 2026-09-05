import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { applyToOpportunity, approveOpportunity, createOpportunity, listOpportunities, listPendingOpportunities } from "../controllers/opportunityController.js";

const router = express.Router();
router.use(protect);
router.get("/", listOpportunities);
router.get("/pending", adminOnly, listPendingOpportunities);
router.post("/", createOpportunity);
router.post("/:id/apply", applyToOpportunity);
router.patch("/:id/status", adminOnly, approveOpportunity);

export default router;
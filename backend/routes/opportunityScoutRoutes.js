import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Opportunity from "../models/OpportunityModel.js";
import { buildOpportunityScout } from "../services/opportunityScout.js";

const router = express.Router();

router.get("/matches", protect, async (req, res) => {
  try {
    const user = req.user;
    const student = {
      name: user.name,
      targetRole: user.targetRole || "Data Analyst",
      skills: user.skills || [],
      interests: user.interests || [],
      certifications: user.certifications || [],
      profileCompletion: user.profileCompletion || 0,
      preferredLocations: user.preferredLocations || [],
      skillProfile: user.skillProfile || {},
    };

    const opportunities = await Opportunity.find({ status: "approved", audience: { $in: ["student", "both"] } })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const result = buildOpportunityScout(student, opportunities);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to generate opportunity matches" });
  }
});

export default router;

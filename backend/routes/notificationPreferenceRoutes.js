import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getPreferences, updatePreferences, getEmailHistory } from "../controllers/notificationPreferenceController.js";

const router = express.Router();

router.use(protect);

router.get("/preferences", getPreferences);
router.put("/preferences", updatePreferences);
router.get("/email-history", getEmailHistory);

export default router;

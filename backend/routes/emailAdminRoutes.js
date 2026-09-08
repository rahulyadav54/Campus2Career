import express from "express";
import rateLimit from "express-rate-limit";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
  getEmailStats,
  listEmailLogs,
  listTemplates,
  getTemplate,
  updateTemplate,
  previewTemplate,
  sendTestEmail,
  getEmailConfig,
} from "../controllers/emailAdminController.js";

const router = express.Router();

const testEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many test emails. Try again later." },
});

router.use(protect, adminOnly);

router.get("/config", getEmailConfig);
router.get("/stats", getEmailStats);
router.get("/logs", listEmailLogs);
router.get("/templates", listTemplates);
router.get("/templates/:key", getTemplate);
router.put("/templates/:key", updateTemplate);
router.post("/templates/:key/preview", previewTemplate);
router.post("/test", testEmailLimiter, sendTestEmail);

export default router;

import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import NotificationService from "../services/notificationService.js";

const router = express.Router();

router.use(protect);

router.get("/me", async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === "true";
    const data = await NotificationService.getUserNotifications(req.user._id, { page, limit, unreadOnly });
    res.json(data);
  } catch (e) { next(e); }
});

router.get("/me/unread-count", async (req, res, next) => {
  try {
    const count = await NotificationService.getUserNotifications(req.user._id, { page: 1, limit: 1, unreadOnly: true });
    res.json({ unreadCount: count.unreadCount });
  } catch (e) { next(e); }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    await NotificationService.markAsRead(req.params.id, req.user._id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.post("/read-all", async (req, res, next) => {
  try {
    await NotificationService.markAllAsRead(req.user._id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;

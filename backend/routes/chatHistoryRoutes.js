import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getChatHistories,
  getChatHistory,
  createChatHistory,
  updateChatHistory,
  deleteChatHistory,
  clearAllChatHistories,
} from "../controllers/chatHistoryController.js";

const router = express.Router();
router.use(protect);

router.get("/", getChatHistories);
router.post("/", createChatHistory);
router.get("/:id", getChatHistory);
router.put("/:id", updateChatHistory);
router.delete("/:id", deleteChatHistory);
router.delete("/", clearAllChatHistories);

export default router;

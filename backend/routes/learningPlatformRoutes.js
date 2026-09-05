import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { listPlatforms, getPlatform, createPlatform, updatePlatform, deletePlatform } from "../controllers/learningPlatformController.js";

const router = express.Router();

router.get("/", listPlatforms);
router.get("/:id", getPlatform);

router.post("/", protect, adminOnly, createPlatform);
router.put("/:id", protect, adminOnly, updatePlatform);
router.delete("/:id", protect, adminOnly, deletePlatform);

export default router;

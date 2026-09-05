import express from "express";
import { adminOnly, institutionOnly, staffOnly } from "../middleware/authMiddleware.js";
import { listPlatforms, getPlatform, createPlatform, updatePlatform, deletePlatform } from "../controllers/learningPlatformController.js";

const router = express.Router();

router.get("/", listPlatforms);
router.get("/:id", getPlatform);

router.post("/", staffOnly, createPlatform);
router.put("/:id", staffOnly, updatePlatform);
router.delete("/:id", staffOnly, deletePlatform);

export default router;

import express from "express";
import { streamEvents } from "../controllers/realtimeController.js";

const router = express.Router();
router.get("/events", streamEvents);

export default router;
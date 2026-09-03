import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { addPortfolioItem, getPortfolio, verifyPortfolioItem } from "../controllers/portfolioController.js";

const router = express.Router();
router.use(protect);
router.get("/me", getPortfolio);
router.get("/:userId", getPortfolio);
router.post("/", addPortfolioItem);
router.patch("/:id/verify", adminOnly, verifyPortfolioItem);

export default router;
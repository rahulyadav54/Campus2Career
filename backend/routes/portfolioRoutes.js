import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { addPortfolioItem, getPortfolio, getPendingPortfolioItems, verifyPortfolioItem } from "../controllers/portfolioController.js";
import { validatePortfolioItem } from "../middleware/validate.js";

const router = express.Router();
router.use(protect);
router.get("/pending", adminOnly, getPendingPortfolioItems);
router.get("/me", getPortfolio);
router.get("/:userId", getPortfolio);
router.post("/", validatePortfolioItem, addPortfolioItem);
router.patch("/:id/verify", adminOnly, verifyPortfolioItem);

export default router;
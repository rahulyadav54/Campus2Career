// routes/authRoutes.js
import express from "express";
import { registerStudent, register, login, refreshToken, getProfile, updateProfile, checkEmail } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateLogin, validateRegister } from "../middleware/validate.js";

const router = express.Router();

// Add check-email route
router.get("/check-email/:email", checkEmail);
router.post("/register-student", validateRegister, registerStudent);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/refresh", protect, refreshToken);
router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, updateProfile);

export default router;

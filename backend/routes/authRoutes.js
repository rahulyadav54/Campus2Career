import express from "express";
import { registerStudent, register, login, refreshToken, getProfile, updateProfile, checkEmail, changePassword, logout, forgotPassword, listSessions, revokeSession, revokeOtherSessions } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validateLogin, validateRegister } from "../middleware/validate.js";

const router = express.Router();

router.get("/check-email/:email", checkEmail);
router.post("/register-student", validateRegister, registerStudent);
router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.post("/forgot-password", forgotPassword);
router.post("/refresh", refreshToken);
router.get("/profile", protect, getProfile);
router.put("/update-profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);
router.post("/logout", protect, logout);
router.get("/sessions", protect, listSessions);
router.delete("/sessions/:sessionId", protect, revokeSession);
router.post("/sessions/revoke-others", protect, revokeOtherSessions);

export default router;

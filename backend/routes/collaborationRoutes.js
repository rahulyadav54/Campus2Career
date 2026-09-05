import express from "express";
import { protect, adminOnly, institutionOnly, staffOnly, studentOnly } from "../middleware/authMiddleware.js";
import {
  listWorkshops, listGuestLectures, listChallenges, listProjects,
  createWorkshop, createGuestLecture, createChallenge, createProject,
  updateWorkshop, updateGuestLecture, updateChallenge, updateProject,
  deleteWorkshop, deleteGuestLecture, deleteChallenge, deleteProject,
  registerForWorkshop, registerForGuestLecture, registerForChallenge, applyToProject,
  getMyCollaborations, getCollaborationStats
} from "../controllers/collaborationController.js";

const router = express.Router();

router.use(protect);

// Public listings
router.get("/workshops", listWorkshops);
router.get("/guest-lectures", listGuestLectures);
router.get("/challenges", listChallenges);
router.get("/projects", listProjects);

// Admin/institution management
router.post("/workshops", staffOnly, createWorkshop);
router.put("/workshops/:id", staffOnly, updateWorkshop);
router.delete("/workshops/:id", staffOnly, deleteWorkshop);

router.post("/guest-lectures", staffOnly, createGuestLecture);
router.put("/guest-lectures/:id", staffOnly, updateGuestLecture);
router.delete("/guest-lectures/:id", staffOnly, deleteGuestLecture);

router.post("/challenges", staffOnly, createChallenge);
router.put("/challenges/:id", staffOnly, updateChallenge);
router.delete("/challenges/:id", staffOnly, deleteChallenge);

router.post("/projects", staffOnly, createProject);
router.put("/projects/:id", staffOnly, updateProject);
router.delete("/projects/:id", staffOnly, deleteProject);

// Student registration/apply actions
router.post("/:type/:id/register", studentOnly, async (req, res) => {
  const { type, id } = req.params;
  if (type === "workshops") return registerForWorkshop(req, res);
  if (type === "guest-lectures") return registerForGuestLecture(req, res);
  if (type === "challenges") return registerForChallenge(req, res);
  if (type === "projects") return applyToProject(req, res);
  return res.status(400).json({ message: "Invalid collaboration type" });
});

router.get("/my-collaborations", studentOnly, getMyCollaborations);
router.get("/stats", staffOnly, getCollaborationStats);

export default router;

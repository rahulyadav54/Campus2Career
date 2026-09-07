import User from "../models/UserModel.js";
import CareerMission from "../models/CareerMission.js";
import AIAutomationLog from "../models/AIAutomationLog.js";
import Course from "../models/Course.js";
import Workshop from "../models/Workshop.js";
import { dispatchAIRequest, getRecentAILogs, getOrchestratorOverview, buildCareerMission } from "../services/aiOrchestrator.js";
import { analyzeResumeForRole, generateMockInterviewPlan } from "../services/resumeInterviewAgent.js";
import { buildRecruiterShortlist } from "../services/recruiterIntelligenceAgent.js";
import { calculatePlacementReadiness, buildReadinessSummary } from "../services/placementReadinessAgent.js";
import { generateInstitutionInsights } from "../services/institutionInsightsAgent.js";
import { getRequiredSkillsForRole } from "../services/roleSkillMap.js";
import { protect, studentOnly, adminOnly } from "../middleware/authMiddleware.js";

export const orchestrateCareerRequest = async (req, res) => {
  try {
    const payload = req.body || {};
    const targetRole = String(payload.targetRole || req.user?.targetRole || "").trim();

    if (!targetRole && req.user?.role !== "student") {
      return res.status(400).json({ message: "A target role is required for orchestration." });
    }

    const result = await dispatchAIRequest({
      user: req.user,
      payload: {
        ...payload,
        targetRole: targetRole || payload.targetRole || "",
        action: payload.action || payload.intent || "career_planning",
        intent: payload.intent || payload.action || "career_planning",
      },
    });

    return res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "AI orchestration failed",
    });
  }
};

export const getMyCareerMission = async (req, res) => {
  try {
    const mission = await CareerMission.findOne({ student: req.user._id, isActive: true }).sort({ updatedAt: -1 }).lean();
    if (!mission) {
      const student = await User.findById(req.user._id).select("skills targetRole interests profileCompletion skillProfile");
      const generated = buildCareerMission(student?.toObject?.() || {}, student?.targetRole || "");
      return res.json({ success: true, mission: generated, created: false });
    }
    return res.json({ success: true, mission, created: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load mission" });
  }
};

export const generateCareerMissionForStudent = async (req, res) => {
  try {
    const { studentId, targetRole } = req.body || {};
    const resolvedStudentId = studentId || req.user?._id;
    const student = await User.findById(resolvedStudentId).select("skills targetRole interests profileCompletion skillProfile department cgpa name");

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const resolvedTargetRole = String(targetRole || student.targetRole || "").trim();
    if (resolvedTargetRole && student.targetRole !== resolvedTargetRole) {
      student.targetRole = resolvedTargetRole;
      await student.save();
    }

    const mission = buildCareerMission(student.toObject(), resolvedTargetRole);
    const saved = await CareerMission.findOneAndUpdate(
      { student: student._id },
      { $set: { ...mission, student: student._id, lastAnalyzedAt: new Date() } },
      { upsert: true, new: true }
    );

    return res.json({ success: true, mission: saved, created: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to generate mission" });
  }
};

export const getAICommandCenter = async (req, res) => {
  try {
    const overview = await getOrchestratorOverview();
    const logs = await getRecentAILogs({ user: req.user, limit: 8 });
    return res.json({ success: true, overview, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load command center" });
  }
};

export const getAILogs = async (req, res) => {
  try {
    const logs = await getRecentAILogs({ user: req.user, limit: 50 });
    return res.json({ success: true, logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load AI logs" });
  }
};

export const getAIOverviewForAdmin = async (req, res) => {
  try {
    const overview = await getOrchestratorOverview();
    return res.json({ success: true, overview });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load AI overview" });
  }
};

export const getResumeIntelligence = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills targetRole certifications projects name");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    const targetRole = String(req.query.targetRole || student.targetRole || "").trim();
    const analysis = analyzeResumeForRole(student.toObject(), targetRole, "Python, SQL, dashboarding, reporting, and stakeholder communication");
    return res.json({ success: true, analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to analyze resume" });
  }
};

export const getMockInterviewPlan = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills targetRole name");
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    const targetRole = String(req.query.targetRole || student.targetRole || "").trim();
    const plan = generateMockInterviewPlan(student.toObject(), targetRole, req.query.type || "mixed");
    return res.json({ success: true, plan });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to generate interview plan" });
  }
};

export const getInterviewMaterials = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("targetRole skills").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const targetRole = String(req.query.targetRole || student.targetRole || "Data Analyst").trim() || "Data Analyst";
    const roleSkills = getRequiredSkillsForRole(targetRole) || [];
    const searchSkills = [...new Set([...roleSkills.slice(0, 8), ...(student.skills || [])])];

    const [courses, workshops] = await Promise.all([
      Course.find({ status: "published", skills: { $in: searchSkills } })
        .select("title description provider platform skills duration level externalUrl rating isFree")
        .sort({ rating: -1, createdAt: -1 })
        .limit(6)
        .lean(),
      Workshop.find({ status: "published", skills: { $in: searchSkills }, date: { $gte: new Date() } })
        .select("title description organizer date time mode skills")
        .sort({ date: 1 })
        .limit(4)
        .lean(),
    ]);

    const databaseMaterials = [
      ...courses.map((course) => ({
        type: "course",
        title: course.title,
        description: course.description,
        provider: course.provider || course.platform,
        duration: course.duration || "Self-paced",
        level: course.level || "beginner",
        url: course.externalUrl,
        skills: course.skills || [],
        isFree: course.isFree,
        source: "Campus2Career courses",
      })),
      ...workshops.map((workshop) => ({
        type: "workshop",
        title: workshop.title,
        description: workshop.description,
        provider: workshop.organizer,
        duration: `${workshop.mode || "online"} · ${new Date(workshop.date).toLocaleDateString()}`,
        level: "live session",
        url: "",
        skills: workshop.skills || [],
        isFree: true,
        source: "Campus2Career workshops",
      })),
    ];

    const fallbackMaterials = [
      {
        type: "guide",
        title: `Interview questions for ${targetRole}`,
        description: "Practice role-specific technical and behavioral questions with model evaluation points.",
        provider: "Campus2Career AI",
        duration: "Practice set",
        level: "all levels",
        url: `/student/interview-preparation?targetRole=${encodeURIComponent(targetRole)}`,
        skills: roleSkills.slice(0, 5),
        isFree: true,
        source: "Generated for your target role",
      },
      {
        type: "guide",
        title: "STAR method interview guide",
        description: "Use Situation, Task, Action, and Result to turn project and internship experiences into clear answers.",
        provider: "Indeed Career Guide",
        duration: "10 minute read",
        level: "all levels",
        url: "https://www.indeed.com/career-advice/interviewing/star-interview-method",
        skills: ["Communication", "Behavioral interviews"],
        isFree: true,
        source: "Public learning resource",
      },
      {
        type: "guide",
        title: `${targetRole} interview preparation`,
        description: "Review common questions, role expectations, and preparation advice before your interview.",
        provider: "Coursera Career Guide",
        duration: "Preparation guide",
        level: "all levels",
        url: `https://www.coursera.org/articles/${encodeURIComponent(targetRole.toLowerCase().replace(/\s+/g, "-"))}-interview-questions`,
        skills: roleSkills.slice(0, 5),
        isFree: true,
        source: "Public learning resource",
      },
    ];

    return res.json({
      success: true,
      targetRole,
      materials: [...databaseMaterials, ...fallbackMaterials].slice(0, 8),
      sourceSummary: { courses: courses.length, workshops: workshops.length },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to load interview materials" });
  }
};

export const getRecruiterShortlist = async (req, res) => {
  try {
    const role = String(req.query.targetRole || "").trim();
    const minScore = Number(req.query.minScore || 70);
    const candidates = await User.find({ role: "student" }).select("name skills targetRole cgpa profileCompletion projects experiences certifications").limit(50).lean();
    const shortlist = buildRecruiterShortlist(candidates, role, { minScore });
    return res.json({ success: true, shortlist });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to build recruiter shortlist" });
  }
};

export const getPlacementReadiness = async (req, res) => {
  try {
    const studentId = req.query.studentId || req.user?._id;
    if (!studentId) return res.status(400).json({ success: false, message: "Student ID is required" });

    const student = await User.findById(studentId).select("name skills targetRole cgpa profileCompletion projects experiences certifications").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    const readiness = calculatePlacementReadiness(student, student.targetRole || "");
    const cohort = await User.find({ role: "student" }).select("name skills targetRole cgpa profileCompletion projects experiences certifications").limit(20).lean();
    const summary = buildReadinessSummary(cohort);

    return res.json({ success: true, readiness, cohortSummary: summary });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to calculate placement readiness" });
  }
};

export const getInstitutionInsights = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("name department skills targetRole cgpa profileCompletion projects experiences certifications").limit(100).lean();
    const insights = generateInstitutionInsights({ students, term: "Current institution placement cycle" });
    return res.json({ success: true, insights });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to generate institution insights" });
  }
};

export default {
  orchestrateCareerRequest,
  getMyCareerMission,
  generateCareerMissionForStudent,
  getAICommandCenter,
  getAILogs,
  getAIOverviewForAdmin,
  getResumeIntelligence,
  getMockInterviewPlan,
  getRecruiterShortlist,
  getPlacementReadiness,
  getInstitutionInsights,
};

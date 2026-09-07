import User from "../models/UserModel.js";
import { evaluateSkillGap } from "../services/skillGapEngine.js";
import { logSuccess, logFailed } from "../services/aiLogger.js";

export const getSkillGapAnalysis = async (req, res) => {
  try {
    const student = await User.findById(req.user._id).select("skills targetRole skillProfile certifications projects department cgpa");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const targetRole = String(req.query.targetRole || student.targetRole || "Data Analyst").trim();
    const analysis = evaluateSkillGap(student.toObject(), targetRole);

    await logSuccess({
      user: student._id,
      agent: "skill_gap_agent",
      action: "skill_gap_analysis",
      input: { targetRole },
      output: analysis,
      confidence: analysis.skillCoverage,
      sourceData: {
        role: targetRole,
        skills: student.skills,
        strengths: student.skillProfile?.strengths || [],
      },
    });

    return res.json({ success: true, analysis });
  } catch (error) {
    await logFailed({
      user: req.user?._id || null,
      agent: "skill_gap_agent",
      action: "skill_gap_analysis",
      input: { targetRole: req.query.targetRole || "" },
      errorMessage: error.message,
    });
    return res.status(500).json({ success: false, message: error.message || "Unable to analyze skill gaps" });
  }
};

export const getSkillGapAnalysisForStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.studentId).select("skills targetRole skillProfile certifications projects department cgpa");
    if (!student) return res.status(404).json({ message: "Student not found" });

    const targetRole = String(req.query.targetRole || student.targetRole || "Data Analyst").trim();
    const analysis = evaluateSkillGap(student.toObject(), targetRole);
    return res.json({ success: true, analysis });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Unable to analyze student gaps" });
  }
};

export default {
  getSkillGapAnalysis,
  getSkillGapAnalysisForStudent,
};

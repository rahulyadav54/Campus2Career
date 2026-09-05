import SkillAssessment from "../models/SkillAssessmentModel.js";
import User from "../models/UserModel.js";
import LearningResource from "../models/LearningResourceModel.js";

const getLearningRecommendations = async (gaps) => {
  if (!gaps.length) return [];
  const resources = await LearningResource.find({
    skills: { $in: gaps.map((g) => new RegExp(g, "i")) },
    isActive: true
  }).limit(gaps.length * 2).select("title provider type url skills level isFree durationHours");
  if (resources.length) return resources.map((r) => ({
    resourceId: r._id,
    title: r.title,
    provider: r.provider,
    type: r.type,
    url: r.url,
    skills: r.skills,
    level: r.level,
    isFree: r.isFree,
    durationHours: r.durationHours
  }));
  return [];
};

export const submitAssessment = async (req, res) => {
  try {
    const { responses = [], interests = [] } = req.body;
    if (!Array.isArray(responses) || responses.length === 0) {
      return res.status(400).json({ message: "At least one assessment response is required" });
    }

    const strengths = responses.filter((item) => Number(item.score) >= 70).map((item) => item.skill);
    const gaps = responses.filter((item) => Number(item.score) < 60).map((item) => item.skill);
    const assessment = await SkillAssessment.create({
      student: req.user._id,
      responses,
      interests,
      strengths: [...new Set(strengths)],
      gaps: [...new Set(gaps)],
      learningRecommendations: await getLearningRecommendations([...new Set(gaps)])
    });

    await User.findByIdAndUpdate(req.user._id, {
      interests,
      "skillProfile.strengths": assessment.strengths,
      "skillProfile.gaps": assessment.gaps,
      "skillProfile.lastAssessedAt": assessment.completedAt
    });

    res.status(201).json({ assessment });
  } catch (error) {
    res.status(500).json({ message: "Unable to save assessment", error: error.message });
  }
};

export const getMyAssessments = async (req, res) => {
  try {
    const assessments = await SkillAssessment.find({ student: req.user._id }).sort({ completedAt: -1 });
    res.json({ assessments });
  } catch (error) {
    res.status(500).json({ message: "Unable to load assessments", error: error.message });
  }
};

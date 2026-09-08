import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import Job from "../models/JobModel.js";
import InterviewSession from "../models/InterviewSession.js";
import User from "../models/UserModel.js";
import { evaluateSkillGap } from "./skillGapEngine.js";
import { RECOMMENDATION_WEIGHTS } from "../constants/courseCategories.js";

const normalize = (v) => String(v || "").trim().toLowerCase();
const token = (v) => normalize(v).replace(/[^a-z0-9]/g, "");

const skillMatch = (courseSkills = [], targetSkills = []) => {
  if (!targetSkills.length) return 0;
  const courseTokens = courseSkills.map(token).filter(Boolean);
  let hits = 0;
  for (const skill of targetSkills) {
    const t = token(skill);
    if (courseTokens.some((c) => c === t || c.includes(t) || t.includes(c))) hits += 1;
  }
  return hits / targetSkills.length;
};

const difficultyFit = (courseLevel, studentLevel = "beginner") => {
  const order = { beginner: 0, intermediate: 1, advanced: 2 };
  const diff = Math.abs((order[courseLevel] ?? 0) - (order[studentLevel] ?? 0));
  return diff === 0 ? 1 : diff === 1 ? 0.7 : 0.4;
};

async function getJobRequiredSkills(userId) {
  const jobs = await Job.find({ status: "approved" })
    .select("skills title")
    .limit(50)
    .lean();
  const saved = new Set();
  for (const job of jobs) {
    for (const s of job.skills || []) saved.add(normalize(s));
  }
  return [...saved];
}

async function getInterviewWeakSkills(userId) {
  const sessions = await InterviewSession.find({
    user: userId,
    status: "completed",
  })
    .sort({ completedAt: -1 })
    .limit(5)
    .select("skillGapContext feedback")
    .lean();

  const weak = new Map();
  for (const session of sessions) {
    for (const skill of session.skillGapContext?.missingSkills || []) {
      weak.set(normalize(skill), (weak.get(normalize(skill)) || 0) + 1);
    }
    const topics = session.feedback?.topicsToPractice || session.feedback?.weakAreas || [];
    for (const topic of topics) {
      const key = normalize(typeof topic === "string" ? topic : topic?.skill || topic?.topic);
      if (key) weak.set(key, (weak.get(key) || 0) + 1);
    }
  }
  return [...weak.entries()]
    .filter(([, count]) => count >= 2)
    .map(([skill]) => skill);
}

function buildReason({ course, gapSkills, roleName, jobSkills, interviewSkills }) {
  const courseSkillHits = (course.skills || []).filter((s) =>
    gapSkills.some((g) => token(g) === token(s) || token(g).includes(token(s)))
  );
  if (courseSkillHits.length && gapSkills.length) {
    return `Recommended because ${courseSkillHits.slice(0, 2).join(" and ")} ${courseSkillHits.length > 1 ? "are" : "is"} required for your target role${roleName ? ` (${roleName})` : ""} and ${courseSkillHits.length > 1 ? "are" : "is"} currently missing from your profile.`;
  }
  const jobHit = (course.skills || []).find((s) => jobSkills.includes(normalize(s)));
  if (jobHit) {
    return `Recommended because ${jobHit} appears in job requirements matching your interests and may strengthen your preparation.`;
  }
  const interviewHit = (course.skills || []).find((s) => interviewSkills.includes(normalize(s)));
  if (interviewHit) {
    return `Recommended based on repeated interview feedback suggesting improvement in ${interviewHit}.`;
  }
  if (roleName && (course.targetRoles || []).some((r) => token(r) === token(roleName))) {
    return `This course aligns with your target role as ${roleName} and may help strengthen your preparation for this path.`;
  }
  return `This course may help strengthen skills relevant to your career goals. It does not guarantee employment outcomes.`;
}

export async function getCourseRecommendations(userId, { limit = 12, jobId = null } = {}) {
  const user = await User.findById(userId).lean();
  if (!user) return [];

  const gap = evaluateSkillGap(user, user.targetRole);
  const gapSkills = gap.missingSkills || [];

  let jobSkills = await getJobRequiredSkills(userId);
  if (jobId) {
    const job = await Job.findById(jobId).select("skills title").lean();
    if (job?.skills?.length) jobSkills = job.skills.map(normalize);
  }

  const interviewSkills = await getInterviewWeakSkills(userId);

  const enrollments = await CourseEnrollment.find({ student: userId }).select("course status").lean();
  const completedIds = new Set(
    enrollments.filter((e) => e.status === "completed").map((e) => String(e.course))
  );
  const enrolledIds = new Set(enrollments.map((e) => String(e.course)));

  const courses = await Course.find({ status: "published" }).lean();
  const weights = RECOMMENDATION_WEIGHTS;

  const scored = courses
    .filter((c) => !completedIds.has(String(c._id)))
    .map((course) => {
      const skillGapScore = skillMatch(course.skills, gapSkills);
      const roleScore = user.targetRole
        ? skillMatch(course.skills, gapSkills) +
          ((course.targetRoles || []).some((r) => token(r) === token(user.targetRole)) ? 0.5 : 0)
        : 0;
      const jobScore = skillMatch(course.skills, jobSkills);
      const diffScore = difficultyFit(course.level, user.experienceLevel || "beginner");
      const historyPenalty = enrolledIds.has(String(course._id)) ? 0.3 : 1;

      const relevance = (
        skillGapScore * weights.skill_gap_match +
        Math.min(roleScore, 1) * weights.role_match +
        jobScore * weights.job_match +
        diffScore * weights.difficulty_fit
      ) * (1 - weights.learning_history + weights.learning_history * historyPenalty);

      const reason = buildReason({
        course,
        gapSkills,
        roleName: user.targetRole,
        jobSkills,
        interviewSkills,
      });

      return {
        course,
        relevanceScore: Math.round(Math.min(relevance, 1) * 100),
        reason,
        whyThisCourse: reason,
        matchedSkills: (course.skills || []).filter((s) =>
          gapSkills.some((g) => token(g) === token(s))
        ),
        source: gapSkills.length ? "skill_gap" : jobSkills.length ? "job" : "role",
      };
    })
    .filter((item) => item.relevanceScore >= 15)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit);

  return scored;
}

export async function getSkillGapCourses(userId, { limit = 10 } = {}) {
  const recs = await getCourseRecommendations(userId, { limit });
  return recs.filter((r) => r.matchedSkills?.length > 0);
}

export default { getCourseRecommendations, getSkillGapCourses };

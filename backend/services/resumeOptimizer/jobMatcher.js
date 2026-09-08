import Job from "../../models/JobModel.js";
import { calculateJobMatch } from "../jobMatchingService.js";
import { analyzeATS } from "./atsAnalyzer.js";
import { extractSkillsFromContent, resumeContentToText } from "./resumeSchema.js";

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

/**
 * Match resume + profile against a job description or job record.
 */
export const matchJob = (content, student = {}, job = {}, jobDescription = "") => {
  const jd = jobDescription || job.description || "";
  const resumeSkills = extractSkillsFromContent(content);
  const studentForMatch = {
    ...student,
    skills: [...new Set([...(student.skills || []), ...resumeSkills])],
  };

  const baseMatch = calculateJobMatch(studentForMatch, {
    skillsRequired: job.skillsRequired || [],
    location: job.location || "",
  });

  const ats = analyzeATS(content, { jobDescription: jd, targetRole: job.title || student.targetRole });

  const resumeText = resumeContentToText(content).toLowerCase();
  const projectMatch = (content.projects || []).length > 0
    ? clamp(60 + (content.projects || []).filter((p) =>
      (p.technologies || []).some((t) => jd.toLowerCase().includes(t.toLowerCase()))
    ).length * 10)
    : 40;

  const educationMatch = (content.education || []).length > 0 ? 85 : 50;
  const experienceMatch = (content.experience || []).length > 0 ? 75 : 45;

  const estimatedMatch = clamp(Math.round(
    (baseMatch.skillScore * 0.35)
    + (ats.breakdown.keywordMatch * 0.25)
    + (projectMatch * 0.15)
    + (educationMatch * 0.1)
    + (experienceMatch * 0.15)
  ));

  return {
    estimatedLabel: "Estimated Profile Match",
    estimatedMatch,
    jobTitle: job.title || "",
    company: job.company || job.recruiterName || "",
    location: job.location || "",
    employmentType: job.employmentType || job.type || "",
    experienceLevel: job.experienceLevel || "",
    breakdown: {
      skillsMatch: baseMatch.skillScore,
      educationMatch,
      experienceMatch,
      projectMatch,
      keywordMatch: ats.breakdown.keywordMatch,
    },
    matchedSkills: baseMatch.matchedSkills,
    missingSkills: baseMatch.missingSkills,
    matchedKeywords: ats.matchedKeywords,
    missingKeywords: ats.missingKeywords,
    suggestions: ats.suggestions,
    disclaimer: "Potential match based on your current profile — not a guarantee of employment.",
    whyMatch: baseMatch.matchedSkills.length
      ? `Your resume includes ${baseMatch.matchedSkills.length} skills that align with this role.`
      : "Limited skill overlap detected — review missing skills below.",
  };
};

/**
 * Find matching jobs from database for a student + resume.
 */
export const findMatchingJobs = async (content, student = {}, limit = 10) => {
  const jobs = await Job.find({ isActive: true, status: "approved" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const matches = jobs
    .map((job) => ({
      job,
      match: matchJob(content, student, job),
    }))
    .sort((a, b) => b.match.estimatedMatch - a.match.estimatedMatch)
    .slice(0, limit);

  return matches.map(({ job, match }) => ({
    jobId: job._id,
    title: job.title,
    company: job.company || "",
    location: job.location || "",
    skillsRequired: job.skillsRequired || [],
    estimatedMatch: match.estimatedMatch,
    breakdown: match.breakdown,
    matchedSkills: match.matchedSkills,
    missingSkills: match.missingSkills,
    disclaimer: match.disclaimer,
  }));
};

export default { matchJob, findMatchingJobs };

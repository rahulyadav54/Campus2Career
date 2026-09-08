import { evaluateSkillGap } from "../skillGapEngine.js";
import { extractSkillsFromContent } from "./resumeSchema.js";

/**
 * Skill gap analysis combining resume content + student profile.
 */
export const analyzeSkillGaps = (content, student = {}, targetRole = "") => {
  const resumeSkills = extractSkillsFromContent(content);
  const mergedStudent = {
    ...student,
    skills: [...new Set([...(student.skills || []), ...resumeSkills])],
    targetRole: targetRole || student.targetRole || "",
  };

  const gap = evaluateSkillGap(mergedStudent, mergedStudent.targetRole);

  const learningPath = (gap.missingSkills || []).slice(0, 6).map((skill, i) => ({
    order: i + 1,
    skill,
    reason: gap.recommendations?.find((r) => r.skill === skill)?.why
      || `Important for ${mergedStudent.targetRole || "your target role"}`,
  }));

  const recommendedProjects = (gap.missingSkills || []).slice(0, 3).map((skill) => ({
    label: "Recommended project",
    title: `Practice project: ${skill}`,
    description: `Build a small project that demonstrates your ${skill} skills. Document it on your resume only after you complete it.`,
    skills: [skill],
    disclaimer: "This is a suggested project — not something you have already completed.",
  }));

  return {
    targetRole: gap.targetRole,
    currentSkills: gap.strongSkills,
    skillsToStrengthen: gap.missingSkills,
    skillCoverage: gap.skillCoverage,
    learningPath,
    recommendedProjects,
    recommendations: gap.recommendations,
    why: gap.why,
  };
};

export default { analyzeSkillGaps };

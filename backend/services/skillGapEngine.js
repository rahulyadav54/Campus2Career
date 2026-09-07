import { getRequiredSkillsForRole } from "./roleSkillMap.js";

const normalizeSkill = (value) => String(value || "").trim().toLowerCase();
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
const normalizeToken = (value) => normalizeSkill(value).replace(/[^a-z0-9]/g, "");

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const scoreSkillConfidence = (studentSkill, requiredSkill) => {
  const student = normalizeToken(studentSkill);
  const required = normalizeToken(requiredSkill);

  if (!student || !required) return 0;
  if (student === required) return 100;
  if (student.includes(required) || required.includes(student)) return 85;
  return 0;
};

const extractProjectSkills = (projects = []) => {
  const techs = [];
  for (const project of Array.isArray(projects) ? projects : []) {
    const item = project?.technologies || project?.skills || [];
    techs.push(...normalizeList(item));
  }
  return techs;
};

export const evaluateSkillGap = (student = {}, targetRole = "") => {
  const roleName = String(targetRole || student.targetRole || "").trim() || "Data Analyst";
  const requiredSkills = getRequiredSkillsForRole(roleName) || [];

  const studentSkills = normalizeList([
    ...(student.skills || []),
    ...(student.skillProfile?.strengths || []),
    ...extractProjectSkills(student.projects || []),
    ...(student.certifications || []).map((c) => (typeof c === "string" ? c : c?.name || "")),
  ]).map((skill) => normalizeSkill(skill));

  const prioritySkills = requiredSkills
    .map((skill) => String(skill).trim())
    .slice(0, Math.min(requiredSkills.length, 8));

  const strongSkills = prioritySkills.filter((skill) =>
    studentSkills.some((studentSkill) => scoreSkillConfidence(studentSkill, skill) > 0)
  );

  const missingSkills = prioritySkills.filter((skill) => !studentSkills.some((studentSkill) => scoreSkillConfidence(studentSkill, skill) > 0));

  const coverage = prioritySkills.length
    ? clamp(Math.round((strongSkills.length / prioritySkills.length) * 100))
    : 0;

  const recommendations = prioritySkills
    .filter((skill) => missingSkills.includes(skill))
    .slice(0, 5)
    .map((skill) => ({
      skill,
      reason: `${skill} is a core requirement in ${roleName} and is currently missing from the student’s priority skill set.`,
      priority: "high",
      why: `This recommendation is generated because ${skill} appears in the role’s core skill map and is needed for better alignment with ${roleName} roles.`,
    }));

  return {
    targetRole: roleName,
    skillCoverage: coverage,
    strongSkills,
    missingSkills,
    recommendations,
    why: `Skill coverage was calculated by comparing the student's current profile to the ${roleName} role’s core skill priorities and identifying the biggest remaining gaps.`,
  };
};

export const summarizeSkillGap = (student = {}, targetRole = "") => {
  const result = evaluateSkillGap(student, targetRole);
  return {
    ...result,
    prioritySkills: result.missingSkills.slice(0, 5),
    confidence: result.skillCoverage >= 70 ? 86 : 74,
  };
};

export default {
  evaluateSkillGap,
  summarizeSkillGap,
};

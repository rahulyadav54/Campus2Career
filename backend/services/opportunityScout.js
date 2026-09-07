import { getRequiredSkillsForRole } from "./roleSkillMap.js";

const normalizeSkill = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const skillCoverage = (studentSkills = [], opportunitySkills = []) => {
  const s = normalizeList(studentSkills).map(normalizeSkill);
  const o = normalizeList(opportunitySkills).map(normalizeSkill);
  const matched = o.filter((skill) => s.includes(skill) || s.some((studentSkill) => studentSkill.includes(skill) || skill.includes(studentSkill)));
  return o.length ? (matched.length / o.length) * 100 : 0;
};

const scoreOpportunity = (student, opportunity) => {
  const studentSkills = normalizeList([
    ...(student.skills || []),
    ...(student.skillProfile?.strengths || []),
    ...(student.certifications || []).map((cert) => cert?.name || cert),
  ]).map(normalizeSkill);

  const requiredSkills = normalizeList(opportunity.requiredSkills || getRequiredSkillsForRole(student.targetRole || "") || []);
  const coverage = skillCoverage(studentSkills, requiredSkills);
  const roleMatch = String(student.targetRole || "").trim() && String(opportunity.title || "").toLowerCase().includes(String(student.targetRole || "").trim().toLowerCase()) ? 15 : 0;
  const profileBoost = Number(student.profileCompletion || 0) / 10;
  const interestBoost = (student.interests || []).some((interest) => {
    const label = String(interest || "").toLowerCase();
    return String(opportunity.title || "").toLowerCase().includes(label) || String(opportunity.description || "").toLowerCase().includes(label);
  }) ? 10 : 0;
  const preferredLocation = student.preferredLocations || [];
  const locationBoost = preferredLocation.length
    ? (opportunity.location || "").toLowerCase().includes("remote") && preferredLocation.some((loc) => String(loc).toLowerCase().includes("remote"))
      ? 8
      : 0
    : 0;

  const score = clamp(Math.round(coverage + roleMatch + profileBoost + interestBoost + locationBoost));

  return {
    ...opportunity,
    matchScore: score,
    matchedSkills: requiredSkills.filter((skill) => studentSkills.some((studentSkill) => studentSkill === normalizeSkill(skill) || studentSkill.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(studentSkill))),
    missingSkills: requiredSkills.filter((skill) => !studentSkills.some((studentSkill) => studentSkill === normalizeSkill(skill) || studentSkill.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(studentSkill))),
  };
};

export const buildOpportunityScout = (student = {}, opportunities = []) => {
  const ranked = (Array.isArray(opportunities) ? opportunities : [])
    .map((opportunity) => scoreOpportunity(student, opportunity))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const recommendations = ranked.flatMap((opportunity) => {
    const skills = opportunity.missingSkills.slice(0, 2);
    return skills.map((skill) => ({
      skill,
      reason: `${opportunity.title} is a strong fit, but ${skill} would boost your match score for this role.`,
      opportunityId: opportunity._id || opportunity.id || null,
    }));
  });

  return {
    studentName: student.name || "Student",
    targetRole: student.targetRole || "Data Analyst",
    matches: ranked,
    recommendations: recommendations.slice(0, 6),
    explanation: "Opportunities are ranked by skill overlap, role alignment, profile completeness, and keyword match to the student’s stated interests.",
  };
};

export const matchStudentOpportunities = (student = {}, opportunities = []) => {
  const scout = buildOpportunityScout(student, opportunities);
  return scout.matches;
};

export default {
  buildOpportunityScout,
  matchStudentOpportunities,
};

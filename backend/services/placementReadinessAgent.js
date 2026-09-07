const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const normalizeSkill = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const roleSkillMap = {
  "Data Analyst": ["python", "sql", "excel", "power bi", "tableau", "statistics", "dashboard", "reporting"],
  "Data Scientist": ["python", "sql", "statistics", "machine learning", "pandas", "tableau"],
  "Full Stack Developer": ["javascript", "react", "node", "node.js", "api", "database", "git", "mongodb"],
  "Product Manager": ["agile", "roadmap", "stakeholder", "requirements", "strategy"],
};

const scoreSkillCoverage = (student = {}, role = "Data Analyst") => {
  const requiredSkills = roleSkillMap[role] || roleSkillMap["Data Analyst"];
  const studentSkills = normalizeList([
    ...(student.skills || []),
    ...(student.certifications || []).map((cert) => cert?.name || cert),
    ...(student.projects || []).flatMap((project) => project?.technologies || []),
  ]).map(normalizeSkill);

  const matchedCount = requiredSkills.filter((skill) =>
    studentSkills.some((studentSkill) => studentSkill === normalizeSkill(skill) || studentSkill.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(studentSkill))
  ).length;

  return {
    matchedCount,
    coverage: clamp(Math.round((matchedCount / Math.max(requiredSkills.length, 1)) * 100)),
  };
};

export const calculatePlacementReadiness = (student = {}, role = "") => {
  const targetRole = String(role || student.targetRole || "Data Analyst").trim() || "Data Analyst";
  const skillCoverage = scoreSkillCoverage(student, targetRole);
  const projectCount = (student.projects || []).length;
  const experienceCount = (student.experiences || []).length;
  const certificationCount = (student.certifications || []).length;
  const cgpa = Number(student.cgpa || 0);
  const profileCompletion = Number(student.profileCompletion || 0);

  const skillScore = skillCoverage.coverage * 0.5;
  const projectScore = clamp(projectCount * 8 + experienceCount * 10 + certificationCount * 6, 0, 25);
  const academicScore = clamp((cgpa / 10) * 25, 0, 25);
  const profileScore = clamp(profileCompletion * 0.2, 0, 20);
  const readinessScore = clamp(Math.round(skillScore + projectScore + academicScore + profileScore));

  let level = "Foundation";
  if (readinessScore >= 80) level = "Industry Ready";
  else if (readinessScore >= 60) level = "High Potential";
  else if (readinessScore >= 40) level = "Developing";

  const recommendations = [
    `Close ${Math.max(0, 100 - skillCoverage.coverage)}% of the ${targetRole} role-skill gap with project practice and focused learning.`,
    projectCount > 0
      ? "Keep documenting outcomes in your portfolio so recruiters can see measurable impact."
      : "Add at least one portfolio project that demonstrates live problem-solving and business impact.",
    profileCompletion < 85
      ? "Complete missing profile sections, resume details, and learning links to improve credibility."
      : "Your profile is strong; prioritize interview preparation and role-specific application quality.",
  ];

  return {
    studentName: student.name || "Student",
    targetRole,
    overallScore: readinessScore,
    level,
    breakdown: {
      skillCoverage: skillCoverage.coverage,
      projectReadiness: clamp(projectScore, 0, 25),
      academicReadiness: clamp(Math.round(academicScore), 0, 25),
      profileReadiness: clamp(Math.round(profileScore), 0, 20),
      matchedSkills: skillCoverage.matchedCount,
    },
    recommendations,
    why: "The model blends role skill coverage, project credibility, academic strength, and profile completeness to explain placement readiness in a traceable way.",
    status: "ready",
  };
};

export const buildReadinessSummary = (students = []) => {
  const scores = students.map((student) => calculatePlacementReadiness(student, student.targetRole || "Data Analyst"));
  const averageScore = Math.round(scores.reduce((sum, score) => sum + score.overallScore, 0) / Math.max(scores.length, 1));
  const highPotential = scores.filter((entry) => entry.level === "High Potential" || entry.level === "Industry Ready").length;

  return {
    overview: `Across ${scores.length} tracked students, the average placement readiness score is ${averageScore}. The cohort shows ${highPotential} students in strong readiness bands for the next hiring cycle.`,
    averageScore,
    highPotential,
    strengths: scores.filter((entry) => entry.overallScore >= 60).slice(0, 3),
    alerts: scores.filter((entry) => entry.overallScore < 40).slice(0, 3),
  };
};

export default {
  calculatePlacementReadiness,
  buildReadinessSummary,
};

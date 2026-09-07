const normalizeSkill = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const roleSkillMap = {
  "Data Analyst": ["python", "sql", "power bi", "excel", "statistics", "dashboard"],
  "Data Scientist": ["python", "sql", "statistics", "machine learning", "tableau"],
  "Full Stack Developer": ["javascript", "react", "node", "api", "database", "git"],
  "Product Manager": ["agile", "strategy", "stakeholder", "roadmap"],
};

const scoreStudent = (student = {}) => {
  const targetRole = String(student.targetRole || "Data Analyst").trim() || "Data Analyst";
  const requiredSkills = roleSkillMap[targetRole] || roleSkillMap["Data Analyst"];
  const skillSet = normalizeList([
    ...(student.skills || []),
    ...(student.certifications || []).map((cert) => cert?.name || cert),
    ...(student.projects || []).flatMap((project) => project?.technologies || []),
  ]).map(normalizeSkill);

  const matched = requiredSkills.filter((skill) =>
    skillSet.some((studentSkill) => studentSkill === normalizeSkill(skill) || studentSkill.includes(normalizeSkill(skill)) || normalizeSkill(skill).includes(studentSkill))
  ).length;

  const projectScore = (student.projects || []).length * 12;
  const experienceScore = (student.experiences || []).length * 10;
  const academicScore = clamp(((Number(student.cgpa || 0) / 10) * 25), 0, 25);
  const profileScore = clamp(Number(student.profileCompletion || 0) * 0.2, 0, 20);
  const skillCoverage = clamp(Math.round((matched / Math.max(requiredSkills.length, 1)) * 100), 0, 100);
  const score = clamp(Math.round(skillCoverage * 0.45 + projectScore + experienceScore + academicScore + profileScore));

  return {
    studentName: student.name || "Student",
    department: student.department || "Unassigned",
    targetRole,
    score,
    skillCoverage,
    matchedCount: matched,
  };
};

export const generateInstitutionInsights = ({ students = [], term = "Next placement cycle" }) => {
  const evaluated = students.map(scoreStudent);
  const avgScore = Math.round(evaluated.reduce((sum, item) => sum + item.score, 0) / Math.max(evaluated.length, 1));
  const departments = Object.values(
    evaluated.reduce((acc, item) => {
      if (!acc[item.department]) {
        acc[item.department] = { department: item.department, students: 0, totalScore: 0, strongestRole: item.targetRole };
      }
      acc[item.department].students += 1;
      acc[item.department].totalScore += item.score;
      return acc;
    }, {})
  ).map((entry) => ({
    ...entry,
    avgScore: Math.round(entry.totalScore / Math.max(entry.students, 1)),
  })).sort((a, b) => b.avgScore - a.avgScore);

  const skillFrequency = {};
  for (const student of students) {
    for (const skill of student.skills || []) {
      const key = normalizeSkill(skill);
      if (!key) continue;
      skillFrequency[key] = (skillFrequency[key] || 0) + 1;
    }
  }

  const topSkills = Object.entries(skillFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([skill, count]) => ({ skill: skill.replace(/([a-z])([0-9])/gi, "$1 $2"), count }));

  const forecast = {
    nextCycleReadiness: clamp(Math.round(avgScore * 0.92)),
    likelyHighFitDepartments: departments.filter((item) => item.avgScore >= 60).slice(0, 3).map((item) => item.department),
    riskFlag: departments.some((item) => item.avgScore < 45) ? "Some departments need deeper skill interventions before the next cycle." : "No major department-level risk flagged by current readiness data.",
  };

  const summary = `Institution readiness for ${term} is currently ${avgScore}/100. Based on the profile mix, departments such as ${departments.slice(0, 2).map((item) => item.department).join(" and ") || "the active cohorts"} are the strongest placement-ready clusters, while demand should be supported with gap-based skilling and portfolio enhancement.`;

  return {
    summary,
    averageScore: avgScore,
    departments,
    topSkills,
    forecast,
    status: "ready",
    why: "The institution intelligence model combines department-level readiness, role demand alignment, and high-frequency skills to show a forecast grounded in current student profiles.",
  };
};

export default {
  generateInstitutionInsights,
};

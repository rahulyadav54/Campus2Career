const normalizeSkill = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);

const roleKeywordMap = {
  "Data Analyst": ["Python", "SQL", "Excel", "Power BI", "Tableau", "Statistics", "Dashboard", "Data Cleaning", "Reporting"],
  "Data Scientist": ["Python", "SQL", "Statistics", "Machine Learning", "Modeling", "Pandas", "Scikit-Learn", "Tableau"],
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "API", "MongoDB", "Git", "Database"],
  "Product Manager": ["Roadmap", "Agile", "Stakeholder Management", "Requirements", "Product Strategy"],
};

const buildStrengths = (student, role) => {
  const baseSkills = normalizeList([
    ...(student.skills || []),
    ...(student.certifications || []).map((cert) => cert?.name || cert),
  ]);
  const roleSkills = roleKeywordMap[role] || roleKeywordMap["Data Analyst"];

  return baseSkills
    .filter((skill) =>
      roleSkills.some((required) => {
        const skillKey = normalizeSkill(skill);
        const requiredKey = normalizeSkill(required);
        return skillKey === requiredKey || skillKey.includes(requiredKey) || requiredKey.includes(skillKey);
      })
    )
    .slice(0, 4);
};

export const analyzeResumeForRole = (student = {}, role = "Data Analyst", jobDescription = "") => {
  const resolvedRole = String(role || student.targetRole || "Data Analyst").trim() || "Data Analyst";
  const keywords = roleKeywordMap[resolvedRole] || roleKeywordMap["Data Analyst"];
  const studentSkills = normalizeList([
    ...(student.skills || []),
    ...(student.certifications || []).map((cert) => cert?.name || cert),
    ...(student.projects || []).flatMap((project) => project?.technologies || []),
  ]);

  const covered = studentSkills.filter((skill) =>
    keywords.some((keyword) => {
      const skillKey = normalizeSkill(skill);
      const keywordKey = normalizeSkill(keyword);
      return skillKey === keywordKey || skillKey.includes(keywordKey) || keywordKey.includes(skillKey);
    })
  );

  const missingKeywords = keywords
    .filter((keyword) => !studentSkills.some((skill) => {
      const skillKey = normalizeSkill(skill);
      const keywordKey = normalizeSkill(keyword);
      return skillKey === keywordKey || skillKey.includes(keywordKey) || keywordKey.includes(skillKey);
    }))
    .map((keyword) => ({
      keyword,
      inJobDescription: (jobDescription || "").toLowerCase().includes(keyword.toLowerCase()),
      reason: `This keyword is important for ${resolvedRole} roles and should be visible in the resume summary or project bullets.`,
    }));

  const strengths = buildStrengths(student, resolvedRole);
  const atsScore = clamp(Math.round((covered.length / Math.max(keywords.length, 1)) * 100), 0, 100);
  const improvementHints = missingKeywords.slice(0, 3).map((item) => `Mention ${item.keyword} in a measurable achievement or project result.`);

  return {
    role: resolvedRole,
    atsScore,
    strengths,
    missingKeywords: missingKeywords.slice(0, 5),
    summary: `${strengths.length} relevant strengths found, with ${missingKeywords.length} important keyword gaps still to close for ${resolvedRole}.`,
    recommendation: "Lead with the strongest role keywords, quantify outcomes, and add a short impact statement in each resume bullet.",
    why: "ATS scoring rewards direct skill alignment and measurable results for the target role.",
    confidence: 84,
    status: "analyzed",
    improvementHints,
  };
};

export const generateMockInterviewPlan = (student = {}, role = "Data Analyst", interviewType = "mixed") => {
  const resolvedRole = String(role || student.targetRole || "Data Analyst").trim() || "Data Analyst";
  const questions = [
    {
      text: `Walk me through a project where you used SQL or Python to answer a business question in ${resolvedRole}.`,
      type: "technical",
      skill: "SQL",
      expectedPoints: ["Problem framing", "Query quality", "Business impact"],
    },
    {
      text: `How would you explain a dashboard or data story to a non-technical stakeholder in ${resolvedRole}?`,
      type: "behavioral",
      skill: "Communication",
      expectedPoints: ["Clarity", "Stakeholder empathy", "Actionable insights"],
    },
    {
      text: `Describe a time you had to clean messy data and decide which assumptions to keep or change.`,
      type: "scenario",
      skill: "Data Cleaning",
      expectedPoints: ["Analytical rigor", "Documentation", "Decision quality"],
    },
    {
      text: `What metrics would you track to evaluate whether a product or process is working well?`,
      type: "hr",
      skill: "Metrics",
      expectedPoints: ["Business thinking", "Prioritization", "Outcome awareness"],
    },
  ];

  const scoreBand = clamp(Math.round((student.skills?.length || 3) * 12 + 25), 0, 100);

  return {
    role: resolvedRole,
    interviewType: interviewType || "mixed",
    difficulty: scoreBand >= 70 ? "intermediate" : "beginner",
    questions,
    overallScore: scoreBand,
    readinessLabel: scoreBand >= 70 ? "Ready for interviews" : scoreBand >= 45 ? "Ready with practice" : "Needs more prep",
    guidance: "Practice concise STAR answers, use metrics in your examples, and explain trade-offs clearly for technical and business conversations.",
    status: "ready",
  };
};

export default {
  analyzeResumeForRole,
  generateMockInterviewPlan,
};

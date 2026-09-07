const clamp = (value, min = 0, max = 100) => Math.min(Math.max(value, min), max);
const normalizeSkill = (value = "") => String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
const normalizeList = (value = []) => [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const roleSkillMap = {
  "Data Analyst": ["python", "sql", "excel", "power bi", "tableau", "statistics", "dashboard", "reporting"],
  "Data Scientist": ["python", "sql", "statistics", "machine learning", "pandas", "modeling", "tableau"],
  "Full Stack Developer": ["javascript", "react", "nodejs", "node.js", "api", "mongodb", "git", "database"],
  "Product Manager": ["roadmap", "agile", "stakeholder", "requirements", "strategy"],
};

const scoreCandidate = (candidate = {}, role = "Data Analyst") => {
  const requiredSkills = roleSkillMap[role] || roleSkillMap["Data Analyst"];
  const skills = normalizeList([
    ...(candidate.skills || []),
    ...(candidate.certifications || []).map((cert) => cert?.name || cert),
    ...(candidate.projects || []).flatMap((project) => project?.technologies || []),
    ...(candidate.experiences || []).map((experience) => experience?.role || ""),
  ]).map(normalizeSkill);

  const matchingSkills = requiredSkills.filter((keyword) =>
    skills.some((skill) => skill === normalizeSkill(keyword) || skill.includes(normalizeSkill(keyword)) || normalizeSkill(keyword).includes(skill))
  );

  const skillScore = (matchingSkills.length / Math.max(requiredSkills.length, 1)) * 100;
  const cgpaScore = (Number(candidate.cgpa || 0) / 10) * 25;
  const profileScore = Number(candidate.profileCompletion || 0) * 0.35;
  const projectScore = Math.min(15, (candidate.projects || []).length * 5);
  const experienceScore = (candidate.experiences || []).length ? 10 : 0;

  const total = clamp(Math.round(skillScore + cgpaScore + profileScore + projectScore + experienceScore));

  return {
    score: total,
    matchingSkills: matchingSkills.slice(0, 5),
    matchedCount: matchingSkills.length,
    strengthAreas: matchingSkills.slice(0, 3),
  };
};

export const rankCandidatesForRole = (candidates = [], role = "Data Analyst") => {
  return [...candidates]
    .map((candidate) => ({
      ...candidate,
      score: scoreCandidate(candidate, role).score,
      matchedSkills: scoreCandidate(candidate, role).matchingSkills,
      reasoning: [
        `${scoreCandidate(candidate, role).matchedCount} role-relevant skill matches found`,
        `Profile completeness is ${candidate.profileCompletion || 0}%`,
        `CGPA is ${candidate.cgpa || 0}`,
      ],
    }))
    .sort((a, b) => b.score - a.score);
};

export const buildRecruiterShortlist = (candidates = [], role = "Data Analyst", options = {}) => {
  const minScore = Number(options.minScore || 70);
  const ranked = rankCandidatesForRole(candidates, role);
  const topCandidates = ranked
    .filter((candidate) => candidate.score >= minScore)
    .map((candidate) => ({
      ...candidate,
      fitLabel: candidate.score >= 85 ? "Strong fit" : candidate.score >= 75 ? "Good fit" : "Potential fit",
      reasoning: [
        `${candidate.matchedSkills.length || 0} relevant skills match the ${role} requirement set`,
        candidate.profileCompletion ? `Profile readiness is ${candidate.profileCompletion}%` : "Profile readiness is not yet fully complete",
        candidate.cgpa ? `Academic profile shows CGPA ${candidate.cgpa}` : "Academic score is not prominently listed",
      ],
    }));

  const summary = topCandidates.length
    ? `${topCandidates.length} candidates meet the ${role} shortlist threshold, with the top-ranked profile scoring ${topCandidates[0].score}/100.`
    : `No candidates currently meet the ${role} shortlist threshold at ${minScore}. Consider widening the candidate pool or enhancing role-specific upskilling.`;

  return {
    role,
    threshold: minScore,
    topCandidates,
    summary,
    why: "The recruiter AI ranks profiles by role-fit, measured skill match, academics, and profile completeness to keep shortlisting explainable.",
    status: "ready",
  };
};

export default {
  rankCandidatesForRole,
  buildRecruiterShortlist,
};

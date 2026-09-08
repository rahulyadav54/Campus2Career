import { resumeContentToText, extractSkillsFromContent } from "./resumeSchema.js";

const clamp = (v, min = 0, max = 100) => Math.min(max, Math.max(min, v));

const STANDARD_HEADINGS = [
  "education", "experience", "skills", "projects", "summary", "certifications",
];

const ACTION_VERBS = [
  "developed", "built", "created", "designed", "implemented", "led", "managed",
  "improved", "optimized", "analyzed", "delivered", "achieved", "reduced", "increased",
];

const analyzeStructure = (content) => {
  let score = 70;
  const strengths = [];
  const improvements = [];
  const warnings = [];

  const p = content.personal || {};
  if (p.name && p.email) { score += 10; strengths.push("Contact information is present"); }
  else improvements.push("Add your full name and email in the header");

  if (p.phone) strengths.push("Phone number included");
  else improvements.push("Consider adding a phone number");

  if (content.summary?.trim().length > 40) {
    score += 8;
    strengths.push("Professional summary is present");
  } else {
    improvements.push("Add a concise professional summary (2–3 lines)");
  }

  if ((content.education || []).length > 0) { score += 6; strengths.push("Education section included"); }
  else improvements.push("Add your education details");

  if ((content.experience || []).length > 0 || (content.projects || []).length > 0) {
    score += 8;
    strengths.push("Experience or projects section included");
  } else {
    improvements.push("Add experience or project work to demonstrate capability");
  }

  const skillCount = extractSkillsFromContent(content).length;
  if (skillCount >= 5) {
    score += 6;
    strengths.push("Skills section has good coverage");
  } else {
    improvements.push("Expand your skills section with relevant technologies");
  }

  const order = content.sectionOrder || [];
  if (order.length >= 4) strengths.push("Resume has clear section structure");

  // Formatting checks
  const fmt = content.formatting || {};
  if (fmt.fontFamily && /arial|georgia|times|calibri|helvetica/i.test(fmt.fontFamily)) {
    strengths.push("Uses ATS-friendly fonts");
  } else {
    warnings.push({ type: "formatting", message: "Unusual fonts may reduce ATS parsing accuracy in some systems" });
  }

  if ((fmt.marginMm || 18) < 10) {
    warnings.push({ type: "formatting", message: "Very narrow margins may cause parsing issues" });
  }

  // Bullet quality
  const allBullets = [
    ...(content.experience || []).flatMap((e) => e.bullets || []),
    ...(content.projects || []).flatMap((p) => p.bullets || []),
  ].filter(Boolean);

  const weakBullets = allBullets.filter((b) => b.length < 25);
  const strongBullets = allBullets.filter((b) =>
    ACTION_VERBS.some((v) => b.toLowerCase().startsWith(v))
  );

  if (strongBullets.length > 0) strengths.push("Uses action verbs in bullet points");
  if (weakBullets.length > 2) {
    improvements.push("Some bullet points are too short — add context and impact");
  }

  const hasMetrics = allBullets.some((b) => /\d+%|\d+\+|\$\d|increased|reduced|improved/i.test(b));
  if (hasMetrics) strengths.push("Includes measurable results in bullets");
  else improvements.push("Consider adding measurable results if you have them (e.g. %, time saved)");

  return {
    parsingStructure: clamp(score),
    formatting: clamp(75 + (strengths.filter((s) => s.includes("font")).length * 10)),
    sectionCompleteness: clamp(
      [p.name, p.email, content.summary, content.education?.length, extractSkillsFromContent(content).length]
        .filter(Boolean).length * 18
    ),
    strengths,
    improvements,
    warnings,
  };
};

const extractJdKeywords = (jobDescription = "") => {
  const text = jobDescription.toLowerCase();
  const techPatterns = [
    "python", "java", "javascript", "typescript", "react", "node", "sql", "aws", "docker",
    "kubernetes", "machine learning", "deep learning", "tensorflow", "pytorch", "git",
    "agile", "scrum", "rest api", "graphql", "mongodb", "postgresql", "linux", "ci/cd",
    "azure", "gcp", "figma", "communication", "teamwork", "problem solving", "data analysis",
    "pandas", "numpy", "excel", "power bi", "tableau", "cybersecurity", "networking",
  ];
  return techPatterns.filter((kw) => text.includes(kw));
};

/**
 * Estimated ATS compatibility analysis.
 * Never claims exact ATS platform scores.
 */
export const analyzeATS = (content, { jobDescription = "", targetRole = "" } = {}) => {
  const structure = analyzeStructure(content);
  const resumeText = resumeContentToText(content).toLowerCase();
  const studentSkills = extractSkillsFromContent(content).map((s) => s.toLowerCase());

  let keywordMatch = 60;
  let skillsMatch = 65;
  let experienceRelevance = 60;
  const matchedKeywords = [];
  const missingKeywords = [];
  const suggestions = [];

  if (jobDescription?.trim()) {
    const jdKeywords = extractJdKeywords(jobDescription);
    jdKeywords.forEach((kw) => {
      const inResume = resumeText.includes(kw) || studentSkills.some((s) => s.includes(kw) || kw.includes(s));
      if (inResume) {
        matchedKeywords.push({ keyword: kw, matched: true, source: "resume" });
      } else {
        missingKeywords.push({ keyword: kw, matched: false, source: "job_description" });
        suggestions.push({
          id: `kw_${kw.replace(/\s/g, "_")}`,
          title: kw.charAt(0).toUpperCase() + kw.slice(1),
          why: `The job description emphasizes "${kw}".`,
          what: `Add "${kw}" if you have genuine experience with it.`,
          how: "Include it in Skills and mention it in a relevant project or experience bullet.",
          example: `If applicable: "Used ${kw} to [describe what you did]."`,
          truthCheck: "Add this only if you have actually used this skill.",
          section: "skills",
          priority: "high",
        });
      }
    });

    keywordMatch = jdKeywords.length
      ? clamp(Math.round((matchedKeywords.length / jdKeywords.length) * 100))
      : 55;
    skillsMatch = keywordMatch;
    experienceRelevance = clamp(
      Math.round((structure.parsingStructure + keywordMatch) / 2)
    );
  } else if (targetRole) {
    skillsMatch = clamp(50 + studentSkills.length * 3);
    keywordMatch = skillsMatch;
  }

  const breakdown = {
    parsingStructure: structure.parsingStructure,
    formatting: structure.formatting,
    keywordMatch,
    skillsMatch,
    experienceRelevance,
    sectionCompleteness: structure.sectionCompleteness,
  };

  const scores = Object.values(breakdown);
  const atsScore = clamp(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));

  const healthCheck = {
    contactInfo: Boolean(content.personal?.name && content.personal?.email),
    education: (content.education || []).length > 0,
    skills: extractSkillsFromContent(content).length > 0,
    projects: (content.projects || []).length > 0,
    experience: (content.experience || []).length > 0,
    consistentDates: true,
    standardHeadings: STANDARD_HEADINGS.some((h) => (content.sectionOrder || []).includes(h)),
    readableFormatting: structure.warnings.length === 0,
  };

  return {
    atsScore,
    estimatedLabel: "Estimated ATS Compatibility",
    breakdown,
    matchedKeywords: matchedKeywords.slice(0, 20),
    missingKeywords: missingKeywords.slice(0, 15),
    strengths: structure.strengths,
    improvements: structure.improvements,
    warnings: structure.warnings,
    suggestions: suggestions.slice(0, 8),
    healthCheck,
    disclaimer: "This is an estimated compatibility score. Different ATS platforms parse resumes differently.",
  };
};

export default { analyzeATS };

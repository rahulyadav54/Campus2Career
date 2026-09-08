import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import {
  emptyResumeContent,
  emptyEducation,
  emptyExperience,
  emptyProject,
  emptyCertification,
  emptyAchievement,
  createId,
  defaultSkillCategories,
  emptySkillCategory,
  SKILL_CATEGORIES,
  CAMPUS2CAREER_SECTION_ORDER,
} from "./resumeSchema.js";

const SKILL_KEYWORDS = [
  "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB", "Python",
  "Java", "C++", "SQL", "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP",
  "HTML", "CSS", "Tailwind", "Machine Learning", "Deep Learning", "TensorFlow",
  "PyTorch", "Pandas", "NumPy", "Scikit-Learn", "REST API", "GraphQL", "Redis",
  "PostgreSQL", "MySQL", "Linux", "CI/CD", "Agile", "Scrum", "Figma", "Flutter",
  "React Native", "Spring Boot", "Django", "FastAPI", "Next.js", "Vue", "Angular",
];

const cleanLines = (text) =>
  text.split("\n").map((l) => l.replace(/\s+/g, " ").trim()).filter(Boolean);

const findSocialLink = (text, label) => {
  const patterns = {
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i,
    github: /https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i,
    portfolio: /https?:\/\/[^\s)]+/i,
  };
  const match = text.match(patterns[label]);
  return match ? match[0] : "";
};

export const extractTextFromFile = async (filePath, originalName, mimeType) => {
  const ext = path.extname(originalName || filePath).toLowerCase();
  const buffer = await fs.readFile(filePath);

  if (ext === ".pdf" || mimeType === "application/pdf") {
    const parser = new PDFParse({ data: buffer });
    try {
      const parsed = await parser.getText();
      return parsed.text || "";
    } finally {
      await parser.destroy().catch(() => {});
    }
  }

  if (ext === ".docx" || mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const parsed = await mammoth.extractRawText({ buffer });
    return parsed.value || "";
  }

  if (ext === ".doc" || mimeType === "application/msword") {
    throw new Error("Legacy .doc files are not supported. Please save as DOCX or PDF.");
  }

  throw new Error("Unsupported file type. Upload PDF or DOCX.");
};

const detectSection = (line) => {
  const lower = line.toLowerCase();
  if (/^(education|academic)/i.test(lower)) return "education";
  if (/^(experience|employment|work history)/i.test(lower)) return "experience";
  if (/^(projects?|portfolio)/i.test(lower)) return "projects";
  if (/^(skills?|technical skills|core competencies)/i.test(lower)) return "skills";
  if (/^(certifications?|licenses?)/i.test(lower)) return "certifications";
  if (/^(achievements?|awards?|honors?)/i.test(lower)) return "achievements";
  if (/^(languages?)/i.test(lower)) return "languages";
  if (/^(summary|profile|objective|about|professional summary)/i.test(lower)) return "summary";
  return null;
};

/**
 * Parse resume text into structured content.
 * Marks uncertain fields as needsReview instead of guessing.
 */
export const parseResumeText = (resumeText) => {
  const content = emptyResumeContent();
  const needsReview = [];
  const lines = cleanLines(resumeText);
  const topLines = lines.slice(0, 10);

  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  const nameCandidate = topLines.find(
    (line) => line.length >= 3 && line.length <= 60 && !/@/.test(line)
      && !/resume|curriculum vitae|cv\b/i.test(line)
  );

  content.personal = {
    name: nameCandidate || "",
    tagline: "",
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0]?.trim() || "",
    location: topLines.find((l) => /\b\d{5,6}\b|,\s*[A-Z]{2}\b|India|Salem|Bangalore|Delhi|Mumbai|Tamil Nadu/i.test(l))?.slice(0, 80) || "",
    linkedin: findSocialLink(resumeText, "linkedin") || resumeText.match(/linkedin\.com\/[^\s)]+/i)?.[0] || "",
    github: findSocialLink(resumeText, "github") || resumeText.match(/github\.com\/[^\s)]+/i)?.[0] || "",
    portfolio: findSocialLink(resumeText, "portfolio"),
  };

  const taglineLine = topLines.find((l, i) => i > 0 && i < 4 && /\|/.test(l) && l !== content.personal.name);
  if (taglineLine) content.personal.tagline = taglineLine;

  if (!content.personal.name) needsReview.push("personal.name");
  if (!content.personal.email) needsReview.push("personal.email");

  let currentSection = "summary";
  const sectionBuffers = {
    summary: [],
    education: [],
    experience: [],
    projects: [],
    skills: [],
    certifications: [],
    achievements: [],
    languages: [],
  };

  for (const line of lines) {
    const detected = detectSection(line);
    if (detected) {
      currentSection = detected;
      continue;
    }
    if (sectionBuffers[currentSection]) {
      sectionBuffers[currentSection].push(line);
    }
  }

  content.summary = sectionBuffers.summary.slice(0, 5).join(" ").slice(0, 600);
  if (!content.summary) {
    content.summary = topLines.slice(1, 4).join(" ").slice(0, 400);
    if (content.summary) needsReview.push("summary");
  }

  // Categorized skills (Campus2Career template format)
  const skillCats = defaultSkillCategories();
  const knownCats = SKILL_CATEGORIES.map((c) => c.toLowerCase());
  let currentSkillCat = null;
  sectionBuffers.skills.forEach((line) => {
    const catMatch = knownCats.find((c) => line.toLowerCase().startsWith(c));
    if (catMatch) {
      currentSkillCat = skillCats.find((sc) => sc.category.toLowerCase() === catMatch);
      const rest = line.slice(catMatch.length).replace(/^[\s:]+/, "").trim();
      if (rest) currentSkillCat.items = rest.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
    } else if (currentSkillCat) {
      currentSkillCat.items.push(...line.split(/[,;|]/).map((s) => s.trim()).filter(Boolean));
    }
  });
  const hasCatSkills = skillCats.some((c) => c.items?.length);
  if (hasCatSkills) {
    content.skillCategories = skillCats;
  } else {
    const detectedSkills = SKILL_KEYWORDS.filter((skill) =>
      new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(resumeText)
    );
    const skillLines = sectionBuffers.skills.join(" ");
    const inlineSkills = skillLines.split(/[,;|•·]/).map((s) => s.trim()).filter((s) => s.length > 1 && s.length < 40);
    const flat = [...new Set([...detectedSkills, ...inlineSkills])].slice(0, 30);
    content.skillCategories = skillCats.map((cat, i) =>
      i === 0 ? { ...cat, items: flat } : cat
    );
  }

  content.spokenLanguages = sectionBuffers.languages.join(", ").replace(/^languages?\s*/i, "").slice(0, 200);

  // Education entries
  sectionBuffers.education.forEach((block) => {
    if (block.length < 4) return;
    const edu = emptyEducation();
    edu.institution = block.slice(0, 100);
    edu.degree = block;
    content.education.push(edu);
  });

  // Experience — bullet lines starting with action verbs
  let currentExp = null;
  sectionBuffers.experience.forEach((line) => {
    if (/^[•\-\*]/.test(line) || /^(developed|built|created|led|managed|designed|implemented)/i.test(line)) {
      if (!currentExp) {
        currentExp = emptyExperience();
        currentExp.company = "Needs Review";
        needsReview.push(`experience.${currentExp.id}`);
        content.experience.push(currentExp);
      }
      currentExp.bullets.push(line.replace(/^[-•*]\s*/, ""));
    } else if (line.length > 5) {
      currentExp = emptyExperience();
      currentExp.title = line.slice(0, 80);
      currentExp.company = "";
      needsReview.push(`experience.${currentExp.id}.company`);
      content.experience.push(currentExp);
    }
  });

  // Projects
  sectionBuffers.projects.forEach((line) => {
    if (line.length < 4) return;
    const proj = emptyProject();
    proj.name = line.slice(0, 100);
    proj.bullets = [line];
    content.projects.push(proj);
  });

  // Certifications
  sectionBuffers.certifications.forEach((line) => {
    const cert = emptyCertification();
    cert.name = line.slice(0, 120);
    cert.issuer = "Needs Review";
    needsReview.push(`certifications.${cert.id}.issuer`);
    content.certifications.push(cert);
  });

  // Achievements
  sectionBuffers.achievements.forEach((line) => {
    const ach = emptyAchievement();
    ach.title = line.slice(0, 120);
    content.achievements.push(ach);
  });

  content.sectionOrder = CAMPUS2CAREER_SECTION_ORDER;
  content.meta = { needsReview };
  return { content, rawText: resumeText, needsReview };
};

/** Build resume content from student profile — no fabrication */
export const contentFromStudentProfile = (student = {}) => {
  const content = emptyResumeContent();
  content.personal = {
    name: student.name || "",
    tagline: student.targetRole || student.headline || "",
    email: student.email || "",
    phone: student.phone || "",
    location: student.location || student.city || "",
    linkedin: student.socialLinks?.linkedin || student.linkedin || "",
    github: student.socialLinks?.github || student.github || "",
    portfolio: student.socialLinks?.portfolio || student.portfolio || "",
  };
  content.summary = student.description || student.bio || "";

  const flatSkills = [...(student.skills || [])];
  content.skillCategories = defaultSkillCategories().map((cat, i) =>
    i === 0 ? { ...cat, items: flatSkills } : cat
  );

  (student.education || []).forEach((edu) => {
    const e = emptyEducation();
    e.institution = edu.institution || edu.college || edu.school || "";
    e.degree = edu.degree || "";
    e.field = edu.field || edu.branch || "";
    e.startDate = edu.startDate || edu.startYear || "";
    e.endDate = edu.endDate || edu.endYear || edu.graduationYear || "";
    e.gpa = edu.cgpa || edu.gpa || "";
    if (e.institution || e.degree) content.education.push(e);
  });

  (student.experiences || student.experience || []).forEach((exp) => {
    const e = emptyExperience();
    e.company = exp.company || "";
    e.title = exp.role || exp.title || "";
    e.location = exp.location || "";
    e.startDate = exp.startDate || "";
    e.endDate = exp.endDate || "";
    e.bullets = exp.description ? [exp.description] : (exp.bullets || [""]);
    if (e.company || e.title) content.experience.push(e);
  });

  (student.projects || []).forEach((proj) => {
    const p = emptyProject();
    p.name = proj.title || proj.name || "";
    p.url = proj.url || proj.link || "";
    p.techStack = (proj.technologies || proj.skills || []).join(" | ");
    p.technologies = proj.technologies || proj.skills || [];
    p.bullets = proj.description ? [proj.description] : (proj.bullets || [""]);
    if (p.name) content.projects.push(p);
  });

  (student.certifications || []).forEach((cert) => {
    const c = emptyCertification();
    if (typeof cert === "string") {
      c.name = cert;
    } else {
      c.name = cert.name || "";
      c.issuer = cert.issuer || "";
      c.date = cert.date || cert.year || "";
    }
    if (c.name) content.certifications.push(c);
  });

  return content;
};

export default { extractTextFromFile, parseResumeText, contentFromStudentProfile };

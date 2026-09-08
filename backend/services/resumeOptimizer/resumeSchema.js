/** Canonical structured resume content — Campus2Career ATS template */

export const TARGET_ROLES = [
  "Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "AI/ML Engineer", "Data Scientist", "Data Analyst", "Cybersecurity", "Cloud Engineer",
  "Mobile Developer", "UI/UX Designer", "DevOps Engineer", "Product Manager",
];

export const DEFAULT_TEMPLATE_ID = "campus2career_ats";

export const SKILL_CATEGORIES = [
  "Languages", "Backend", "Databases", "Frontend", "AI/ML", "Tools",
];

export const CAMPUS2CAREER_SECTION_ORDER = [
  "header",
  "summary",
  "experience",
  "education",
  "skills",
  "certifications",
  "languages",
  "projects",
  "achievements",
];

export const DEFAULT_SECTION_ORDER = CAMPUS2CAREER_SECTION_ORDER;

export const createId = () => `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const emptySkillCategory = (category = "") => ({
  id: createId(),
  category,
  items: [],
});

export const defaultSkillCategories = () =>
  SKILL_CATEGORIES.map((cat) => emptySkillCategory(cat));

export const emptyResumeContent = () => ({
  personal: {
    name: "",
    tagline: "",
    email: "",
    phone: "",
    location: "",
    linkedin: "",
    github: "",
    portfolio: "",
  },
  summary: "",
  education: [],
  experience: [],
  projects: [],
  skillCategories: defaultSkillCategories(),
  skills: [],
  certifications: [],
  achievements: [],
  spokenLanguages: "",
  languages: [],
  customSections: [],
  sectionOrder: [...CAMPUS2CAREER_SECTION_ORDER],
  formatting: {
    fontFamily: "Calibri, Arial, Helvetica, sans-serif",
    fontSize: 10.5,
    headingSize: 11,
    lineHeight: 1.25,
    marginMm: 15,
    pageSize: "A4",
    bulletStyle: "disc",
  },
  meta: { needsReview: [] },
});

export const emptyEducation = () => ({
  id: createId(),
  institution: "",
  degree: "",
  field: "",
  location: "",
  startDate: "",
  endDate: "",
  gpa: "",
  highlights: [],
});

export const emptyExperience = () => ({
  id: createId(),
  company: "",
  title: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  bullets: [""],
});

export const emptyProject = () => ({
  id: createId(),
  name: "",
  url: "",
  techStack: "",
  technologies: [],
  bullets: [""],
});

export const emptyCertification = () => ({
  id: createId(),
  name: "",
  issuer: "",
  date: "",
});

export const emptyAchievement = () => ({
  id: createId(),
  title: "",
  description: "",
});

export const emptyLanguage = () => ({
  id: createId(),
  language: "",
  proficiency: "",
});

/** Normalize skills from flat list or categories */
export const getSkillCategories = (content = {}) => {
  if (content.skillCategories?.length) return content.skillCategories;
  if (content.skills?.length) {
    const flat = content.skills.map((s) => (typeof s === "string" ? s : s.items?.join(", ") || ""));
    return [{ id: createId(), category: "General", items: flat.filter(Boolean) }];
  }
  return defaultSkillCategories();
};

/** Collect all skills for ATS analysis */
export const extractSkillsFromContent = (content = {}) => {
  const skills = new Set();
  getSkillCategories(content).forEach((cat) => {
    (cat.items || []).forEach((i) => {
      String(i).split(/[,;|]/).forEach((p) => {
        const t = p.trim();
        if (t) skills.add(t);
      });
    });
  });
  (content.projects || []).forEach((p) => {
    (p.technologies || []).forEach((t) => skills.add(t));
    if (p.techStack) p.techStack.split("|").forEach((t) => skills.add(t.trim()));
  });
  return [...skills].filter(Boolean);
};

export const resumeContentToText = (content = {}) => {
  const parts = [];
  const p = content.personal || {};
  parts.push([p.name, p.tagline].filter(Boolean).join(" — "));
  parts.push([p.email, p.phone, p.location].filter(Boolean).join(" | "));
  if (content.summary) parts.push(content.summary);
  (content.experience || []).forEach((e) => {
    parts.push([e.title, e.company].filter(Boolean).join(" @ "));
    (e.bullets || []).forEach((b) => parts.push(b));
  });
  (content.education || []).forEach((e) => {
    parts.push([e.degree, e.institution].filter(Boolean).join(" — "));
  });
  getSkillCategories(content).forEach((cat) => {
    parts.push(`${cat.category}: ${(cat.items || []).join(", ")}`);
  });
  (content.projects || []).forEach((pr) => {
    parts.push(pr.name);
    if (pr.techStack) parts.push(pr.techStack);
    (pr.bullets || []).forEach((b) => parts.push(b));
  });
  return parts.filter(Boolean).join("\n");
};

/** Migrate legacy resume content to campus2career format */
export const migrateToCampus2Career = (content = {}) => {
  const next = { ...emptyResumeContent(), ...content };
  if (!next.personal.tagline && next.personal.headline) {
    next.personal.tagline = next.personal.headline;
  }
  if (!next.skillCategories?.length && next.skills?.length) {
    const flat = next.skills.map((s) => (typeof s === "string" ? s : "")).filter(Boolean);
    if (flat.length) {
      next.skillCategories = defaultSkillCategories().map((cat, i) =>
        i === 0 ? { ...cat, items: flat } : cat
      );
    }
  }
  if (!next.spokenLanguages && next.languages?.length) {
    next.spokenLanguages = next.languages.map((l) => l.language || l).filter(Boolean).join(", ");
  }
  (next.projects || []).forEach((p) => {
    if (!p.techStack && p.technologies?.length) {
      p.techStack = p.technologies.join(" | ");
    }
  });
  next.sectionOrder = CAMPUS2CAREER_SECTION_ORDER;
  next.formatting = emptyResumeContent().formatting;
  return next;
};

export default {
  TARGET_ROLES,
  DEFAULT_TEMPLATE_ID,
  CAMPUS2CAREER_SECTION_ORDER,
  emptyResumeContent,
  getSkillCategories,
  extractSkillsFromContent,
  migrateToCampus2Career,
};

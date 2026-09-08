/** Campus2Career ATS template constants */

export const DEFAULT_TEMPLATE_ID = "campus2career_ats";

export const SKILL_CATEGORIES = [
  "Languages", "Backend", "Databases", "Frontend", "AI/ML", "Tools",
];

export const CAMPUS2CAREER_SECTION_ORDER = [
  "header", "summary", "experience", "education", "skills",
  "certifications", "languages", "projects", "achievements",
];

export const TEMPLATE_STYLES = {
  campus2career_ats: {
    pageWidth: "210mm",
    pageMinHeight: "297mm",
    marginMm: 15,
    fontFamily: "Calibri, Arial, Helvetica, sans-serif",
    fontSize: 10.5,
    headingSize: 11,
    lineHeight: 1.25,
    nameSize: 18,
    contactSize: 9.5,
    headingColor: "#000000",
    bodyColor: "#000000",
    headingBorder: "1px solid #000000",
  },
};

export const SECTION_LABELS = {
  header: "Header",
  summary: "Professional Summary",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  skills: "Technical Skills",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
};

export const TARGET_ROLES = [
  "Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer",
  "AI/ML Engineer", "Data Scientist", "Data Analyst", "Cybersecurity", "Cloud Engineer",
  "Mobile Developer", "UI/UX Designer", "DevOps Engineer", "Product Manager",
];

export const ZOOM_LEVELS = [50, 75, 100, 125, 150];

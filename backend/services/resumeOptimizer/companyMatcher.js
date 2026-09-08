import { analyzeSkillGaps } from "./skillGapAnalyzer.js";
import { extractSkillsFromContent } from "./resumeSchema.js";

/** Company recommendations based on profile — uses heuristics, not fabricated jobs */
const COMPANY_CATALOG = [
  { name: "TCS", industry: "IT Services", roles: ["Software Developer", "Full Stack Developer", "Data Analyst"], skills: ["Java", "SQL", "Agile"] },
  { name: "Infosys", industry: "IT Services", roles: ["Software Engineer", "Backend Developer", "Cloud Engineer"], skills: ["Java", "Python", "AWS"] },
  { name: "Wipro", industry: "IT Services", roles: ["Full Stack Developer", "DevOps Engineer"], skills: ["React", "Node.js", "Docker"] },
  { name: "Accenture", industry: "Consulting / Technology", roles: ["Data Analyst", "Software Developer"], skills: ["SQL", "Python", "Agile"] },
  { name: "Google", industry: "Technology", roles: ["Software Engineer", "AI/ML Engineer"], skills: ["Python", "Algorithms", "System Design"] },
  { name: "Microsoft", industry: "Technology", roles: ["Software Developer", "Cloud Engineer"], skills: ["C#", "Azure", "TypeScript"] },
  { name: "Amazon", industry: "E-commerce / Cloud", roles: ["SDE", "Cloud Engineer", "Data Engineer"], skills: ["AWS", "Java", "Python"] },
  { name: "Flipkart", industry: "E-commerce", roles: ["Backend Developer", "Full Stack Developer"], skills: ["Java", "React", "Microservices"] },
  { name: "Zoho", industry: "SaaS", roles: ["Full Stack Developer", "Product Engineer"], skills: ["JavaScript", "Java", "SQL"] },
  { name: "Freshworks", industry: "SaaS", roles: ["Frontend Developer", "Backend Developer"], skills: ["React", "Node.js", "TypeScript"] },
  { name: "Razorpay", industry: "Fintech", roles: ["Backend Developer", "Full Stack Developer"], skills: ["Java", "Go", "PostgreSQL"] },
  { name: "PhonePe", industry: "Fintech", roles: ["Software Engineer", "Data Analyst"], skills: ["Java", "Kotlin", "SQL"] },
];

const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const recommendCompanies = (content, student = {}, targetRole = "") => {
  const role = targetRole || student.targetRole || "Software Developer";
  const skills = extractSkillsFromContent(content).map(normalize);
  const gap = analyzeSkillGaps(content, student, role);

  return COMPANY_CATALOG
    .map((company) => {
      const companySkills = company.skills.map(normalize);
      const matched = companySkills.filter((cs) =>
        skills.some((s) => s.includes(cs) || cs.includes(s))
      );
      const missing = companySkills.filter((cs) =>
        !skills.some((s) => s.includes(cs) || cs.includes(s))
      );
      const roleMatch = company.roles.some((r) =>
        normalize(r).includes(normalize(role)) || normalize(role).includes(normalize(r))
      );
      const profileMatch = clampScore(
        (matched.length / Math.max(companySkills.length, 1)) * 60
        + (roleMatch ? 25 : 0)
        + Math.min(skills.length * 2, 15)
      );

      return {
        company: company.name,
        industry: company.industry,
        potentialRoles: company.roles,
        profileMatch,
        estimatedLabel: "Estimated Profile Match",
        whyMatch: matched.length
          ? matched.map((s) => company.skills.find((cs) => normalize(cs) === s) || s)
          : [],
        skillGaps: missing,
        recommendedAction: missing.length
          ? `Strengthen ${missing.slice(0, 2).join(" and ")} to improve alignment.`
          : "Your skills align well — focus on project depth and interview prep.",
        disclaimer: "Potential match based on your current profile — not a guarantee of employment.",
      };
    })
    .sort((a, b) => b.profileMatch - a.profileMatch)
    .slice(0, 8);
};

const clampScore = (v) => Math.min(100, Math.max(0, Math.round(v)));

export default { recommendCompanies };

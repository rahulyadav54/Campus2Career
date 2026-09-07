const ROLE_SKILL_MAP = {
  "Data Analyst": [
    "Python", "SQL", "Excel", "Statistics", "Tableau", "Power BI",
    "Data Visualization", "Pandas", "NumPy", "Data Cleaning",
    "Reporting", "Dashboard", "Excel", "Statistical Analysis",
  ],
  "Data Scientist": [
    "Python", "SQL", "Statistics", "Machine Learning", "Pandas",
    "NumPy", "Scikit-Learn", "Tableau", "Power BI", "Deep Learning",
    "TensorFlow", "PyTorch", "Data Visualization", "R", "Big Data",
  ],
  "Full Stack Developer": [
    "JavaScript", "React", "Node.js", "HTML", "CSS", "MongoDB",
    "Express", "TypeScript", "REST API", "Git", "Tailwind",
    "Database Design", "API Development",
  ],
  "Frontend Developer": [
    "JavaScript", "React", "HTML", "CSS", "TypeScript",
    "Tailwind", "Vue.js", "Angular", "Responsive Design",
    "State Management", "Performance Optimization",
  ],
  "Backend Developer": [
    "Node.js", "Python", "Java", "SQL", "MongoDB",
    "REST API", "Express", "Django", "Spring Boot",
    "Database Design", "Microservices", "Docker", "AWS",
  ],
  "DevOps Engineer": [
    "AWS", "Docker", "Kubernetes", "CI/CD", "Linux",
    "Terraform", "Ansible", "Jenkins", "Git", "Nginx",
    "Monitoring", "CloudFormation", "GCP",
  ],
  "Product Manager": [
    "Product Strategy", "Agile", "Scrum", "Stakeholder Management",
    "User Research", "Data Analysis", "Roadmap", "SQL",
    "Presentation", "Requirements Gathering",
  ],
  "UX Designer": [
    "Figma", "User Research", "Wireframing", "Prototyping",
    "Usability Testing", "Adobe XD", "User Personas",
    "Interaction Design", "Typography",
  ],
  "Machine Learning Engineer": [
    "Python", "Machine Learning", "TensorFlow", "PyTorch",
    "Scikit-Learn", "Statistics", "Deep Learning",
    "Data Processing", "API Development", "Docker", "AWS",
    "NumPy", "Pandas", "Model Deployment",
  ],
  "Cybersecurity Analyst": [
    "Network Security", "Ethical Hacking", "Penetration Testing",
    "SIEM", "Incident Response", "Risk Assessment",
    "Firewalls", "Cryptography", "Linux", "Python",
  ],
  "Software Engineer": [
    "Java", "Python", "JavaScript", "Data Structures",
    "Algorithms", "OOP", "System Design", "SQL",
    "Git", "Software Engineering", "Testing",
  ],
  "Business Analyst": [
    "SQL", "Excel", "Data Analysis", "Requirements Gathering",
    "Stakeholder Management", "Process Modeling", "PowerPoint",
    "Tableau", "Python", "Documentation",
  ],
  "Cloud Engineer": [
    "AWS", "Azure", "GCP", "Docker", "Kubernetes",
    "Terraform", "Linux", "CI/CD", "Networking",
    "Cloud Security", "Load Balancing",
  ],
};

const normalizeSkill = (s) => String(s || "").trim().toLowerCase();

export const getRequiredSkillsForRole = (role) => {
  const key = Object.keys(ROLE_SKILL_MAP).find(
    (k) => k.toLowerCase() === String(role).toLowerCase()
  );
  if (key) return ROLE_SKILL_MAP[key];
  return null;
};

export const skillToRoleMap = (skill) => {
  const normalized = normalizeSkill(skill);
  const roles = [];
  for (const [role, skills] of Object.entries(ROLE_SKILL_MAP)) {
    if (skills.some((s) => normalizeSkill(s) === normalized)) {
      roles.push(role);
    }
  }
  return roles;
};

export const getAllKnownRoles = () => Object.keys(ROLE_SKILL_MAP);

export const getSkillFrequency = () => {
  const freq = {};
  for (const skills of Object.values(ROLE_SKILL_MAP)) {
    for (const skill of skills) {
      const key = normalizeSkill(skill);
      freq[key] = (freq[key] || 0) + 1;
    }
  }
  return freq;
};

export default {
  ROLE_SKILL_MAP,
  getRequiredSkillsForRole,
  skillToRoleMap,
  getAllKnownRoles,
  getSkillFrequency,
};

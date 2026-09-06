import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import Recruiter from "../models/RecruiterModel.js";
import Application from "../models/ApplicationModel.js";
import Course from "../models/Course.js";
import CourseEnrollment from "../models/CourseEnrollment.js";
import SkillAssessment from "../models/SkillAssessmentModel.js";
import PortfolioItem from "../models/PortfolioItemModel.js";
import InternshipProgress from "../models/InternshipProgressModel.js";
import Opportunity from "../models/OpportunityModel.js";
import CareerPathway from "../models/CareerPathwayModel.js";
import LearningResource from "../models/LearningResourceModel.js";
import LearningPlatform from "../models/LearningPlatformModel.js";
import { Question, AssessmentTemplate } from "../models/QuestionBankModel.js";
import Assessment from "../models/AssessmentModel.js";
import AssessmentCandidate from "../models/AssessmentCandidateModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import AptitudeTest from "../models/AptitudeTest.js";
import AptitudeAttempt from "../models/AptitudeAttempt.js";
import MentorshipSession from "../models/MentorshipSessionModel.js";
import Notification from "../models/NotificationModel.js";
import Workshop from "../models/Workshop.js";
import WorkshopRegistration from "../models/WorkshopRegistration.js";
import GuestLecture from "../models/GuestLecture.js";
import GuestLectureRegistration from "../models/GuestLectureRegistration.js";
import InnovationChallenge from "../models/InnovationChallenge.js";
import ChallengeRegistration from "../models/ChallengeRegistration.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";
import ProjectApplication from "../models/ProjectApplication.js";
import Post from "../models/PostModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const RESUME_DIR = path.join(__dirname, "..", "uploads", "resumes");
const EMAIL_DOMAIN = "bulk.campus2career.com";
const STUDENT_COUNT = 80;
const STUDENT_PASSWORD = "Student@1234";
const RECRUITER_PASSWORD = "Recruiter@1234";
const MENTOR_PASSWORD = "Mentor@1234";

const FIRST_NAMES = [
  "Aarav", "Diya", "Kabir", "Ananya", "Vivaan", "Isha", "Aditya", "Saanvi", "Arjun", "Meera",
  "Rohan", "Kiara", "Ishaan", "Nisha", "Dev", "Pooja", "Yash", "Riya", "Ayaan", "Tara",
  "Krish", "Anika", "Siddharth", "Neha", "Harsh", "Priya", "Nikhil", "Sneha", "Varun", "Aditi",
  "Rahul", "Kavya", "Manav", "Shreya", "Aryan", "Tanvi", "Kunal", "Ira", "Samar", "Myra"
];
const LAST_NAMES = [
  "Sharma", "Patel", "Reddy", "Nair", "Iyer", "Khan", "Gupta", "Singh", "Mehta", "Joshi",
  "Desai", "Kulkarni", "Rao", "Banerjee", "Chatterjee", "Pillai", "Menon", "Agarwal", "Verma", "Malhotra"
];

const TRACKS = [
  {
    key: "fullstack",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    specialization: "Web Engineering",
    interests: ["Web Development", "Product Engineering", "Open Source"],
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB", "REST APIs", "Git", "HTML", "CSS"],
    extra: ["Docker", "GraphQL", "Next.js"],
    gaps: ["System Design", "AWS"],
    projects: [
      { title: "Campus Placement Portal", description: "MERN app for job posting, applications, and mentor approvals.", technologies: ["React", "Node.js", "MongoDB"], githubLink: "https://github.com/demo/campus-portal" },
      { title: "Realtime Chat", description: "Socket.io chat with rooms and typing indicators.", technologies: ["Node.js", "React"], githubLink: "https://github.com/demo/chat" }
    ]
  },
  {
    key: "data",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    specialization: "Data Science",
    interests: ["Analytics", "Business Intelligence", "Visualization"],
    skills: ["Python", "SQL", "Data Analysis", "Excel", "Tableau", "Statistics", "Pandas", "Power BI"],
    extra: ["Spark", "dbt"],
    gaps: ["Machine Learning", "Cloud Computing"],
    projects: [
      { title: "Placement Insights Dashboard", description: "Tableau dashboards for placement conversion and skill gaps.", technologies: ["Python", "SQL", "Tableau"], githubLink: "https://github.com/demo/placement-insights" },
      { title: "Sales Forecasting Notebook", description: "Time-series analysis of campus store sales.", technologies: ["Python", "Pandas"], githubLink: "https://github.com/demo/sales-forecast" }
    ]
  },
  {
    key: "ml",
    department: "Computer Science",
    course: "B.Tech Artificial Intelligence",
    specialization: "Machine Learning",
    interests: ["Artificial Intelligence", "NLP", "Computer Vision"],
    skills: ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "Statistics", "SQL", "Data Analysis"],
    extra: ["PyTorch", "NLP", "MLOps"],
    gaps: ["Kubernetes", "Spark"],
    projects: [
      { title: "Resume Skill Extractor", description: "NLP pipeline that extracts skills from student resumes.", technologies: ["Python", "NLP", "FastAPI"], githubLink: "https://github.com/demo/resume-nlp" },
      { title: "Job Match Ranker", description: "Ranking model that scores students against job skill vectors.", technologies: ["Python", "scikit-learn"], githubLink: "https://github.com/demo/job-ranker" }
    ]
  },
  {
    key: "devops",
    department: "Information Technology",
    course: "B.Tech Information Technology",
    specialization: "Cloud & DevOps",
    interests: ["Cloud Computing", "SRE", "Automation"],
    skills: ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS", "Python", "Git"],
    extra: ["Terraform", "Ansible"],
    gaps: ["Azure", "Cost Optimization"],
    projects: [
      { title: "GitHub Actions Pipeline", description: "CI/CD for a Node API with Docker and health checks.", technologies: ["Docker", "GitHub Actions", "AWS"], githubLink: "https://github.com/demo/ci-cd" }
    ]
  },
  {
    key: "cyber",
    department: "Information Technology",
    course: "B.Tech Information Technology",
    specialization: "Cybersecurity",
    interests: ["Ethical Hacking", "SOC", "Cloud Security"],
    skills: ["Networking", "Linux", "Ethical Hacking", "SIEM", "Risk Assessment", "Python"],
    extra: ["Cloud Security", "Forensics"],
    gaps: ["CISSP", "Incident Response"],
    projects: [
      { title: "Campus SOC Lite", description: "Log pipeline that flags suspicious SSH activity.", technologies: ["Python", "Linux", "SIEM"], githubLink: "https://github.com/demo/soc-lite" }
    ]
  },
  {
    key: "embedded",
    department: "Electronics & Communication",
    course: "B.Tech ECE",
    specialization: "Embedded Systems",
    interests: ["IoT", "Firmware", "Robotics"],
    skills: ["C", "C++", "Microcontrollers", "RTOS", "Electronics", "Python"],
    extra: ["IoT Protocols", "PCB Design"],
    gaps: ["FPGA", "ROS"],
    projects: [
      { title: "Smart Irrigation Node", description: "ESP32 firmware with soil moisture telemetry.", technologies: ["C", "Microcontrollers", "MQTT"], githubLink: "https://github.com/demo/irrigation" }
    ]
  },
  {
    key: "design",
    department: "Computer Science",
    course: "B.Des / B.Tech CSE",
    specialization: "Human Computer Interaction",
    interests: ["UI/UX", "Product Design", "Accessibility"],
    skills: ["Figma", "User Research", "Wireframing", "Prototyping", "Communication", "HTML", "CSS"],
    extra: ["Motion Design", "Design Systems"],
    gaps: ["React", "Usability Testing"],
    projects: [
      { title: "Career App Redesign", description: "End-to-end UX case study for a student career dashboard.", technologies: ["Figma", "User Research"], githubLink: "https://github.com/demo/career-ux" }
    ]
  },
  {
    key: "product",
    department: "Computer Science",
    course: "B.Tech Computer Science",
    specialization: "Product Management",
    interests: ["Product Strategy", "Startups", "Analytics"],
    skills: ["Product Strategy", "Agile", "Data Analysis", "Communication", "Problem Solving", "SQL", "Excel"],
    extra: ["A/B Testing", "UX Design"],
    gaps: ["SQL", "Market Research"],
    projects: [
      { title: "Placement Funnel PRD", description: "PRD and metrics for improving internship conversion.", technologies: ["Excel", "SQL", "Figma"], githubLink: "https://github.com/demo/placement-prd" }
    ]
  }
];

const COMPANIES = [
  { slug: "nimbus", legalName: "Nimbus Labs Private Limited", displayName: "Nimbus Labs", website: "https://nimbuslabs.example", industry: "SaaS", companySize: "51-200", headquarters: "Bengaluru", city: "Bengaluru", state: "Karnataka", description: "Builds collaboration software for mid-market teams." },
  { slug: "orbit", legalName: "Orbit Analytics Pvt Ltd", displayName: "Orbit Analytics", website: "https://orbitanalytics.example", industry: "Analytics & AI", companySize: "201-1000", headquarters: "Hyderabad", city: "Hyderabad", state: "Telangana", description: "Decision intelligence platform for retail and fintech." },
  { slug: "harbor", legalName: "Harbor Cloud Technologies", displayName: "Harbor Cloud", website: "https://harborcloud.example", industry: "Cloud Computing", companySize: "201-1000", headquarters: "Pune", city: "Pune", state: "Maharashtra", description: "Managed Kubernetes and cloud cost optimisation." },
  { slug: "sentinel", legalName: "Sentinel Secure Systems", displayName: "Sentinel Secure", website: "https://sentinelsecure.example", industry: "Information Security", companySize: "51-200", headquarters: "Chennai", city: "Chennai", state: "Tamil Nadu", description: "Managed SOC and vulnerability assessment services." },
  { slug: "pixel", legalName: "PixelCraft Studio LLP", displayName: "PixelCraft", website: "https://pixelcraft.example", industry: "Design & Technology", companySize: "11-50", headquarters: "Mumbai", city: "Mumbai", state: "Maharashtra", description: "Product design studio for consumer apps." },
  { slug: "forge", legalName: "Forge Embedded Pvt Ltd", displayName: "Forge Embedded", website: "https://forgeembedded.example", industry: "Electronics & IoT", companySize: "51-200", headquarters: "Coimbatore", city: "Coimbatore", state: "Tamil Nadu", description: "Industrial IoT firmware and hardware reference designs." },
  { slug: "lumen", legalName: "Lumen Product Labs", displayName: "Lumen Labs", website: "https://lumenlabs.example", industry: "Technology", companySize: "11-50", headquarters: "Gurugram", city: "Gurugram", state: "Haryana", description: "Early-stage product studio hiring PMs and analysts." },
  { slug: "quantum", legalName: "QuantumHire Solutions", displayName: "QuantumHire", website: "https://quantumhire.example", industry: "Information Technology", companySize: "1000+", headquarters: "Noida", city: "Noida", state: "Uttar Pradesh", description: "IT services and campus hiring partner." },
  { slug: "aurora", legalName: "Aurora Fintech Services", displayName: "Aurora Fintech", website: "https://aurorafin.example", industry: "Consulting & Finance", companySize: "201-1000", headquarters: "Mumbai", city: "Mumbai", state: "Maharashtra", description: "Digital banking analytics and KYC automation." },
  { slug: "vertex", legalName: "Vertex Mobility Pvt Ltd", displayName: "Vertex Mobility", website: "https://vertexmobility.example", industry: "Technology", companySize: "51-200", headquarters: "Bengaluru", city: "Bengaluru", state: "Karnataka", description: "EV fleet software and mobile apps." },
  { slug: "indigo", legalName: "Indigo HealthTech", displayName: "Indigo HealthTech", website: "https://indigohealth.example", industry: "Healthcare Tech", companySize: "51-200", headquarters: "Hyderabad", city: "Hyderabad", state: "Telangana", description: "Hospital workflow and ML diagnostics tools." },
  { slug: "cedar", legalName: "Cedar EduWorks", displayName: "Cedar EduWorks", website: "https://cedaredu.example", industry: "EdTech", companySize: "11-50", headquarters: "Pune", city: "Pune", state: "Maharashtra", description: "Adaptive learning products for engineering colleges." }
];

const JOB_TEMPLATES = [
  { track: "fullstack", title: "Frontend Developer Intern", skills: ["JavaScript", "React", "REST APIs", "HTML", "CSS"], stipend: "₹22,000/month" },
  { track: "fullstack", title: "Full Stack Engineer Trainee", skills: ["JavaScript", "React", "Node.js", "MongoDB"], stipend: "₹28,000/month" },
  { track: "data", title: "Data Analyst Intern", skills: ["Python", "SQL", "Data Analysis", "Excel"], stipend: "₹25,000/month" },
  { track: "data", title: "Business Intelligence Associate", skills: ["SQL", "Tableau", "Power BI", "Excel"], stipend: "₹30,000/month" },
  { track: "ml", title: "ML Engineer Intern", skills: ["Python", "Machine Learning", "TensorFlow", "Statistics"], stipend: "₹32,000/month" },
  { track: "ml", title: "NLP Research Intern", skills: ["Python", "NLP", "Deep Learning", "Machine Learning"], stipend: "₹30,000/month" },
  { track: "devops", title: "DevOps Intern", skills: ["Linux", "Docker", "CI/CD", "AWS"], stipend: "₹26,000/month" },
  { track: "devops", title: "Cloud Support Engineer", skills: ["AWS", "Linux", "Python", "Kubernetes"], stipend: "4.5 LPA" },
  { track: "cyber", title: "SOC Analyst Intern", skills: ["Networking", "SIEM", "Linux", "Risk Assessment"], stipend: "₹24,000/month" },
  { track: "embedded", title: "Firmware Engineer Intern", skills: ["C", "C++", "Microcontrollers", "RTOS"], stipend: "₹23,000/month" },
  { track: "design", title: "UI/UX Design Intern", skills: ["Figma", "User Research", "Wireframing", "Prototyping"], stipend: "₹20,000/month" },
  { track: "product", title: "Associate Product Manager Intern", skills: ["Product Strategy", "Agile", "Data Analysis", "Communication"], stipend: "₹35,000/month" }
];

const EXTRA_PATHWAYS = [
  { role: "NLP Engineer", industry: "Analytics & AI", description: "Build language models and text understanding systems.", requiredSkills: ["Python", "NLP", "Deep Learning", "Machine Learning"], niceToHaveSkills: ["PyTorch", "Transformers"], averageSalaryLPA: 14, demandLevel: "very_high", certifications: ["Hugging Face NLP"] },
  { role: "Site Reliability Engineer", industry: "Cloud Computing", description: "Keep production systems reliable and observable.", requiredSkills: ["Linux", "Kubernetes", "CI/CD", "Python"], niceToHaveSkills: ["Terraform", "Prometheus"], averageSalaryLPA: 16, demandLevel: "high", certifications: ["CKA", "AWS SysOps"] },
  { role: "SOC Analyst", industry: "Information Security", description: "Monitor, triage, and respond to security events.", requiredSkills: ["Networking", "SIEM", "Linux", "Risk Assessment"], niceToHaveSkills: ["Python", "Forensics"], averageSalaryLPA: 8, demandLevel: "high", certifications: ["CompTIA Security+", "CySA+"] },
  { role: "Firmware Engineer", industry: "Electronics & IoT", description: "Ship reliable embedded software for connected devices.", requiredSkills: ["C", "C++", "Microcontrollers", "RTOS"], niceToHaveSkills: ["Python", "IoT Protocols"], averageSalaryLPA: 8, demandLevel: "medium", certifications: ["ARM Accredited Engineer"] }
];

const COURSES = [
  { title: "React 18 Professional Path", provider: "Meta", platform: "Coursera", skills: ["React", "JavaScript", "HTML", "CSS"], duration: "8 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.coursera.org" },
  { title: "Node.js API Engineering", provider: "Udemy", platform: "Udemy", skills: ["Node.js", "REST APIs", "MongoDB"], duration: "6 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.udemy.com" },
  { title: "SQL for Analysts", provider: "Mode", platform: "Coursera", skills: ["SQL", "Data Analysis"], duration: "4 weeks", level: "beginner", isFree: true, externalUrl: "https://www.coursera.org" },
  { title: "Python Data Wrangling", provider: "DataCamp", platform: "DataCamp", skills: ["Python", "Pandas", "Data Analysis"], duration: "5 weeks", level: "beginner", isFree: false, externalUrl: "https://www.datacamp.com" },
  { title: "Intro to Machine Learning", provider: "Stanford", platform: "Coursera", skills: ["Machine Learning", "Python", "Statistics"], duration: "11 weeks", level: "intermediate", isFree: true, externalUrl: "https://www.coursera.org" },
  { title: "Deep Learning with TensorFlow", provider: "DeepLearning.AI", platform: "Coursera", skills: ["Deep Learning", "TensorFlow", "Python"], duration: "12 weeks", level: "advanced", isFree: false, externalUrl: "https://www.coursera.org" },
  { title: "Docker for Developers", provider: "Udemy", platform: "Udemy", skills: ["Docker", "Linux", "CI/CD"], duration: "3 weeks", level: "beginner", isFree: false, externalUrl: "https://www.udemy.com" },
  { title: "Kubernetes Fundamentals", provider: "The Linux Foundation", platform: "edX", skills: ["Kubernetes", "Docker", "Linux"], duration: "8 weeks", level: "intermediate", isFree: true, externalUrl: "https://www.edx.org" },
  { title: "AWS Cloud Practitioner", provider: "AWS", platform: "AWS Training", skills: ["AWS", "Cloud Computing"], duration: "2 weeks", level: "beginner", isFree: true, externalUrl: "https://aws.amazon.com/training" },
  { title: "Practical Ethical Hacking", provider: "TCM", platform: "Udemy", skills: ["Ethical Hacking", "Networking", "Linux"], duration: "6 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.udemy.com" },
  { title: "Embedded C for Microcontrollers", provider: "NPTEL", platform: "NPTEL", skills: ["C", "Microcontrollers", "Electronics"], duration: "8 weeks", level: "intermediate", isFree: true, externalUrl: "https://nptel.ac.in" },
  { title: "Figma UI Essentials", provider: "Google", platform: "Coursera", skills: ["Figma", "Wireframing", "Prototyping"], duration: "6 weeks", level: "beginner", isFree: false, externalUrl: "https://www.coursera.org" },
  { title: "Product Management Foundations", provider: "Google", platform: "Coursera", skills: ["Product Strategy", "Agile", "Communication"], duration: "10 weeks", level: "beginner", isFree: false, externalUrl: "https://www.coursera.org" },
  { title: "Excel to Power BI", provider: "Microsoft", platform: "Microsoft Learn", skills: ["Excel", "Power BI", "Data Analysis"], duration: "4 weeks", level: "beginner", isFree: true, externalUrl: "https://learn.microsoft.com" },
  { title: "System Design Primer", provider: "Educative", platform: "Educative", skills: ["System Design", "REST APIs", "AWS"], duration: "5 weeks", level: "advanced", isFree: false, externalUrl: "https://www.educative.io" },
  { title: "Communication for Engineers", provider: "Coursera", platform: "Coursera", skills: ["Communication", "Teamwork"], duration: "3 weeks", level: "beginner", isFree: true, externalUrl: "https://www.coursera.org" }
];

const EXTRA_RESOURCES = [
  { title: "TypeScript Handbook Path", provider: "Microsoft", type: "tutorial", skills: ["TypeScript", "JavaScript"], url: "https://www.typescriptlang.org/docs/", durationHours: 12, isFree: true, level: "intermediate" },
  { title: "Kaggle Intro to ML", provider: "Kaggle", type: "course", skills: ["Machine Learning", "Python"], url: "https://www.kaggle.com/learn/intro-to-machine-learning", durationHours: 8, isFree: true, level: "beginner" },
  { title: "OWASP Top 10 Workshop Notes", provider: "OWASP", type: "workshop", skills: ["Ethical Hacking", "Networking"], url: "https://owasp.org/www-project-top-ten/", durationHours: 6, isFree: true, level: "intermediate" },
  { title: "Figma for Engineers", provider: "Figma", type: "tutorial", skills: ["Figma", "Prototyping"], url: "https://help.figma.com", durationHours: 5, isFree: true, level: "beginner" }
];

const EXTRA_PLATFORMS = [
  { name: "Kaggle Learn", provider: "Kaggle", type: "mooc", description: "Hands-on micro-courses for data and ML.", website: "https://www.kaggle.com/learn", supportedSkills: ["Python", "Machine Learning", "SQL"], integrationStatus: "connected" },
  { name: "Microsoft Learn", provider: "Microsoft", type: "certification", description: "Role-based learning paths for Azure, Power BI, and M365.", website: "https://learn.microsoft.com", supportedSkills: ["Azure", "Power BI", "Excel"], integrationStatus: "connected" },
  { name: "Hugging Face Courses", provider: "Hugging Face", type: "mooc", description: "Open NLP and LLM courses with notebooks.", website: "https://huggingface.co/learn", supportedSkills: ["NLP", "Python", "Deep Learning"], integrationStatus: "pending" }
];

const EXTRA_QUESTIONS = [
  { text: "Which hook fetches data after the first render in React?", category: "technical", skill: "React", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "useMemo", isCorrect: false }, { text: "useEffect", isCorrect: true }, { text: "useRef", isCorrect: false }, { text: "useId", isCorrect: false }] },
  { text: "MongoDB stores documents primarily in which format?", category: "technical", skill: "MongoDB", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "XML", isCorrect: false }, { text: "BSON", isCorrect: true }, { text: "CSV", isCorrect: false }, { text: "Parquet", isCorrect: false }] },
  { text: "Docker images are built from a file commonly named:", category: "technical", skill: "Docker", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "Makefile", isCorrect: false }, { text: "Dockerfile", isCorrect: true }, { text: "Podfile", isCorrect: false }, { text: "Jenkinsfile", isCorrect: false }] },
  { text: "Gradient descent is used to:", category: "technical", skill: "Machine Learning", type: "mcq", difficulty: "medium", marks: 2, options: [{ text: "Increase training loss", isCorrect: false }, { text: "Optimize model parameters", isCorrect: true }, { text: "Split datasets", isCorrect: false }, { text: "Encode labels", isCorrect: false }] },
  { text: "A PRIMARY KEY in SQL must be:", category: "technical", skill: "SQL", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "Nullable and duplicated", isCorrect: false }, { text: "Unique and not null", isCorrect: true }, { text: "A floating index only", isCorrect: false }, { text: "Always a UUID", isCorrect: false }] },
  { text: "Rate your ability to debug production incidents under time pressure", category: "soft", skill: "Problem Solving", type: "rating", difficulty: "medium", marks: 2, options: [] },
  { text: "In C, pointers store:", category: "technical", skill: "C", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "Only integers", isCorrect: false }, { text: "Memory addresses", isCorrect: true }, { text: "File handles only", isCorrect: false }, { text: "CPU registers only", isCorrect: false }] },
  { text: "HTTPS encrypts traffic using:", category: "technical", skill: "Networking", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "FTP only", isCorrect: false }, { text: "TLS", isCorrect: true }, { text: "SMTP", isCorrect: false }, { text: "ICMP", isCorrect: false }] }
];

const APP_STATUSES = [
  "pending mentor approval",
  "pending recruiter review",
  "interview scheduled",
  "rejected by mentor",
  "rejected by recruiter",
  "hired"
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(rand, arr, n) {
  const copy = [...arr];
  const out = [];
  while (copy.length && out.length < n) {
    out.push(copy.splice(Math.floor(rand() * copy.length), 1)[0]);
  }
  return out;
}

function daysFromNow(offset) {
  return new Date(Date.now() + offset * 24 * 60 * 60 * 1000);
}

function pad(n) {
  return String(n).padStart(3, "0");
}

function buildResume({ name, email, phone, track, skills, projects, cgpa, year, department }) {
  return [
    name.toUpperCase(),
    `${email} | ${phone} | https://linkedin.com/in/${email.split("@")[0]} | https://github.com/${email.split("@")[0]}`,
    "",
    "SUMMARY",
    `${year} ${department} student targeting ${track.key} roles. CGPA ${cgpa}. Comfortable with ${skills.slice(0, 5).join(", ")}.`,
    "",
    "SKILLS",
    skills.join(", "),
    "",
    "PROJECTS",
    ...projects.map((p) => `- ${p.title}: ${p.description} [${(p.technologies || []).join(", ")}] ${p.githubLink || ""}`),
    "",
    "EDUCATION",
    `B.Tech, ${department} | Demo Institute | CGPA ${cgpa}`,
    "",
    "CERTIFICATIONS",
    `- Campus2Career Skill Assessment (${track.key})`,
    ""
  ].join("\n");
}

async function ensureAdmin() {
  let admin = await User.findOne({ role: "admin" });
  if (admin) return admin;
  const password = await bcrypt.hash("Admin@1234", 12);
  await User.collection.insertOne({
    name: "Admin User",
    email: "admin@campus2career.com",
    password,
    role: "admin",
    status: "active",
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return User.findOne({ email: "admin@campus2career.com" });
}

async function cleanupPreviousBulk() {
  const bulkUsers = await User.find({ email: new RegExp(`@${EMAIL_DOMAIN}$`, "i") }).select("_id");
  const ids = bulkUsers.map((u) => u._id);
  if (ids.length) {
    await Promise.all([
      Application.deleteMany({ $or: [{ student: { $in: ids } }, { recruiter: { $in: ids } }, { mentor: { $in: ids } }] }),
      Job.deleteMany({ recruiter: { $in: ids } }),
      Recruiter.deleteMany({ user: { $in: ids } }),
      CourseEnrollment.deleteMany({ student: { $in: ids } }),
      SkillAssessment.deleteMany({ student: { $in: ids } }),
      PortfolioItem.deleteMany({ owner: { $in: ids } }),
      InternshipProgress.deleteMany({ student: { $in: ids } }),
      AssessmentCandidate.deleteMany({ candidate: { $in: ids } }),
      AssessmentAttempt.deleteMany({ student: { $in: ids } }),
      AptitudeAttempt.deleteMany({ student: { $in: ids } }),
      MentorshipSession.deleteMany({ $or: [{ student: { $in: ids } }, { mentor: { $in: ids } }] }),
      Notification.deleteMany({ $or: [{ recipient: { $in: ids } }, { sender: { $in: ids } }] }),
      WorkshopRegistration.deleteMany({ student: { $in: ids } }),
      GuestLectureRegistration.deleteMany({ student: { $in: ids } }),
      ChallengeRegistration.deleteMany({ student: { $in: ids } }),
      ProjectApplication.deleteMany({ student: { $in: ids } }),
      Opportunity.deleteMany({ provider: { $in: ids } }),
      Assessment.deleteMany({ $or: [{ recruiter: { $in: ids } }, { createdBy: { $in: ids } }] }),
      Workshop.deleteMany({ createdBy: { $in: ids } }),
      GuestLecture.deleteMany({ createdBy: { $in: ids } }),
      InnovationChallenge.deleteMany({ createdBy: { $in: ids } }),
      LiveIndustryProject.deleteMany({ createdBy: { $in: ids } }),
      Post.deleteMany({ createdBy: { $in: ids } }),
      User.deleteMany({ _id: { $in: ids } })
    ]);
    console.log(`🧹 Removed ${ids.length} previous bulk users and related records`);
  }

  await Course.deleteMany({ thumbnail: "bulk-dataset" });
  await Question.deleteMany({ tags: "bulk-dataset" });
  await AssessmentTemplate.deleteMany({ title: /^Bulk Dataset/ });
  await AptitudeTest.deleteMany({ title: /^Bulk Dataset/ });
  await CareerPathway.deleteMany({ role: { $in: EXTRA_PATHWAYS.map((p) => p.role) } });
  await LearningResource.deleteMany({ title: { $in: EXTRA_RESOURCES.map((r) => r.title) } });
  await LearningPlatform.deleteMany({ name: { $in: EXTRA_PLATFORMS.map((p) => p.name) } });
}

async function seed({ manageConnection = true } = {}) {
  if (manageConnection) {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/campus2career";
    const atlas = mongoUri.includes("mongodb+srv://") || mongoUri.includes(".mongodb.net");
    await mongoose.connect(mongoUri, {
      ...(atlas ? { tls: true, family: 4 } : {}),
      serverSelectionTimeoutMS: 20000
    });
    console.log(`✅ Connected to MongoDB (${atlas ? "Atlas" : "local"})`);
  }

  await cleanupPreviousBulk();
  const admin = await ensureAdmin();
  const hashedStudent = await bcrypt.hash(STUDENT_PASSWORD, 12);
  const hashedRecruiter = await bcrypt.hash(RECRUITER_PASSWORD, 12);
  const hashedMentor = await bcrypt.hash(MENTOR_PASSWORD, 12);
  const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";
  const rand = rng(42);
  fs.mkdirSync(RESUME_DIR, { recursive: true });

  for (const pathway of EXTRA_PATHWAYS) {
    await CareerPathway.create(pathway);
  }
  await LearningResource.insertMany(EXTRA_RESOURCES);
  for (const platform of EXTRA_PLATFORMS) {
    await LearningPlatform.create(platform);
  }
  const extraQuestions = await Question.insertMany(EXTRA_QUESTIONS.map((q) => ({ ...q, tags: ["bulk-dataset"], createdBy: admin._id })));
  const allQuestions = await Question.find({ isActive: { $ne: false } }).select("_id");
  const screeningTemplate = await AssessmentTemplate.create({
    title: "Bulk Dataset Campus Screening",
    description: "Mixed technical, aptitude, and soft-skill screen used by demo recruiters.",
    questions: allQuestions.map((q) => q._id),
    timeLimitMinutes: 25,
    passingScore: 55,
    createdBy: admin._id
  });

  const mentorDocs = [];
  const mentorSpecs = [
    ["Dr. Kavita Rao", "Computer Science"],
    ["Dr. Anil Deshmukh", "Computer Science"],
    ["Prof. Farhan Qureshi", "Information Technology"],
    ["Dr. Leela Krishnan", "Information Technology"],
    ["Prof. Snehal Patil", "Electronics & Communication"],
    ["Dr. Mohan Iyer", "Electronics & Communication"]
  ];
  mentorSpecs.forEach(([name, department], i) => {
    mentorDocs.push({
      name,
      email: `mentor.${pad(i + 1)}@${EMAIL_DOMAIN}`,
      password: hashedMentor,
      role: "mentor",
      status: "active",
      department,
      isActive: true,
      isVerified: true,
      institution: "Demo Institute",
      designation: "Associate Professor",
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  await User.collection.insertMany(mentorDocs);
  const mentors = await User.find({ email: new RegExp(`^mentor\\.\\d+@${EMAIL_DOMAIN}$`, "i") });

  const recruiterUserDocs = COMPANIES.map((c, i) => ({
    name: `${c.displayName} Talent`,
    email: `recruiter.${c.slug}@${EMAIL_DOMAIN}`,
    password: hashedRecruiter,
    role: "recruiter",
    status: "active",
    company: c.displayName,
    phone: `98${String(10000000 + i).slice(-8)}`,
    isActive: true,
    isVerified: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }));
  await User.collection.insertMany(recruiterUserDocs);
  const recruiterUsers = await User.find({ email: new RegExp(`^recruiter\\..+@${EMAIL_DOMAIN}$`, "i") });
  const recruiterBySlug = {};
  for (const company of COMPANIES) {
    const user = recruiterUsers.find((u) => u.email === `recruiter.${company.slug}@${EMAIL_DOMAIN}`);
    recruiterBySlug[company.slug] = user;
    await Recruiter.create({
      user: user._id,
      companyProfile: {
        legalName: company.legalName,
        displayName: company.displayName,
        website: company.website,
        industry: company.industry,
        companySize: company.companySize,
        headquarters: company.headquarters,
        description: company.description
      },
      contactInfo: {
        primaryContact: user.name,
        phone: user.phone,
        alternateEmail: `hr@${company.slug}.example`,
        address: {
          street: `${10 + COMPANIES.indexOf(company)} Industry Park`,
          city: company.city,
          state: company.state,
          zipCode: String(400000 + COMPANIES.indexOf(company)),
          country: "India"
        }
      },
      documents: {
        registrationCertificate: `https://docs.example/${company.slug}/cin.pdf`,
        taxId: `GSTIN${pad(COMPANIES.indexOf(company) + 1)}`
      },
      verificationStatus: "verified",
      verifiedAt: new Date(),
      verifiedBy: admin._id,
      isActive: true
    });
  }

  const studentDocs = [];
  for (let i = 0; i < STUDENT_COUNT; i += 1) {
    const track = TRACKS[i % TRACKS.length];
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    const name = `${first} ${last}`;
    const email = `student.${pad(i + 1)}@${EMAIL_DOMAIN}`;
    const cgpa = Number((6.2 + (i % 37) * 0.1).toFixed(1));
    const year = i % 5 === 0 ? "2nd" : i % 3 === 0 ? "4th" : "3rd";
    const skills = [...track.skills];
    if (rand() > 0.45) skills.push(...pickN(rand, track.extra, 1 + Math.floor(rand() * track.extra.length)));
    const mentor = mentors.find((m) => m.department === track.department) || mentors[0];
    const placed = i % 7 === 0;
    const projects = track.projects.map((p) => ({ ...p, githubLink: `${p.githubLink}-${i + 1}` }));
    const phone = `9${String(700000000 + i).slice(-9)}`;
    const resumeFile = `bulk-${pad(i + 1)}.txt`;
    const resumeText = buildResume({
      name, email, phone, track, skills, projects, cgpa, year, department: track.department
    });
    fs.writeFileSync(path.join(RESUME_DIR, resumeFile), resumeText, "utf8");

    studentDocs.push({
      name,
      email,
      password: hashedStudent,
      role: "student",
      status: "active",
      department: track.department,
      course: track.course,
      specialization: track.specialization,
      year,
      rollNo: `BULK${track.key.slice(0, 2).toUpperCase()}${pad(i + 1)}`,
      cgpa,
      backlogs: i % 11 === 0 ? 1 : 0,
      skills,
      interests: track.interests,
      institution: "Demo Institute",
      assignedMentor: mentor._id,
      phone,
      phoneVerified: true,
      isActive: true,
      isVerified: true,
      resumeUrl: `${backendUrl}/uploads/resumes/${resumeFile}`,
      coverLetter: resumeText,
      profileUrl: `https://portfolio.example/${email.split("@")[0]}`,
      socialLinks: {
        linkedin: `https://linkedin.com/in/${email.split("@")[0]}`,
        github: `https://github.com/${email.split("@")[0]}`,
        leetcode: i % 2 === 0 ? `https://leetcode.com/${email.split("@")[0]}` : "",
        hackerrank: i % 3 === 0 ? `https://hackerrank.com/${email.split("@")[0]}` : ""
      },
      projects,
      experiences: i % 2 === 0 ? [{
        company: pick(rand, COMPANIES).displayName,
        role: `${track.key} intern`,
        startDate: daysFromNow(-200),
        endDate: daysFromNow(-110),
        currentlyWorking: false,
        description: `Worked on ${skills.slice(0, 3).join(", ")} deliverables.`
      }] : [],
      certifications: [
        { name: `${track.key} foundations`, issuer: "Campus2Career", date: daysFromNow(-40) }
      ],
      skillProfile: {
        strengths: skills.slice(0, 4),
        gaps: track.gaps,
        lastAssessedAt: daysFromNow(-3 - (i % 10))
      },
      isPlaced: placed,
      placementDetails: placed ? {
        company: pick(rand, COMPANIES).displayName,
        roleOffered: JOB_TEMPLATES.find((j) => j.track === track.key)?.title || "Engineer",
        package: `${6 + (i % 8)} LPA`,
        offerDate: daysFromNow(-20)
      } : undefined,
      portfolioVisibility: i % 4 === 0 ? "public" : "institution",
      profileCompletion: 78 + (i % 22),
      reputationPoints: 40 + skills.length * 6 + projects.length * 20,
      badges: placed ? ["Placed", "Top Performer"] : i % 5 === 0 ? ["Hackathon Winner"] : ["Active Learner"],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  await User.collection.insertMany(studentDocs);
  const students = await User.find({ email: new RegExp(`^student\\.\\d+@${EMAIL_DOMAIN}$`, "i") }).sort({ email: 1 });
  console.log(`✅ Inserted ${students.length} students, ${recruiterUsers.length} recruiters, ${mentors.length} mentors`);

  const jobs = [];
  for (const company of COMPANIES) {
    const recruiter = recruiterBySlug[company.slug];
    const start = COMPANIES.indexOf(company) % JOB_TEMPLATES.length;
    const unique = [0, 1, 2].map((offset) => JOB_TEMPLATES[(start + offset) % JOB_TEMPLATES.length]);
    for (const template of unique) {
      const job = await Job.create({
        title: template.title,
        description: `${company.displayName} is hiring a ${template.title} to work on production ${template.track} problems. You will collaborate with mentors and ship weekly demos.`,
        rolesResponsibilities: `Own assigned ${template.track} deliverables, write tests, and present progress in stand-ups.`,
        location: company.city,
        skillsRequired: template.skills,
        stipend: template.stipend,
        recruiter: recruiter._id,
        isActive: true,
        status: "approved"
      });
      jobs.push({ job, company, template, recruiter });
    }
  }
  console.log(`✅ Inserted ${jobs.length} jobs`);

  const applications = [];
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const track = TRACKS[i % TRACKS.length];
    const preferred = jobs.filter((j) => j.template.track === track.key);
    const others = jobs.filter((j) => j.template.track !== track.key);
    const targets = [...preferred.slice(0, 2), ...pickN(rand, others, 1)];
    for (const [idx, target] of targets.entries()) {
      const status = APP_STATUSES[(i + idx) % APP_STATUSES.length];
      try {
        const application = await Application.create({
          student: student._id,
          job: target.job._id,
          mentor: student.assignedMentor,
          recruiter: target.recruiter._id,
          status,
          studentNote: `Applying from the ${track.key} track. Skills: ${student.skills.slice(0, 4).join(", ")}.`,
          mentorNote: status === "rejected by mentor" ? "Profile incomplete for this role." : "Recommended for recruiter review.",
          recruiterNote: status === "hired" ? "Offer rolled out." : status.startsWith("rejected") ? "Skill gap on required stack." : "",
          interviewDate: status === "interview scheduled" ? daysFromNow(7 + (i % 10)) : undefined,
          interviewTime: status === "interview scheduled" ? "11:00" : undefined,
          interviewMode: "online",
          interviewMeetingLink: status === "interview scheduled" ? "https://meet.example/bulk-interview" : undefined
        });
        applications.push(application);
        target.job.applications.push({
          student: student._id,
          status: status === "hired" ? "approved" : status.includes("rejected") ? "rejected" : status === "interview scheduled" ? "interview" : "pending"
        });
      } catch {
        // unique student+job collisions are skipped
      }
    }
  }
  await Promise.all(jobs.map(({ job }) => job.save()));
  console.log(`✅ Inserted ${applications.length} applications`);

  const courseDocs = await Course.insertMany(COURSES.map((c) => ({
    ...c,
    thumbnail: "bulk-dataset",
    certificateAvailable: true,
    rating: 4 + Math.round(rand() * 10) / 10,
    status: "published",
    createdBy: admin._id
  })));

  const enrollments = [];
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const track = TRACKS[i % TRACKS.length];
    const matching = courseDocs.filter((c) => c.skills.some((s) => student.skills.includes(s)));
    const chosen = (matching.length ? matching : courseDocs).slice(0, 3);
    for (const [idx, course] of chosen.entries()) {
      const status = idx === 0 ? "completed" : idx === 1 ? "in_progress" : "not_started";
      enrollments.push({
        student: student._id,
        course: course._id,
        status,
        enrolledAt: daysFromNow(-30 - idx),
        startedAt: status === "not_started" ? undefined : daysFromNow(-20),
        completedAt: status === "completed" ? daysFromNow(-5) : undefined,
        progressPercent: status === "completed" ? 100 : status === "in_progress" ? 45 + (i % 40) : 0,
        certificateUrl: status === "completed" ? `https://certs.example/${student.rollNo}/${course._id}.pdf` : "",
        certificateId: status === "completed" ? `C2C-${student.rollNo}-${idx}` : "",
        certificateIssueDate: status === "completed" ? daysFromNow(-5) : undefined
      });
    }
  }
  await CourseEnrollment.insertMany(enrollments, { ordered: false }).catch(() => {});
  console.log(`✅ Inserted ${courseDocs.length} courses and enrollments`);

  const assessments = [];
  const portfolios = [];
  const internships = [];
  for (let i = 0; i < students.length; i += 1) {
    const student = students[i];
    const track = TRACKS[i % TRACKS.length];
    assessments.push({
      student: student._id,
      interests: track.interests,
      responses: [
        ...student.skills.slice(0, 6).map((skill, idx) => ({ skill, category: "technical", score: 55 + ((i + idx * 7) % 40) })),
        { skill: "Communication", category: "soft", score: 60 + (i % 30) },
        { skill: "Problem Solving", category: "aptitude", score: 58 + (i % 35) }
      ],
      strengths: student.skillProfile.strengths,
      gaps: track.gaps,
      completedAt: daysFromNow(-2 - (i % 8))
    });
    portfolios.push(
      { owner: student._id, type: "project", title: student.projects[0]?.title || `${track.key} capstone`, description: student.projects[0]?.description || "", evidenceUrl: student.projects[0]?.githubLink || "", verified: true, verifiedBy: admin._id, verifiedAt: new Date() },
      { owner: student._id, type: "skill", title: student.skills[0], description: `Primary ${track.key} skill`, verified: i % 2 === 0 },
      { owner: student._id, type: "certificate", title: `${track.key} foundations`, description: "Bulk dataset certificate", issuer: "Campus2Career", evidenceUrl: `https://certs.example/${student.rollNo}`, verified: true }
    );
    internships.push({
      student: student._id,
      mentor: student.assignedMentor,
      institution: "Demo Institute",
      title: `${track.key} internship`,
      organization: pick(rand, COMPANIES).displayName,
      description: `Hands-on ${track.key} work used to validate AI skill mapping.`,
      startDate: daysFromNow(-90),
      endDate: i % 2 === 0 ? daysFromNow(-10) : undefined,
      status: i % 2 === 0 ? "completed" : "ongoing",
      weeklyUpdates: [
        { week: 1, summary: "Onboarding and environment setup.", tasksCompleted: ["Access", "Kickoff"], submittedAt: daysFromNow(-80) },
        { week: 4, summary: "Shipped first milestone.", tasksCompleted: ["Feature slice", "Review"], submittedAt: daysFromNow(-55) }
      ],
      mentorFeedback: [{ by: student.assignedMentor, text: "Steady progress against the learning plan.", rating: 3 + (i % 3), date: daysFromNow(-20) }],
      certificateIssued: i % 2 === 0,
      certificateUrl: i % 2 === 0 ? `https://certs.example/intern/${student.rollNo}` : "",
      certificateNumber: i % 2 === 0 ? `INT-${student.rollNo}` : "",
      skillsGained: student.skills.slice(0, 4),
      finalRating: i % 2 === 0 ? 4 : undefined
    });
  }
  await SkillAssessment.insertMany(assessments);
  await PortfolioItem.insertMany(portfolios);
  await InternshipProgress.insertMany(internships);

  const aptitudeTests = await AptitudeTest.insertMany([
    {
      title: "Bulk Dataset Logical Reasoning",
      description: "Series, analogies, and puzzles for campus screening.",
      category: "logical",
      difficulty: "medium",
      timeLimitMinutes: 20,
      status: "published",
      isPublished: true,
      createdBy: admin._id,
      questions: [
        { question: "Find the next number: 3, 6, 11, 18, 27, ?", options: ["36", "38", "40", "41"], correctAnswer: "38", marks: 2, explanation: "Differences increase by 2." },
        { question: "Cat is to kitten as dog is to ?", options: ["puppy", "pack", "wolf", "bark"], correctAnswer: "puppy", marks: 1 },
        { question: "If all internships are jobs and some jobs are remote, which is true?", options: ["All internships are remote", "Some internships may be jobs", "No jobs are internships", "Remote work is impossible"], correctAnswer: "Some internships may be jobs", marks: 2 }
      ]
    },
    {
      title: "Bulk Dataset Quantitative Aptitude",
      description: "Percentages, speed, and ratios.",
      category: "math",
      difficulty: "medium",
      timeLimitMinutes: 20,
      status: "published",
      isPublished: true,
      createdBy: admin._id,
      questions: [
        { question: "20% of 250 is?", options: ["40", "50", "60", "25"], correctAnswer: "50", marks: 1 },
        { question: "A train covers 90 km in 1.5 hours. Speed?", options: ["45 km/h", "60 km/h", "90 km/h", "120 km/h"], correctAnswer: "60 km/h", marks: 2 },
        { question: "If a:b = 3:4 and b:c = 2:5, a:c is", options: ["3:10", "6:20", "3:5", "2:5"], correctAnswer: "3:10", marks: 2 }
      ]
    },
    {
      title: "Bulk Dataset Technical Basics",
      description: "CS fundamentals used by AI interview prep.",
      category: "technical",
      difficulty: "easy",
      timeLimitMinutes: 15,
      status: "published",
      isPublished: true,
      createdBy: admin._id,
      questions: [
        { question: "Time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: "O(log n)", marks: 2 },
        { question: "HTTP status for created resource?", options: ["200", "201", "204", "400"], correctAnswer: "201", marks: 1 },
        { question: "Which is a NoSQL database?", options: ["PostgreSQL", "MySQL", "MongoDB", "SQLite"], correctAnswer: "MongoDB", marks: 1 }
      ]
    }
  ]);

  const aptitudeAttempts = [];
  for (let i = 0; i < students.length; i += 1) {
    const test = aptitudeTests[i % aptitudeTests.length];
    const answers = test.questions.map((q, questionIndex) => {
      const correct = i % 4 !== 3 || questionIndex === 0;
      return {
        questionIndex,
        selectedOption: correct ? q.correctAnswer : q.options[0],
        isCorrect: correct,
        marksObtained: correct ? q.marks : 0
      };
    });
    const total = answers.reduce((sum, a) => sum + a.marksObtained, 0);
    const max = test.questions.reduce((sum, q) => sum + q.marks, 0);
    const percentage = Math.round((total / max) * 100);
    aptitudeAttempts.push({
      student: students[i]._id,
      test: test._id,
      answers,
      totalMarksObtained: total,
      percentage,
      passed: percentage >= 40,
      startedAt: daysFromNow(-4),
      submittedAt: daysFromNow(-4),
      timeTakenSeconds: 600 + (i % 300)
    });
  }
  await AptitudeAttempt.insertMany(aptitudeAttempts);

  const publishedAssessments = [];
  for (const [idx, company] of COMPANIES.slice(0, 6).entries()) {
    const recruiter = recruiterBySlug[company.slug];
    const relatedJob = jobs.find((j) => j.company.slug === company.slug);
    const assessment = await Assessment.create({
      name: `${company.displayName} Screening Assessment`,
      description: `Campus screening for ${company.displayName} roles.`,
      instructions: "Do not switch tabs. Submit before the timer ends.",
      job: relatedJob?.job._id,
      recruiter: recruiter._id,
      createdBy: recruiter._id,
      template: screeningTemplate._id,
      questions: extraQuestions.map((q) => q._id),
      durationMinutes: 30,
      startDate: daysFromNow(-10),
      endDate: daysFromNow(20),
      passingScore: 60,
      status: "published",
      config: { enableRanking: true, autoShortlistAboveThreshold: true, shortlistThreshold: 70 }
    });
    publishedAssessments.push(assessment);
    const candidates = students.slice(idx * 8, idx * 8 + 12);
    for (const [cidx, student] of candidates.entries()) {
      const passed = cidx % 3 !== 0;
      const percentage = 48 + ((cidx * 7) % 45);
      const attempt = await AssessmentAttempt.create({
        student: student._id,
        assessment: assessment._id,
        template: screeningTemplate._id,
        scores: { technical: 30 + cidx, soft: 10, aptitude: 8, total: 48 + cidx },
        maxScores: { technical: 60, soft: 16, aptitude: 12, total: 88 },
        strengths: student.skillProfile.strengths,
        gaps: student.skillProfile.gaps,
        startedAt: daysFromNow(-2),
        submittedAt: daysFromNow(-2),
        timeTakenSeconds: 1100,
        passed,
        percentage
      });
      await AssessmentCandidate.create({
        assessment: assessment._id,
        candidate: student._id,
        job: relatedJob?.job._id,
        status: passed ? (percentage >= 70 ? "shortlisted" : "passed") : "failed",
        invitedAt: daysFromNow(-6),
        startedAt: daysFromNow(-2),
        submittedAt: daysFromNow(-2),
        attemptsCount: 1,
        lastAttempt: attempt._id,
        invitedBy: recruiter._id
      });
    }
  }

  const sessions = [];
  for (let i = 0; i < 24; i += 1) {
    const student = students[i * 3];
    if (!student) continue;
    sessions.push({
      mentor: student.assignedMentor,
      student: student._id,
      topic: i % 2 === 0 ? "Resume and skill-gap review" : "Mock interview for recommended jobs",
      description: "Used to verify career guidance and mentor workflows.",
      scheduledAt: daysFromNow(i % 2 === 0 ? 3 : -4),
      durationMinutes: 45,
      mode: "online",
      status: i % 2 === 0 ? "scheduled" : "completed",
      meetingLink: "https://meet.example/mentorship",
      notes: "Focus on missing skills from job recommendations.",
      rating: i % 2 === 0 ? undefined : 4,
      completedAt: i % 2 === 0 ? undefined : daysFromNow(-4)
    });
  }
  await MentorshipSession.insertMany(sessions);

  const workshops = await Workshop.insertMany([
    { title: "Bulk Dataset System Design Clinic", description: "Walkthrough of matching scores and system design answers.", organizer: "Nimbus Labs", date: daysFromNow(9), time: "4:00 PM", mode: "online", skills: ["System Design", "REST APIs"], eligibility: "3rd/4th year", maxParticipants: 200, registeredCount: 40, status: "published", createdBy: recruiterBySlug.nimbus._id },
    { title: "Bulk Dataset ML Office Hours", description: "Feature engineering clinic for job-match models.", organizer: "Orbit Analytics", date: daysFromNow(12), time: "5:00 PM", mode: "hybrid", skills: ["Python", "Machine Learning"], eligibility: "All CS students", maxParticipants: 120, registeredCount: 35, status: "published", createdBy: recruiterBySlug.orbit._id }
  ]);
  const lectures = await GuestLecture.insertMany([
    { title: "How recruiters read AI skill maps", speaker: "Ananya Bose", designation: "Head of Campus", organization: "QuantumHire", topic: "Hiring signals", date: daysFromNow(8), time: "2:00 PM", mode: "online", skills: ["Communication", "Data Analysis"], eligibility: "All students", maxParticipants: 400, registeredCount: 90, status: "published", createdBy: recruiterBySlug.quantum._id }
  ]);
  const challenges = await InnovationChallenge.insertMany([
    { title: "Bulk Dataset Skill-Graph Hack", description: "Build a better student-to-job skill graph.", organizer: "Campus2Career", theme: "AI + Careers", startDate: daysFromNow(15), endDate: daysFromNow(17), prize: "₹75,000", skills: ["Python", "Machine Learning", "NLP"], eligibility: "UG students", maxTeamSize: 4, registrationDeadline: daysFromNow(10), status: "published", createdBy: admin._id }
  ]);
  const liveProjects = await LiveIndustryProject.insertMany([
    { title: "Campus Job-Match Explainer", company: "Orbit Analytics", description: "Explainability UI for recommendation scores.", skillsRequired: ["Python", "React", "Machine Learning"], duration: "8 weeks", stipend: "₹18,000/month", eligibility: "CS/IT", applicationDeadline: daysFromNow(14), status: "published", createdBy: recruiterBySlug.orbit._id, applicantsCount: 20, selectedCount: 3 }
  ]);

  const workshopRegs = [];
  const lectureRegs = [];
  const challengeRegs = [];
  const projectApps = [];
  for (let i = 0; i < 30; i += 1) {
    workshopRegs.push({ workshop: workshops[i % workshops.length]._id, student: students[i]._id, status: i % 5 === 0 ? "attended" : "registered" });
    lectureRegs.push({ guestLecture: lectures[0]._id, student: students[i + 5]._id, status: "registered" });
    if (i < 12) {
      challengeRegs.push({
        challenge: challenges[0]._id,
        student: students[i]._id,
        teamName: `Bulk Team ${i + 1}`,
        teamMembers: [students[i]._id, students[i + 12]._id],
        status: i % 4 === 0 ? "submitted" : "registered"
      });
      projectApps.push({
        project: liveProjects[0]._id,
        student: students[i + 2]._id,
        coverLetter: students[i + 2].coverLetter.slice(0, 400),
        status: i % 3 === 0 ? "shortlisted" : "applied"
      });
    }
  }
  await WorkshopRegistration.insertMany(workshopRegs, { ordered: false }).catch(() => {});
  await GuestLectureRegistration.insertMany(lectureRegs, { ordered: false }).catch(() => {});
  await ChallengeRegistration.insertMany(challengeRegs, { ordered: false }).catch(() => {});
  await ProjectApplication.insertMany(projectApps, { ordered: false }).catch(() => {});

  for (const company of COMPANIES.slice(0, 6)) {
    await Opportunity.create({
      title: `${company.displayName} Campus Internship Drive`,
      description: `Rolling internship drive covering ${company.industry} roles.`,
      type: "internship",
      audience: "student",
      provider: recruiterBySlug[company.slug]._id,
      requiredSkills: JOB_TEMPLATES[COMPANIES.indexOf(company) % JOB_TEMPLATES.length].skills,
      eligibility: "CGPA >= 6.5, 3rd/4th year",
      location: company.city,
      deadline: daysFromNow(28),
      status: "approved",
      applications: students.slice(0, 8).map((s, idx) => ({
        applicant: s._id,
        status: idx % 4 === 0 ? "shortlisted" : "applied",
        appliedAt: daysFromNow(-idx)
      }))
    });
  }

  await Post.insertMany([
    { title: "Bulk dataset is live", content: "Review job recommendations, skill mapping, assessments, and resume import using seeded students.", type: "placement", priority: "high", targetAudience: "all", createdBy: admin._id, isActive: true },
    { title: "Recruiter screening window", content: "Six companies have published screening assessments with shortlists.", type: "event", priority: "medium", targetAudience: "recruiter", createdBy: admin._id, isActive: true }
  ]);

  const notifications = students.slice(0, 20).map((student, idx) => ({
    recipient: student._id,
    sender: recruiterUsers[idx % recruiterUsers.length]._id,
    type: idx % 2 === 0 ? "application_status_update" : "interview_scheduled",
    title: idx % 2 === 0 ? "Application updated" : "Interview scheduled",
    message: idx % 2 === 0 ? "A recruiter updated your application status." : "Your interview is on the calendar.",
    isRead: idx % 3 === 0,
    priority: "medium"
  }));
  await Notification.insertMany(notifications);

  const templateAttemptDocs = students.slice(0, 40).map((student, i) => ({
    student: student._id,
    template: screeningTemplate._id,
    scores: { technical: 28 + i, soft: 12, aptitude: 7, total: 47 + i },
    maxScores: { technical: 60, soft: 16, aptitude: 12, total: 88 },
    strengths: student.skillProfile.strengths,
    gaps: student.skillProfile.gaps,
    startedAt: daysFromNow(-1),
    submittedAt: daysFromNow(-1),
    timeTakenSeconds: 900,
    passed: i % 4 !== 0
  }));
  await AssessmentAttempt.insertMany(templateAttemptDocs);

  const summary = {
    students: students.length,
    recruiters: recruiterUsers.length,
    mentors: mentors.length,
    jobs: jobs.length,
    applications: applications.length,
    courses: courseDocs.length,
    assessments: publishedAssessments.length,
    sampleStudent: `student.001@${EMAIL_DOMAIN}`,
    sampleRecruiter: `recruiter.nimbus@${EMAIL_DOMAIN}`,
    studentPassword: STUDENT_PASSWORD,
    recruiterPassword: RECRUITER_PASSWORD
  };

  console.log("\n🎉 Bulk dataset seed complete");
  console.log(`  Students:     ${summary.students}   password ${STUDENT_PASSWORD}`);
  console.log(`  Sample login: ${summary.sampleStudent}`);
  console.log(`  Recruiters:   ${summary.recruiters}   password ${RECRUITER_PASSWORD}`);
  console.log(`  Sample login: ${summary.sampleRecruiter}`);
  console.log(`  Mentors:      ${summary.mentors}   password ${MENTOR_PASSWORD}`);
  console.log(`  Jobs:         ${summary.jobs}`);
  console.log(`  Applications: ${summary.applications}`);
  console.log(`  Courses:      ${summary.courses}`);
  console.log(`  Assessments:  ${summary.assessments}`);

  if (manageConnection) {
    await mongoose.disconnect();
  }
  return summary;
}

export { seed as runBulkSeed };

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  seed().then(() => process.exit(0)).catch((err) => {
    console.error("❌ Bulk seed failed:", err);
    process.exit(1);
  });
}

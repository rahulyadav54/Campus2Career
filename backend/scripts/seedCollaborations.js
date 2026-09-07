/**
 * seedCollaborations.js
 * Seeds workshops, guest lectures, innovation challenges, and live industry projects
 * so student Industry Engagement pages are never empty.
 */

import dotenv from "dotenv";
import connectDB from "../config/db.js";
import UserModel from "../models/UserModel.js";
import Workshop from "../models/Workshop.js";
import GuestLecture from "../models/GuestLecture.js";
import InnovationChallenge from "../models/InnovationChallenge.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const WORKSHOPS = [
  {
    title: "React Advanced Patterns Workshop",
    description: "Hands-on session on hooks, performance, code-splitting, and production React patterns used in industry teams.",
    organizer: "Nimbus Labs",
    date: daysFromNow(10),
    time: "10:00 AM - 1:00 PM",
    mode: "online",
    skills: ["React", "JavaScript", "Performance"],
    eligibility: "2nd year and above",
    maxParticipants: 200,
    registeredCount: 118,
  },
  {
    title: "AI/ML Hands-on Bootcamp",
    description: "Build and evaluate ML models with Python, Scikit-learn, and TensorFlow. Includes a mini project demo day.",
    organizer: "Orbit Analytics",
    date: daysFromNow(18),
    time: "9:00 AM - 5:00 PM",
    mode: "hybrid",
    skills: ["Python", "Machine Learning", "TensorFlow"],
    eligibility: "Students with Python basics",
    maxParticipants: 150,
    registeredCount: 86,
  },
  {
    title: "Cloud & DevOps Crash Course",
    description: "Docker, CI/CD, and Kubernetes fundamentals with a live deployment lab on a demo cluster.",
    organizer: "Harbor Cloud",
    date: daysFromNow(12),
    time: "2:00 PM - 6:00 PM",
    mode: "online",
    skills: ["Docker", "Kubernetes", "CI/CD", "Linux"],
    eligibility: "CS/IT students",
    maxParticipants: 180,
    registeredCount: 95,
  },
  {
    title: "Product Design Sprint Workshop",
    description: "Learn Figma workflows, user research, wireframing, and how startups run design sprints.",
    organizer: "PixelCraft",
    date: daysFromNow(8),
    time: "11:00 AM - 4:00 PM",
    mode: "offline",
    skills: ["Figma", "UX Research", "Prototyping"],
    eligibility: "All students",
    maxParticipants: 80,
    registeredCount: 52,
  },
];

const GUEST_LECTURES = [
  {
    title: "Building Scalable Systems at Scale",
    speaker: "Anjali Mehra",
    designation: "Staff Engineer",
    organization: "Google",
    topic: "Scalable System Design",
    date: daysFromNow(7),
    time: "2:00 PM - 3:30 PM",
    mode: "online",
    skills: ["System Design", "Scalability", "Cloud"],
    eligibility: "All students",
    maxParticipants: 500,
    registeredCount: 312,
  },
  {
    title: "Cybersecurity Trends 2026",
    speaker: "Karthik Reddy",
    designation: "CISO",
    organization: "Sentinel Secure",
    topic: "Modern Cybersecurity Threats",
    date: daysFromNow(14),
    time: "11:00 AM - 12:30 PM",
    mode: "hybrid",
    skills: ["Cybersecurity", "Networking", "Risk Assessment"],
    eligibility: "CS/IT students",
    maxParticipants: 250,
    registeredCount: 164,
  },
  {
    title: "From Campus to Product Manager",
    speaker: "Neha Kapoor",
    designation: "Senior Product Manager",
    organization: "Lumen Labs",
    topic: "Product Thinking & Career Paths",
    date: daysFromNow(9),
    time: "4:00 PM - 5:15 PM",
    mode: "online",
    skills: ["Product Strategy", "Communication", "Agile"],
    eligibility: "All students",
    maxParticipants: 400,
    registeredCount: 221,
  },
];

const CHALLENGES = [
  {
    title: "Smart Campus Air Quality Challenge",
    description: "Build a low-cost IoT air-quality monitoring solution and dashboard for campus deployment.",
    organizer: "Ministry of Education — Innovation Cell",
    theme: "IoT + Environmental Monitoring",
    startDate: daysFromNow(20),
    endDate: daysFromNow(27),
    prize: "₹1,00,000 + internship shortlists",
    skills: ["IoT", "Python", "Sensors", "Dashboards"],
    eligibility: "UG/PG students",
    maxTeamSize: 6,
    registrationDeadline: daysFromNow(12),
  },
  {
    title: "Campus2Career AI Challenge",
    description: "Design an AI-powered career recommendation engine using skills, resume, and job-market signals.",
    organizer: "Campus2Career",
    theme: "AI + Career Tech",
    startDate: daysFromNow(30),
    endDate: daysFromNow(37),
    prize: "₹50,000 + premium learning access",
    skills: ["Python", "Machine Learning", "NLP"],
    eligibility: "All students",
    maxTeamSize: 4,
    registrationDeadline: daysFromNow(22),
  },
  {
    title: "Fintech Fraud Detection Hack",
    description: "Detect anomalous transactions with ML models and ship an explainable fraud score API.",
    organizer: "Aurora Fintech",
    theme: "Fintech + Machine Learning",
    startDate: daysFromNow(16),
    endDate: daysFromNow(18),
    prize: "₹75,000 + PPO interviews",
    skills: ["Python", "SQL", "Machine Learning", "APIs"],
    eligibility: "3rd/4th year students",
    maxTeamSize: 5,
    registrationDeadline: daysFromNow(10),
  },
];

const LIVE_PROJECTS = [
  {
    title: "E-commerce Recommendation Engine",
    company: "Nimbus Labs",
    industry: "SaaS / E-commerce",
    description: "Build a real-time product recommendation engine using collaborative filtering and A/B evaluation hooks.",
    skillsRequired: ["Python", "Machine Learning", "APIs", "SQL"],
    duration: "3 months",
    stipend: "₹18,000/month",
    mode: "hybrid",
    eligibility: "Students with ML basics",
    applicationDeadline: daysFromNow(15),
    applicantsCount: 45,
    selectedCount: 5,
  },
  {
    title: "Campus Digital Twin for Energy",
    company: "Forge Embedded",
    industry: "Electronics & IoT",
    description: "Develop a digital twin prototype for campus energy monitoring using IoT telemetry and analytics dashboards.",
    skillsRequired: ["IoT", "Data Analysis", "Python", "Dashboards"],
    duration: "4 months",
    stipend: "₹20,000/month",
    mode: "hybrid",
    eligibility: "ECE/CS students",
    applicationDeadline: daysFromNow(20),
    applicantsCount: 30,
    selectedCount: 3,
  },
  {
    title: "Hospital Workflow Automation Portal",
    company: "Indigo HealthTech",
    industry: "Healthcare Tech",
    description: "Ship internal tools for appointment triage, queue visibility, and doctor dashboards with role-based access.",
    skillsRequired: ["React", "Node.js", "MongoDB", "REST APIs"],
    duration: "3 months",
    stipend: "₹22,000/month",
    mode: "online",
    eligibility: "Full-stack experience preferred",
    applicationDeadline: daysFromNow(12),
    applicantsCount: 58,
    selectedCount: 6,
  },
  {
    title: "Cloud Cost Optimisation Toolkit",
    company: "Harbor Cloud",
    industry: "Cloud Computing",
    description: "Analyze Kubernetes spend patterns and build automation recommendations for idle workload cleanup.",
    skillsRequired: ["Kubernetes", "Python", "AWS", "Linux"],
    duration: "2 months",
    stipend: "₹25,000/month",
    mode: "online",
    eligibility: "Students with cloud fundamentals",
    applicationDeadline: daysFromNow(18),
    applicantsCount: 39,
    selectedCount: 4,
  },
  {
    title: "Adaptive Learning Content Engine",
    company: "Cedar EduWorks",
    industry: "EdTech",
    description: "Create a skill-gap aware content recommender for engineering courses with weekly progress reports.",
    skillsRequired: ["Python", "NLP", "React", "Data Analysis"],
    duration: "3 months",
    stipend: "₹16,000/month",
    mode: "hybrid",
    eligibility: "All engineering students",
    applicationDeadline: daysFromNow(25),
    applicantsCount: 27,
    selectedCount: 4,
  },
  {
    title: "EV Fleet Mobile Operations App",
    company: "Vertex Mobility",
    industry: "Mobility / EV",
    description: "Build driver ops features: trip status, battery health alerts, and offline-first mobile sync.",
    skillsRequired: ["React Native", "Firebase", "JavaScript", "APIs"],
    duration: "3 months",
    stipend: "₹19,000/month",
    mode: "offline",
    eligibility: "Mobile development interest",
    applicationDeadline: daysFromNow(14),
    applicantsCount: 41,
    selectedCount: 5,
  },
];

export async function runCollaborationSeed() {
  let creator = await UserModel.findOne({ role: "admin" }).select("_id");
  if (!creator) creator = await UserModel.findOne({ role: "recruiter" }).select("_id");
  if (!creator) creator = await UserModel.findOne({}).select("_id");
  if (!creator) {
    throw new Error("No user found to attach as createdBy for collaboration seed");
  }

  const createdBy = creator._id;
  const summary = { workshops: 0, lectures: 0, challenges: 0, projects: 0 };

  for (const item of WORKSHOPS) {
    const existing = await Workshop.findOne({ title: item.title });
    if (!existing) {
      await Workshop.create({ ...item, status: "published", createdBy });
      summary.workshops += 1;
    } else if (existing.status !== "published") {
      existing.status = "published";
      await existing.save();
    }
  }

  for (const item of GUEST_LECTURES) {
    const existing = await GuestLecture.findOne({ title: item.title });
    if (!existing) {
      await GuestLecture.create({ ...item, status: "published", createdBy });
      summary.lectures += 1;
    } else if (existing.status !== "published") {
      existing.status = "published";
      await existing.save();
    }
  }

  for (const item of CHALLENGES) {
    const existing = await InnovationChallenge.findOne({ title: item.title });
    if (!existing) {
      await InnovationChallenge.create({ ...item, status: "published", createdBy });
      summary.challenges += 1;
    } else if (existing.status !== "published") {
      existing.status = "published";
      await existing.save();
    }
  }

  for (const item of LIVE_PROJECTS) {
    const existing = await LiveIndustryProject.findOne({ title: item.title });
    if (!existing) {
      await LiveIndustryProject.create({ ...item, status: "published", createdBy });
      summary.projects += 1;
    } else if (existing.status !== "published") {
      existing.status = "published";
      await existing.save();
    }
  }

  summary.totals = {
    workshops: await Workshop.countDocuments({ status: "published" }),
    lectures: await GuestLecture.countDocuments({ status: "published" }),
    challenges: await InnovationChallenge.countDocuments({ status: "published" }),
    projects: await LiveIndustryProject.countDocuments({ status: "published" }),
  };

  return summary;
}

const isDirectRun = process.argv[1]?.includes("seedCollaborations");
if (isDirectRun) {
  connectDB()
    .then(() => runCollaborationSeed())
    .then((summary) => {
      console.log("Collaboration seed complete:", summary);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Collaboration seed failed:", error);
      process.exit(1);
    });
}

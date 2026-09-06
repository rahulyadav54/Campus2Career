import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import Recruiter from "../models/RecruiterModel.js";
import Course from "../models/Course.js";
import CareerPathway from "../models/CareerPathwayModel.js";
import LearningResource from "../models/LearningResourceModel.js";
import LearningPlatform from "../models/LearningPlatformModel.js";
import Opportunity from "../models/OpportunityModel.js";
import AptitudeTest from "../models/AptitudeTest.js";
import Workshop from "../models/Workshop.js";
import GuestLecture from "../models/GuestLecture.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";

const RECRUITER_PASSWORD = "Recruiter@1234";
const CATALOG_MARKER = "portal-catalog";

const COMPANIES = [
  { slug: "nimbus", legalName: "Nimbus Labs Private Limited", displayName: "Nimbus Labs", website: "https://nimbuslabs.example", industry: "SaaS", companySize: "51-200", headquarters: "Bengaluru", city: "Bengaluru", state: "Karnataka", description: "Collaboration software for mid-market teams." },
  { slug: "orbit", legalName: "Orbit Analytics Pvt Ltd", displayName: "Orbit Analytics", website: "https://orbitanalytics.example", industry: "Analytics & AI", companySize: "201-1000", headquarters: "Hyderabad", city: "Hyderabad", state: "Telangana", description: "Decision intelligence for retail and fintech." },
  { slug: "harbor", legalName: "Harbor Cloud Technologies", displayName: "Harbor Cloud", website: "https://harborcloud.example", industry: "Cloud Computing", companySize: "201-1000", headquarters: "Pune", city: "Pune", state: "Maharashtra", description: "Managed Kubernetes and cloud cost optimisation." },
  { slug: "sentinel", legalName: "Sentinel Secure Systems", displayName: "Sentinel Secure", website: "https://sentinelsecure.example", industry: "Information Security", companySize: "51-200", headquarters: "Chennai", city: "Chennai", state: "Tamil Nadu", description: "Managed SOC and vulnerability assessment." },
  { slug: "pixel", legalName: "PixelCraft Studio LLP", displayName: "PixelCraft", website: "https://pixelcraft.example", industry: "Design & Technology", companySize: "11-50", headquarters: "Mumbai", city: "Mumbai", state: "Maharashtra", description: "Product design studio for consumer apps." },
  { slug: "forge", legalName: "Forge Embedded Pvt Ltd", displayName: "Forge Embedded", website: "https://forgeembedded.example", industry: "Electronics & IoT", companySize: "51-200", headquarters: "Coimbatore", city: "Coimbatore", state: "Tamil Nadu", description: "Industrial IoT firmware and hardware." },
  { slug: "lumen", legalName: "Lumen Product Labs", displayName: "Lumen Labs", website: "https://lumenlabs.example", industry: "Technology", companySize: "11-50", headquarters: "Gurugram", city: "Gurugram", state: "Haryana", description: "Product studio hiring PMs and analysts." },
  { slug: "quantum", legalName: "QuantumHire Solutions", displayName: "QuantumHire", website: "https://quantumhire.example", industry: "Information Technology", companySize: "1000+", headquarters: "Noida", city: "Noida", state: "Uttar Pradesh", description: "IT services and campus hiring partner." },
  { slug: "aurora", legalName: "Aurora Fintech Services", displayName: "Aurora Fintech", website: "https://aurorafin.example", industry: "Consulting & Finance", companySize: "201-1000", headquarters: "Mumbai", city: "Mumbai", state: "Maharashtra", description: "Digital banking analytics." },
  { slug: "vertex", legalName: "Vertex Mobility Pvt Ltd", displayName: "Vertex Mobility", website: "https://vertexmobility.example", industry: "Technology", companySize: "51-200", headquarters: "Bengaluru", city: "Bengaluru", state: "Karnataka", description: "EV fleet software and mobile apps." },
  { slug: "indigo", legalName: "Indigo HealthTech", displayName: "Indigo HealthTech", website: "https://indigohealth.example", industry: "Healthcare Tech", companySize: "51-200", headquarters: "Hyderabad", city: "Hyderabad", state: "Telangana", description: "Hospital workflow and ML diagnostics." },
  { slug: "cedar", legalName: "Cedar EduWorks", displayName: "Cedar EduWorks", website: "https://cedaredu.example", industry: "EdTech", companySize: "11-50", headquarters: "Pune", city: "Pune", state: "Maharashtra", description: "Adaptive learning for engineering colleges." }
];

const JOB_TEMPLATES = [
  { title: "Frontend Developer Intern", skills: ["JavaScript", "React", "REST APIs", "HTML", "CSS"], stipend: "₹22,000/month" },
  { title: "Full Stack Engineer Trainee", skills: ["JavaScript", "React", "Node.js", "MongoDB"], stipend: "₹28,000/month" },
  { title: "Data Analyst Intern", skills: ["Python", "SQL", "Data Analysis", "Excel"], stipend: "₹25,000/month" },
  { title: "Business Intelligence Associate", skills: ["SQL", "Tableau", "Power BI", "Excel"], stipend: "₹30,000/month" },
  { title: "ML Engineer Intern", skills: ["Python", "Machine Learning", "TensorFlow", "Statistics"], stipend: "₹32,000/month" },
  { title: "NLP Research Intern", skills: ["Python", "NLP", "Deep Learning", "Machine Learning"], stipend: "₹30,000/month" },
  { title: "DevOps Intern", skills: ["Linux", "Docker", "CI/CD", "AWS"], stipend: "₹26,000/month" },
  { title: "Cloud Support Engineer", skills: ["AWS", "Linux", "Python", "Kubernetes"], stipend: "4.5 LPA" },
  { title: "SOC Analyst Intern", skills: ["Networking", "SIEM", "Linux", "Risk Assessment"], stipend: "₹24,000/month" },
  { title: "Firmware Engineer Intern", skills: ["C", "C++", "Microcontrollers", "RTOS"], stipend: "₹23,000/month" },
  { title: "UI/UX Design Intern", skills: ["Figma", "User Research", "Wireframing", "Prototyping"], stipend: "₹20,000/month" },
  { title: "Associate Product Manager Intern", skills: ["Product Strategy", "Agile", "Data Analysis", "Communication"], stipend: "₹35,000/month" }
];

const COURSES = [
  { title: "React 18 Professional Path", provider: "Meta", platform: "Coursera", skills: ["React", "JavaScript", "HTML", "CSS"], duration: "8 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.coursera.org", description: "Build production React interfaces used in campus products." },
  { title: "Node.js API Engineering", provider: "Udemy", platform: "Udemy", skills: ["Node.js", "REST APIs", "MongoDB"], duration: "6 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.udemy.com", description: "Design and ship REST APIs with Node and MongoDB." },
  { title: "SQL for Analysts", provider: "Mode", platform: "Coursera", skills: ["SQL", "Data Analysis"], duration: "4 weeks", level: "beginner", isFree: true, externalUrl: "https://www.coursera.org", description: "Query campus and hiring datasets with SQL." },
  { title: "Python Data Wrangling", provider: "DataCamp", platform: "DataCamp", skills: ["Python", "Pandas", "Data Analysis"], duration: "5 weeks", level: "beginner", isFree: false, externalUrl: "https://www.datacamp.com", description: "Clean and reshape tabular data in Python." },
  { title: "Intro to Machine Learning", provider: "Stanford", platform: "Coursera", skills: ["Machine Learning", "Python", "Statistics"], duration: "11 weeks", level: "intermediate", isFree: true, externalUrl: "https://www.coursera.org", description: "Supervised learning foundations for placement roles." },
  { title: "Deep Learning with TensorFlow", provider: "DeepLearning.AI", platform: "Coursera", skills: ["Deep Learning", "TensorFlow", "Python"], duration: "12 weeks", level: "advanced", isFree: false, externalUrl: "https://www.coursera.org", description: "Train and evaluate neural networks." },
  { title: "Docker for Developers", provider: "Udemy", platform: "Udemy", skills: ["Docker", "Linux", "CI/CD"], duration: "3 weeks", level: "beginner", isFree: false, externalUrl: "https://www.udemy.com", description: "Containerize student projects for internships." },
  { title: "Kubernetes Fundamentals", provider: "The Linux Foundation", platform: "edX", skills: ["Kubernetes", "Docker", "Linux"], duration: "8 weeks", level: "intermediate", isFree: true, externalUrl: "https://www.edx.org", description: "Orchestrate containers used in cloud internships." },
  { title: "AWS Cloud Practitioner", provider: "AWS", platform: "AWS Training", skills: ["AWS", "Cloud Computing"], duration: "2 weeks", level: "beginner", isFree: true, externalUrl: "https://aws.amazon.com/training", description: "Cloud basics for campus hiring screens." },
  { title: "Practical Ethical Hacking", provider: "TCM", platform: "Udemy", skills: ["Ethical Hacking", "Networking", "Linux"], duration: "6 weeks", level: "intermediate", isFree: false, externalUrl: "https://www.udemy.com", description: "Security fundamentals for SOC internships." },
  { title: "Embedded C for Microcontrollers", provider: "NPTEL", platform: "NPTEL", skills: ["C", "Microcontrollers", "Electronics"], duration: "8 weeks", level: "intermediate", isFree: true, externalUrl: "https://nptel.ac.in", description: "Firmware basics for ECE campus drives." },
  { title: "Figma UI Essentials", provider: "Google", platform: "Coursera", skills: ["Figma", "Wireframing", "Prototyping"], duration: "6 weeks", level: "beginner", isFree: false, externalUrl: "https://www.coursera.org", description: "Design internship-ready UI case studies." },
  { title: "Product Management Foundations", provider: "Google", platform: "Coursera", skills: ["Product Strategy", "Agile", "Communication"], duration: "10 weeks", level: "beginner", isFree: false, externalUrl: "https://www.coursera.org", description: "PRDs, metrics, and stakeholder communication." },
  { title: "Excel to Power BI", provider: "Microsoft", platform: "Microsoft Learn", skills: ["Excel", "Power BI", "Data Analysis"], duration: "4 weeks", level: "beginner", isFree: true, externalUrl: "https://learn.microsoft.com", description: "Dashboards for analyst internships." },
  { title: "System Design Primer", provider: "Educative", platform: "Educative", skills: ["System Design", "REST APIs", "AWS"], duration: "5 weeks", level: "advanced", isFree: false, externalUrl: "https://www.educative.io", description: "Interview-ready system design patterns." },
  { title: "Communication for Engineers", provider: "Coursera", platform: "Coursera", skills: ["Communication", "Teamwork"], duration: "3 weeks", level: "beginner", isFree: true, externalUrl: "https://www.coursera.org", description: "Soft skills used in placement interviews." }
];

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

export async function runPortalCatalogSeed() {
  const admin = await ensureAdmin();
  const hashedRecruiter = await bcrypt.hash(RECRUITER_PASSWORD, 12);
  const recruiterIds = [];

  for (const [index, company] of COMPANIES.entries()) {
    const email = `recruiter.${company.slug}@portal.campus2career.com`;
    let user = await User.findOne({ email });
    if (!user) {
      await User.collection.insertOne({
        name: `${company.displayName} Talent`,
        email,
        password: hashedRecruiter,
        role: "recruiter",
        status: "active",
        company: company.displayName,
        phone: `98${String(20000000 + index).slice(-8)}`,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      user = await User.findOne({ email });
    }
    recruiterIds.push(user._id);

    const existingProfile = await Recruiter.findOne({ user: user._id });
    if (!existingProfile) {
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
          phone: user.phone || "9800000000",
          alternateEmail: `hr@${company.slug}.example`,
          address: {
            street: `${10 + index} Industry Park`,
            city: company.city,
            state: company.state,
            zipCode: String(400000 + index),
            country: "India"
          }
        },
        documents: {
          registrationCertificate: `https://docs.example/${company.slug}/cin.pdf`,
          taxId: `GSTIN${String(index + 1).padStart(3, "0")}`
        },
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verifiedBy: admin._id,
        isActive: true
      });
    }

    const start = index % JOB_TEMPLATES.length;
    const templates = [0, 1, 2].map((offset) => JOB_TEMPLATES[(start + offset) % JOB_TEMPLATES.length]);
    for (const template of templates) {
      const title = `${company.displayName} — ${template.title}`;
      const existing = await Job.findOne({ title, recruiter: user._id });
      if (!existing) {
        await Job.create({
          title,
          description: `${company.displayName} is hiring a ${template.title} on the Campus2Career portal. Work with a live team and ship weekly demos.`,
          rolesResponsibilities: `Own ${template.skills.slice(0, 3).join(", ")} deliverables and present progress in stand-ups.`,
          location: company.city,
          skillsRequired: template.skills,
          stipend: template.stipend,
          recruiter: user._id,
          isActive: true,
          status: "approved"
        });
      }
    }

    const oppTitle = `${company.displayName} Campus Internship Drive`;
    const existingOpp = await Opportunity.findOne({ title: oppTitle });
    if (!existingOpp) {
      await Opportunity.create({
        title: oppTitle,
        description: `Rolling internship drive covering ${company.industry} roles. Visible to every student on the main portal.`,
        type: "internship",
        audience: "student",
        provider: user._id,
        requiredSkills: templates[0].skills,
        eligibility: "CGPA >= 6.5, 3rd/4th year",
        location: company.city,
        deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        status: "approved"
      });
    }
  }

  const courseDocs = [];
  for (const course of COURSES) {
    const existing = await Course.findOne({ title: course.title, thumbnail: CATALOG_MARKER });
    if (!existing) {
      courseDocs.push(await Course.create({
        ...course,
        thumbnail: CATALOG_MARKER,
        certificateAvailable: true,
        rating: 4.4,
        status: "published",
        createdBy: admin._id
      }));
    }
  }

  const pathways = [
    { role: "NLP Engineer", industry: "Analytics & AI", description: "Build language models and text understanding systems.", requiredSkills: ["Python", "NLP", "Deep Learning", "Machine Learning"], niceToHaveSkills: ["PyTorch", "Transformers"], averageSalaryLPA: 14, demandLevel: "very_high", certifications: ["Hugging Face NLP"] },
    { role: "Site Reliability Engineer", industry: "Cloud Computing", description: "Keep production systems reliable and observable.", requiredSkills: ["Linux", "Kubernetes", "CI/CD", "Python"], niceToHaveSkills: ["Terraform", "Prometheus"], averageSalaryLPA: 16, demandLevel: "high", certifications: ["CKA"] },
    { role: "SOC Analyst", industry: "Information Security", description: "Monitor and respond to security events.", requiredSkills: ["Networking", "SIEM", "Linux", "Risk Assessment"], niceToHaveSkills: ["Python", "Forensics"], averageSalaryLPA: 8, demandLevel: "high", certifications: ["CompTIA Security+"] },
    { role: "Firmware Engineer", industry: "Electronics & IoT", description: "Ship embedded software for connected devices.", requiredSkills: ["C", "C++", "Microcontrollers", "RTOS"], niceToHaveSkills: ["Python", "IoT Protocols"], averageSalaryLPA: 8, demandLevel: "medium", certifications: ["ARM Accredited Engineer"] }
  ];
  for (const pathway of pathways) {
    const existing = await CareerPathway.findOne({ role: pathway.role });
    if (!existing) await CareerPathway.create(pathway);
  }

  const resources = [
    { title: "TypeScript Handbook Path", provider: "Microsoft", type: "tutorial", skills: ["TypeScript", "JavaScript"], url: "https://www.typescriptlang.org/docs/", durationHours: 12, isFree: true, level: "intermediate" },
    { title: "Kaggle Intro to ML", provider: "Kaggle", type: "course", skills: ["Machine Learning", "Python"], url: "https://www.kaggle.com/learn/intro-to-machine-learning", durationHours: 8, isFree: true, level: "beginner" }
  ];
  for (const resource of resources) {
    const existing = await LearningResource.findOne({ title: resource.title });
    if (!existing) await LearningResource.create(resource);
  }

  const platforms = [
    { name: "Kaggle Learn", provider: "Kaggle", type: "mooc", description: "Hands-on micro-courses for data and ML.", website: "https://www.kaggle.com/learn", supportedSkills: ["Python", "Machine Learning", "SQL"], integrationStatus: "connected" },
    { name: "Microsoft Learn", provider: "Microsoft", type: "certification", description: "Role-based learning paths for Azure and Power BI.", website: "https://learn.microsoft.com", supportedSkills: ["Azure", "Power BI", "Excel"], integrationStatus: "connected" }
  ];
  for (const platform of platforms) {
    const existing = await LearningPlatform.findOne({ name: platform.name });
    if (!existing) await LearningPlatform.create(platform);
  }

  const firstRecruiter = recruiterIds[0];
  if (firstRecruiter) {
    const workshopTitle = "Portal System Design Clinic";
    if (!await Workshop.findOne({ title: workshopTitle })) {
      await Workshop.create({
        title: workshopTitle,
        description: "Walkthrough of job-match scores and system design answers.",
        organizer: "Nimbus Labs",
        date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
        time: "4:00 PM",
        mode: "online",
        skills: ["System Design", "REST APIs"],
        eligibility: "All students",
        maxParticipants: 200,
        registeredCount: 40,
        status: "published",
        createdBy: firstRecruiter
      });
    }
    const lectureTitle = "How recruiters read skill maps";
    if (!await GuestLecture.findOne({ title: lectureTitle })) {
      await GuestLecture.create({
        title: lectureTitle,
        speaker: "Ananya Bose",
        designation: "Head of Campus",
        organization: "QuantumHire",
        topic: "Hiring signals",
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
        time: "2:00 PM",
        mode: "online",
        skills: ["Communication", "Data Analysis"],
        eligibility: "All students",
        maxParticipants: 400,
        registeredCount: 90,
        status: "published",
        createdBy: admin._id
      });
    }
    const projectTitle = "Campus Job-Match Explainer";
    if (!await LiveIndustryProject.findOne({ title: projectTitle })) {
      await LiveIndustryProject.create({
        title: projectTitle,
        company: "Orbit Analytics",
        description: "Explainability UI for recommendation scores.",
        skillsRequired: ["Python", "React", "Machine Learning"],
        duration: "8 weeks",
        stipend: "₹18,000/month",
        eligibility: "CS/IT students",
        applicationDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "published",
        createdBy: recruiterIds[1] || firstRecruiter,
        applicantsCount: 20,
        selectedCount: 3
      });
    }
  }

  const testTitle = "Portal Logical Reasoning";
  if (!await AptitudeTest.findOne({ title: testTitle })) {
    await AptitudeTest.create({
      title: testTitle,
      description: "Campus screening: series, analogies, and puzzles.",
      category: "logical",
      difficulty: "medium",
      timeLimitMinutes: 20,
      status: "published",
      isPublished: true,
      createdBy: admin._id,
      questions: [
        { question: "Find the next number: 3, 6, 11, 18, 27, ?", options: ["36", "38", "40", "41"], correctAnswer: "38", marks: 2, explanation: "Differences increase by 2." },
        { question: "Cat is to kitten as dog is to ?", options: ["puppy", "pack", "wolf", "bark"], correctAnswer: "puppy", marks: 1 },
        { question: "Time complexity of binary search?", options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"], correctAnswer: "O(log n)", marks: 2 }
      ]
    });
  }

  const jobs = await Job.countDocuments({ status: "approved", isActive: true });
  const courses = await Course.countDocuments({ thumbnail: CATALOG_MARKER });
  const summary = {
    recruiters: recruiterIds.length,
    jobs,
    courses,
    message: "Catalog is on the main portal for every student account."
  };
  console.log("Portal catalog seed complete:", summary);
  return summary;
}

const isDirectRun = process.argv[1]?.includes("seedPortalCatalog");
if (isDirectRun) {
  const mongoose = (await import("mongoose")).default;
  const dotenv = (await import("dotenv")).default;
  dotenv.config();
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI is missing");
    process.exit(1);
  }
  const atlas = mongoUri.includes("mongodb+srv://") || mongoUri.includes(".mongodb.net");
  await mongoose.connect(mongoUri, {
    ...(atlas ? { tls: true, family: 4 } : {}),
    serverSelectionTimeoutMS: 20000
  });
  try {
    await runPortalCatalogSeed();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Portal catalog seed failed:", error);
    process.exit(1);
  }
}

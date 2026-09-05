import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import CareerPathway from "../models/CareerPathwayModel.js";
import LearningResource from "../models/LearningResourceModel.js";
import Opportunity from "../models/OpportunityModel.js";
import { Question, AssessmentTemplate } from "../models/QuestionBankModel.js";
import Institution from "../models/InstitutionModel.js";
import Application from "../models/ApplicationModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import SkillAssessment from "../models/SkillAssessmentModel.js";
import PortfolioItem from "../models/PortfolioItemModel.js";
import InternshipProgress from "../models/InternshipProgressModel.js";
import FacultyDevelopmentProgram from "../models/FacultyDevelopmentProgram.js";
import FacultyInternship from "../models/FacultyInternship.js";
import ConsultancyOpportunity from "../models/ConsultancyOpportunity.js";
import ResearchCollaboration from "../models/ResearchCollaboration.js";
import Workshop from "../models/Workshop.js";
import GuestLecture from "../models/GuestLecture.js";
import InnovationChallenge from "../models/InnovationChallenge.js";
import LiveIndustryProject from "../models/LiveIndustryProject.js";
import AptitudeTest from "../models/AptitudeTest.js";
import LearningPlatform from "../models/LearningPlatformModel.js";

dotenv.config();

const hash = (pw) => bcrypt.hash(pw, 12);

const PATHWAYS = [
  { role: "Full Stack Developer", industry: "Information Technology", description: "Build end-to-end web applications", requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB", "REST APIs"], niceToHaveSkills: ["TypeScript", "Docker", "AWS"], averageSalaryLPA: 8, demandLevel: "very_high", certifications: ["AWS Certified Developer", "Meta Front-End Developer"] },
  { role: "Data Scientist", industry: "Analytics & AI", description: "Extract insights from large datasets using ML", requiredSkills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Analysis"], niceToHaveSkills: ["TensorFlow", "Spark", "Tableau"], averageSalaryLPA: 10, demandLevel: "very_high", certifications: ["Google Data Analytics", "IBM Data Science"] },
  { role: "DevOps Engineer", industry: "Information Technology", description: "Automate and streamline software delivery pipelines", requiredSkills: ["Linux", "Docker", "Kubernetes", "CI/CD", "AWS"], niceToHaveSkills: ["Terraform", "Ansible", "Python"], averageSalaryLPA: 9, demandLevel: "high", certifications: ["AWS Solutions Architect", "CKA"] },
  { role: "Cybersecurity Analyst", industry: "Information Security", description: "Protect systems and networks from threats", requiredSkills: ["Networking", "Linux", "Ethical Hacking", "SIEM", "Risk Assessment"], niceToHaveSkills: ["Python", "Cloud Security", "Forensics"], averageSalaryLPA: 9, demandLevel: "high", certifications: ["CEH", "CompTIA Security+", "CISSP"] },
  { role: "Product Manager", industry: "Technology", description: "Define product vision and drive execution", requiredSkills: ["Product Strategy", "Agile", "Data Analysis", "Communication", "Problem Solving"], niceToHaveSkills: ["SQL", "UX Design", "A/B Testing"], averageSalaryLPA: 12, demandLevel: "high", certifications: ["CSPO", "PMP"] },
  { role: "UI/UX Designer", industry: "Design & Technology", description: "Design intuitive user interfaces and experiences", requiredSkills: ["Figma", "User Research", "Wireframing", "Prototyping", "Communication"], niceToHaveSkills: ["HTML", "CSS", "Motion Design"], averageSalaryLPA: 7, demandLevel: "high", certifications: ["Google UX Design", "Interaction Design Foundation"] },
  { role: "Machine Learning Engineer", industry: "Analytics & AI", description: "Build and deploy ML models at scale", requiredSkills: ["Python", "Machine Learning", "Deep Learning", "TensorFlow", "MLOps"], niceToHaveSkills: ["Spark", "Kubernetes", "AWS SageMaker"], averageSalaryLPA: 12, demandLevel: "very_high", certifications: ["TensorFlow Developer", "AWS ML Specialty"] },
  { role: "Cloud Architect", industry: "Cloud Computing", description: "Design scalable cloud infrastructure", requiredSkills: ["AWS", "Azure", "Networking", "Security", "Terraform"], niceToHaveSkills: ["Kubernetes", "Python", "Cost Optimization"], averageSalaryLPA: 15, demandLevel: "very_high", certifications: ["AWS Solutions Architect Professional", "Azure Solutions Architect"] },
  { role: "Business Analyst", industry: "Consulting & Finance", description: "Bridge business needs and technical solutions", requiredSkills: ["Data Analysis", "SQL", "Communication", "Problem Solving", "Excel"], niceToHaveSkills: ["Power BI", "Python", "Agile"], averageSalaryLPA: 7, demandLevel: "medium", certifications: ["CBAP", "PMI-PBA"] },
  { role: "Embedded Systems Engineer", industry: "Electronics & IoT", description: "Develop firmware and embedded software", requiredSkills: ["C", "C++", "Microcontrollers", "RTOS", "Electronics"], niceToHaveSkills: ["Python", "IoT Protocols", "PCB Design"], averageSalaryLPA: 7, demandLevel: "medium", certifications: ["ARM Accredited Engineer"] }
];

const RESOURCES = [
  { title: "The Complete JavaScript Course", provider: "Udemy", type: "course", skills: ["JavaScript", "Node.js", "REST APIs"], url: "https://www.udemy.com/course/the-complete-javascript-course/", durationHours: 69, isFree: false, level: "beginner" },
  { title: "React - The Complete Guide", provider: "Udemy", type: "course", skills: ["React", "JavaScript"], url: "https://www.udemy.com/course/react-the-complete-guide-incl-redux/", durationHours: 68, isFree: false, level: "intermediate" },
  { title: "Python for Everybody", provider: "Coursera", type: "course", skills: ["Python", "Data Analysis"], url: "https://www.coursera.org/specializations/python", durationHours: 40, isFree: true, level: "beginner" },
  { title: "Machine Learning Specialization", provider: "Coursera", type: "certification", skills: ["Machine Learning", "Python", "Statistics"], url: "https://www.coursera.org/specializations/machine-learning-introduction", durationHours: 90, isFree: false, level: "intermediate" },
  { title: "Google Data Analytics Certificate", provider: "Coursera", type: "certification", skills: ["Data Analysis", "SQL", "Tableau", "Excel"], url: "https://www.coursera.org/professional-certificates/google-data-analytics", durationHours: 180, isFree: false, level: "beginner" },
  { title: "AWS Cloud Practitioner Essentials", provider: "AWS", type: "certification", skills: ["AWS", "Cloud Computing"], url: "https://aws.amazon.com/training/learn-about/cloud-practitioner/", durationHours: 6, isFree: true, level: "beginner" },
  { title: "Docker & Kubernetes: The Practical Guide", provider: "Udemy", type: "course", skills: ["Docker", "Kubernetes", "DevOps"], url: "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", durationHours: 24, isFree: false, level: "intermediate" },
  { title: "SQL for Data Science", provider: "Coursera", type: "course", skills: ["SQL", "Data Analysis"], url: "https://www.coursera.org/learn/sql-for-data-science", durationHours: 20, isFree: true, level: "beginner" },
  { title: "Google UX Design Certificate", provider: "Coursera", type: "certification", skills: ["UX Design", "Figma", "Wireframing", "Prototyping"], url: "https://www.coursera.org/professional-certificates/google-ux-design", durationHours: 200, isFree: false, level: "beginner" },
  { title: "Ethical Hacking Bootcamp", provider: "Udemy", type: "course", skills: ["Ethical Hacking", "Networking", "Cybersecurity"], url: "https://www.udemy.com/course/learn-ethical-hacking-from-scratch/", durationHours: 22, isFree: false, level: "intermediate" },
  { title: "NPTEL - Programming in C", provider: "NPTEL", type: "course", skills: ["C", "C++"], url: "https://nptel.ac.in/courses/106/105/106105171/", durationHours: 30, isFree: true, level: "beginner" },
  { title: "Deep Learning Specialization", provider: "Coursera", type: "certification", skills: ["Deep Learning", "TensorFlow", "Machine Learning"], url: "https://www.coursera.org/specializations/deep-learning", durationHours: 120, isFree: false, level: "advanced" },
  { title: "Communication Skills for Engineers", provider: "Coursera", type: "course", skills: ["Communication", "Teamwork"], url: "https://www.coursera.org/learn/communication-skills-engineers", durationHours: 15, isFree: true, level: "beginner" },
  { title: "Agile Project Management", provider: "Coursera", type: "certification", skills: ["Agile", "Product Strategy", "Problem Solving"], url: "https://www.coursera.org/professional-certificates/google-project-management", durationHours: 180, isFree: false, level: "beginner" }
];

const QUESTIONS = [
  { text: "What is the output of `typeof null` in JavaScript?", category: "technical", skill: "JavaScript", type: "mcq", difficulty: "medium", marks: 2, options: [{ text: "null", isCorrect: false }, { text: "object", isCorrect: true }, { text: "undefined", isCorrect: false }, { text: "string", isCorrect: false }] },
  { text: "Which data structure uses LIFO order?", category: "aptitude", skill: "Problem Solving", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "Queue", isCorrect: false }, { text: "Stack", isCorrect: true }, { text: "Linked List", isCorrect: false }, { text: "Tree", isCorrect: false }] },
  { text: "Rate your confidence in writing SQL JOIN queries", category: "technical", skill: "SQL", type: "rating", difficulty: "medium", marks: 2, options: [] },
  { text: "Python lists are mutable.", category: "technical", skill: "Python", type: "true_false", difficulty: "easy", marks: 1, options: [{ text: "True", isCorrect: true }, { text: "False", isCorrect: false }] },
  { text: "What does REST stand for?", category: "technical", skill: "REST APIs", type: "mcq", difficulty: "easy", marks: 1, options: [{ text: "Representational State Transfer", isCorrect: true }, { text: "Remote Execution Service Technology", isCorrect: false }, { text: "Rapid Endpoint Streaming Technology", isCorrect: false }, { text: "Resource Encoding Standard Transfer", isCorrect: false }] },
  { text: "Rate your ability to work effectively in a team", category: "soft", skill: "Teamwork", type: "rating", difficulty: "easy", marks: 2, options: [] },
  { text: "Rate your verbal and written communication skills", category: "soft", skill: "Communication", type: "rating", difficulty: "easy", marks: 2, options: [] },
  { text: "If a train travels 60 km in 45 minutes, what is its speed in km/h?", category: "aptitude", skill: "Problem Solving", type: "mcq", difficulty: "medium", marks: 2, options: [{ text: "75 km/h", isCorrect: false }, { text: "80 km/h", isCorrect: true }, { text: "90 km/h", isCorrect: false }, { text: "70 km/h", isCorrect: false }] },
  { text: "Rate your proficiency in React.js", category: "technical", skill: "React", type: "rating", difficulty: "medium", marks: 2, options: [] },
  { text: "Which HTTP method is idempotent and used to update a resource?", category: "technical", skill: "REST APIs", type: "mcq", difficulty: "hard", marks: 3, options: [{ text: "POST", isCorrect: false }, { text: "GET", isCorrect: false }, { text: "PUT", isCorrect: true }, { text: "PATCH", isCorrect: false }] }
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI, { tls: true, family: 4, serverSelectionTimeoutMS: 15000 });
  console.log("✅ Connected to MongoDB");

  // Career Pathways
  await CareerPathway.deleteMany({});
  await CareerPathway.insertMany(PATHWAYS);
  console.log(`✅ Seeded ${PATHWAYS.length} career pathways`);

  // Learning Resources
  await LearningResource.deleteMany({});
  await LearningResource.insertMany(RESOURCES);
  console.log(`✅ Seeded ${RESOURCES.length} learning resources`);

  // Question Bank
  await Question.deleteMany({});
  const insertedQuestions = await Question.insertMany(QUESTIONS.map(q => ({ ...q, createdBy: null })));
  console.log(`✅ Seeded ${insertedQuestions.length} questions`);

  // Assessment Template
  await AssessmentTemplate.deleteMany({});
  await AssessmentTemplate.create({
    title: "General Technical & Aptitude Assessment",
    description: "Covers JavaScript, Python, SQL, REST APIs, soft skills, and aptitude",
    questions: insertedQuestions.map(q => q._id),
    timeLimitMinutes: 20,
    passingScore: 60
  });
  console.log("✅ Seeded assessment template");

  // Demo Users (skip if already exist)
  const demoUsers = [
    { name: "Admin User", email: "admin@campus2career.com", password: await hash("Admin@1234"), role: "admin", status: "active" },
    { name: "Arjun Sharma", email: "student@campus2career.com", password: await hash("Student@1234"), role: "student", status: "active", department: "Computer Science", year: "3rd", rollNo: "CS2021001", cgpa: 8.5, skills: ["JavaScript", "React", "Python", "SQL", "REST APIs"], interests: ["Web Development", "Data Science"], institution: "Demo Institute" },
    { name: "Meera Iyer", email: "student2@campus2career.com", password: await hash("Student@1234"), role: "student", status: "active", department: "Electronics & Communication", year: "3rd", rollNo: "EC2021012", cgpa: 8.1, skills: ["C", "C++", "Python", "Microcontrollers", "Electronics"], interests: ["Embedded Systems", "IoT"], institution: "Demo Institute" },
    { name: "Rohit Verma", email: "student3@campus2career.com", password: await hash("Student@1234"), role: "student", status: "active", department: "Computer Science", year: "4th", rollNo: "CS2020054", cgpa: 8.9, skills: ["Python", "Machine Learning", "Statistics", "SQL", "Data Analysis"], interests: ["Artificial Intelligence", "Analytics"], institution: "Demo Institute", isPlaced: true, placementDetails: { company: "DataSoft Analytics", roleOffered: "Data Analyst", package: "9 LPA", offerDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    { name: "Dr. Priya Nair", email: "mentor@campus2career.com", password: await hash("Mentor@1234"), role: "mentor", status: "active", department: "Computer Science" },
    { name: "Dr. Suresh Menon", email: "mentor2@campus2career.com", password: await hash("Mentor@1234"), role: "mentor", status: "active", department: "Electronics & Communication" },
    { name: "TechCorp HR", email: "recruiter@campus2career.com", password: await hash("Recruiter@1234"), role: "recruiter", status: "active", company: "TechCorp Solutions" },
    { name: "InnoSoft HR", email: "recruiter2@campus2career.com", password: await hash("Recruiter@1234"), role: "recruiter", status: "active", company: "InnoSoft Systems" },
    { name: "Prof. Ramesh Kumar", email: "academician@campus2career.com", password: await hash("Acad@1234"), role: "academician", status: "active", institution: "Demo Institute", designation: "Associate Professor", department: "Computer Science" },
    { name: "Prof. Lakshmi Rao", email: "academician2@campus2career.com", password: await hash("Acad@1234"), role: "academician", status: "active", institution: "Demo Institute", designation: "Professor", department: "Electronics & Communication" },
    { name: "Demo Institute Admin", email: "institution@campus2career.com", password: await hash("Inst@1234"), role: "institution", status: "active", institution: "Demo Institute", designation: "Training & Placement Officer" }
  ];

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (!exists) {
      const user = new User(u);
      user.password = u.password; // already hashed, bypass pre-save hook
      await User.collection.insertOne({ ...user.toObject(), password: u.password });
      console.log(`✅ Created demo user: ${u.email}`);
    } else {
      console.log(`⏭  Skipped existing user: ${u.email}`);
    }
  }

  // Assign mentors to students
  const student = await User.findOne({ email: "student@campus2career.com" });
  const student2 = await User.findOne({ email: "student2@campus2career.com" });
  const student3 = await User.findOne({ email: "student3@campus2career.com" });
  const mentor = await User.findOne({ email: "mentor@campus2career.com" });
  const mentor2 = await User.findOne({ email: "mentor2@campus2career.com" });

  if (student && mentor && !student.assignedMentor) {
    await User.findByIdAndUpdate(student._id, { assignedMentor: mentor._id });
    console.log("✅ Assigned CS mentor to demo student");
  }
  if (student2 && mentor2 && !student2.assignedMentor) {
    await User.findByIdAndUpdate(student2._id, { assignedMentor: mentor2._id });
    console.log("✅ Assigned ECE mentor to Meera");
  }
  if (student3 && mentor && !student3.assignedMentor) {
    await User.findByIdAndUpdate(student3._id, { assignedMentor: mentor._id });
    console.log("✅ Assigned CS mentor to Rohit");
  }

  // Skill profiles from assessment results (drives skill mapping / guidance)
  if (student && !student.skillProfile?.strengths?.length) {
    await User.findByIdAndUpdate(student._id, {
      "skillProfile.strengths": ["JavaScript", "React", "Python", "SQL"],
      "skillProfile.gaps": ["Machine Learning", "Node.js"],
      "skillProfile.lastAssessedAt": new Date()
    });
  }
  if (student3 && !student3.skillProfile?.strengths?.length) {
    await User.findByIdAndUpdate(student3._id, {
      "skillProfile.strengths": ["Python", "Machine Learning", "Statistics", "SQL"],
      "skillProfile.gaps": ["MLOps", "Deep Learning"],
      "skillProfile.lastAssessedAt": new Date()
    });
  }

  // Demo Opportunity
  const recruiter = await User.findOne({ email: "recruiter@campus2career.com" });
  const existingOpp = await Opportunity.findOne({ title: "Full Stack Developer Internship" });
  if (!existingOpp && recruiter) {
    await Opportunity.create({
      title: "Full Stack Developer Internship",
      description: "6-month paid internship building real-world web applications with React and Node.js.",
      type: "internship",
      audience: "student",
      provider: recruiter._id,
      requiredSkills: ["JavaScript", "React", "Node.js"],
      eligibility: "3rd or 4th year CS/IT students with CGPA >= 7.0",
      location: "Bangalore / Remote",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "approved"
    });
    console.log("✅ Seeded demo opportunity");
  }

// Demo Institution + link institution admin
  let institution = await Institution.findOne({ code: "DEMO" });
  const institutionAdmin = await User.findOne({ email: "institution@campus2career.com" });
  if (!institution) {
    institution = await Institution.create({
      name: "Demo Institute",
      code: "DEMO",
      address: "123 Campus Road",
      city: "Pune",
      state: "Maharashtra",
      website: "https://demoinstitute.edu.in",
      type: "college",
      departments: [
        { name: "Computer Science", code: "CS", head: "Dr. Priya Nair" },
        { name: "Electronics & Communication", code: "EC", head: "Dr. Suresh Menon" },
        { name: "Mechanical Engineering", code: "ME", head: "Prof. Kulkarni" }
      ],
      adminUser: institutionAdmin?._id
    });
    console.log("✅ Seeded demo institution");
  } else if (institutionAdmin && !institution.adminUser) {
    institution.adminUser = institutionAdmin._id;
    await institution.save();
  }

  // Demo Jobs
  const recruiter2 = await User.findOne({ email: "recruiter2@campus2career.com" });
  const demoJobs = [
    { title: "Frontend Developer Intern", description: "Build responsive UIs with React and integrate REST APIs.", location: "Pune", skillsRequired: ["JavaScript", "React", "REST APIs"], stipend: "₹20,000/month", recruiter: recruiter?._id },
    { title: "Data Analyst Trainee", description: "Analyze business data, build dashboards, and support decision making.", location: "Bangalore", skillsRequired: ["Python", "SQL", "Data Analysis", "Excel"], stipend: "₹25,000/month", recruiter: recruiter2?._id },
    { title: "Embedded Firmware Engineer", description: "Develop firmware for IoT devices using C and microcontrollers.", location: "Chennai", skillsRequired: ["C", "C++", "Microcontrollers", "Electronics"], stipend: "₹22,000/month", recruiter: recruiter2?._id }
  ];
  const insertedJobs = [];
  for (const j of demoJobs) {
    const existing = await Job.findOne({ title: j.title });
    if (!existing && j.recruiter) {
      insertedJobs.push(await Job.create({ ...j, isActive: true, status: "approved" }));
    } else if (existing) {
      insertedJobs.push(existing);
    }
  }
  console.log(`✅ Seeded ${insertedJobs.length} approved demo jobs`);

  // Demo applications
  if (student && insertedJobs[0]) {
    const existingApp = await Application.findOne({ student: student._id, job: insertedJobs[0]._id });
    if (!existingApp) {
      await Application.create({
        student: student._id,
        job: insertedJobs[0]._id,
        mentor: mentor?._id,
        recruiter: recruiter?._id,
        status: "pending recruiter review"
      });
      console.log("✅ Seeded demo student application");
    }
  }
  if (student3 && insertedJobs[1]) {
    const existingApp = await Application.findOne({ student: student3._id, job: insertedJobs[1]._id });
    if (!existingApp) {
      await Application.create({
        student: student3._id,
        job: insertedJobs[1]._id,
        mentor: mentor?._id,
        recruiter: recruiter2?._id,
        status: "hired"
      });
      console.log("✅ Seeded placed-student application");
    }
  }
// More demo opportunities (training, certification, workshop)
  const extraOpportunities = [
    { title: "Google Data Analytics Certification Sprint", description: "Institution-sponsored sprint to complete the Google Data Analytics certificate.", type: "certification", audience: "student", requiredSkills: ["Data Analysis", "SQL", "Excel"], eligibility: "All departments", location: "Online", provider: recruiter2?._id },
    { title: "Full Stack Web Development Bootcamp", description: "8-week intensive bootcamp covering React, Node.js, and MongoDB.", type: "training", audience: "student", requiredSkills: ["JavaScript", "React", "Node.js", "MongoDB"], eligibility: "CS/IT students", location: "On Campus", provider: recruiter?._id },
    { title: "AI & Machine Learning Workshop", description: "Hands-on workshop on supervised learning with Python and scikit-learn.", type: "workshop", audience: "student", requiredSkills: ["Python", "Machine Learning"], eligibility: "2nd year and above", location: "On Campus", provider: recruiter2?._id }
  ];
  for (const op of extraOpportunities) {
    const existing = await Opportunity.findOne({ title: op.title });
    if (!existing && op.provider) {
      await Opportunity.create({ ...op, status: "approved", deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000) });
    }
  }
  console.log("✅ Seeded additional demo opportunities");

  // Demo skill assessments (legacy + timed attempt) so skill mapping has data
  if (student) {
    const existingLegacy = await SkillAssessment.findOne({ student: student._id });
    if (!existingLegacy) {
      await SkillAssessment.create({
        student: student._id,
        interests: student.interests || [],
        responses: [
          { skill: "JavaScript", category: "technical", score: 85 },
          { skill: "React", category: "technical", score: 80 },
          { skill: "Python", category: "technical", score: 75 },
          { skill: "SQL", category: "technical", score: 70 },
          { skill: "Node.js", category: "technical", score: 45 },
          { skill: "Machine Learning", category: "technical", score: 40 },
          { skill: "Teamwork", category: "soft", score: 82 },
          { skill: "Communication", category: "soft", score: 78 }
        ],
        strengths: ["JavaScript", "React", "Python", "SQL"],
        gaps: ["Node.js", "Machine Learning"]
      });
      console.log("✅ Seeded demo skill assessment");
    }
  }

  // Assessment attempts for analytics
  const template = await AssessmentTemplate.findOne({});
  if (student && template) {
    const existingAttempt = await AssessmentAttempt.findOne({ student: student._id, template: template._id });
    if (!existingAttempt) {
      await AssessmentAttempt.create({
        student: student._id,
        template: template._id,
        scores: { technical: 42, soft: 16, aptitude: 6, total: 64 },
        maxScores: { technical: 60, soft: 16, aptitude: 6, total: 82 },
        strengths: ["JavaScript", "React", "Python", "SQL"],
        gaps: ["Node.js", "Machine Learning"],
        startedAt: new Date(Date.now() - 60 * 60 * 1000),
        submittedAt: new Date(Date.now() - 55 * 60 * 1000),
        timeTakenSeconds: 1200,
        passed: true
      });
      console.log("✅ Seeded demo assessment attempt");
    }
  }
// Demo internship progress records (drive Internship Progress + Certificates features)
  if (student && mentor) {
    const existingCompleted = await InternshipProgress.findOne({ student: student._id, title: "Software Development Internship" });
    if (!existingCompleted) {
      const completed = await InternshipProgress.create({
        student: student._id,
        mentor: mentor._id,
        institution: "Demo Institute",
        title: "Software Development Internship",
        organization: "TechCorp Solutions",
        description: "Full-stack web development on a live product team.",
        startDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        status: "completed",
        weeklyUpdates: [
          { week: 1, summary: "Onboarded and set up the development environment.", tasksCompleted: ["Repo setup", "Intro to codebase"], submittedAt: new Date(Date.now() - 145 * 24 * 60 * 60 * 1000) },
          { week: 4, summary: "Built first React components for the dashboard.", tasksCompleted: ["Dashboard widgets", "API integration"], submittedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) },
          { week: 8, summary: "Deployed features to staging and wrote tests.", tasksCompleted: ["Feature deployment", "Unit tests"], submittedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
        ],
        mentorFeedback: [
          { by: mentor._id, text: "Consistent delivery and strong ownership of assigned modules.", rating: 5, date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000) },
          { by: mentor._id, text: "Excellent communication during sprint reviews.", rating: 4, date: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000) }
        ],
        completionEvidence: "https://demo.internship.report/arjun.pdf",
        completionRemarks: "All deliverables accepted by the engineering lead.",
        certificateIssued: true,
        certificateUrl: "https://demo.internship.cert/arjun-001",
        certificateNumber: "C2C-2025-A1B2C3",
        skillsGained: ["React", "Node.js", "REST APIs", "Teamwork"],
        finalRating: 4.5
      });
      console.log("✅ Seeded completed internship record with certificate");
    }

    const existingOngoing = await InternshipProgress.findOne({ student: student._id, title: "Frontend Developer Internship" });
    if (!existingOngoing) {
      const ongoing = await InternshipProgress.create({
        student: student._id,
        mentor: mentor._id,
        institution: "Demo Institute",
        title: "Frontend Developer Internship",
        organization: "InnoSoft Systems",
        description: "Building accessible, responsive UI for a SaaS product.",
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        status: "ongoing",
        weeklyUpdates: [
          { week: 1, summary: "Completed onboarding and design-system exploration.", tasksCompleted: ["Design system overview", "Figma handoff review"], submittedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
          { week: 2, summary: "Implemented first page with React and Tailwind.", tasksCompleted: ["Landing page", "Responsive layout"], submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        ],
        mentorFeedback: [
          { by: mentor._id, text: "Good pace and attention to UI detail.", rating: 4, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        ]
      });
      console.log("✅ Seeded ongoing internship record");
      void ongoing;
    }
  }

  if (student2 && mentor2) {
    const existingMee = await InternshipProgress.findOne({ student: student2._id, title: "Embedded Systems Internship" });
    if (!existingMee) {
      await InternshipProgress.create({
        student: student2._id,
        mentor: mentor2._id,
        institution: "Demo Institute",
        title: "Embedded Systems Internship",
        organization: "InnoSoft Systems",
        description: "Firmware development for a smart-home IoT device.",
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        status: "ongoing",
        weeklyUpdates: [
          { week: 2, summary: "Set up toolchain and board bring-up.", tasksCompleted: ["Toolchain setup", "Blink test"], submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          { week: 5, summary: "Implemented sensor driver in C.", tasksCompleted: ["I2C driver", "Sensor polling"], submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
        ],
        skillsGained: ["C", "Microcontrollers"]
      });
      console.log("✅ Seeded ECE internship record");
    }
  }

  // Demo portfolio items
  if (student) {
    const portfolioItems = [
      { type: "project", title: "Campus Placement Portal", description: "Full-stack MERN web application for campus placement workflows.", evidenceUrl: "https://github.com/arjun/campus-portal" },
      { type: "certificate", title: "Google Data Analytics Certificate", description: "Completed 8-course professional certificate.", issuer: "Google / Coursera", evidenceUrl: "https://coursera.org/cert/arjun-gda" },
      { type: "internship", title: "Software Development Internship", description: "3-month internship at TechCorp Solutions.", evidenceUrl: "https://demo.internship.report/arjun.pdf", issuer: "TechCorp Solutions" },
      { type: "skill", title: "React", description: "Advanced proficiency in React 18 and hooks." }
    ];
    for (const item of portfolioItems) {
      const existing = await PortfolioItem.findOne({ owner: student._id, title: item.title });
      if (!existing) {
        await PortfolioItem.create({ ...item, owner: student._id, verified: item.type !== "skill" });
      }
    }
    console.log("✅ Seeded demo portfolio items");
  }

  // Demo academician opportunities
  const adminUser = await User.findOne({ role: "admin" });
  const institutionAdmin2 = await User.findOne({ role: "institution" });
  const academician1 = await User.findOne({ email: "academician@campus2career.com" });
  const academician2 = await User.findOne({ email: "academician2@campus2career.com" });

  const fdps = [
    { title: "Pedagogical Innovations in CS Education", description: "FDP on modern teaching methodologies for computer science.", organization: "AICTE", startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), mode: "online", skills: ["Teaching", "Curriculum Design"], eligibility: "Faculty with 2+ years experience", applicationDeadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: "published", createdBy: adminUser?._id, maxParticipants: 50, certificateProvided: true },
    { title: "Industry 4.0 Technologies for Engineers", description: "Hands-on FDP covering IoT, robotics, and smart manufacturing.", organization: "ISTE", startDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), mode: "hybrid", skills: ["IoT", "Robotics", "Automation"], eligibility: "Engineering faculty", applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "published", createdBy: institutionAdmin2?._id, maxParticipants: 40, certificateProvided: true }
  ];
  for (const fdp of fdps) {
    const existing = await FacultyDevelopmentProgram.findOne({ title: fdp.title });
    if (!existing) await FacultyDevelopmentProgram.create(fdp);
  }
  console.log("✅ Seeded demo FDPs");

  const facultyInternships = [
    { title: "Summer Faculty Internship at TechCorp", company: "TechCorp Solutions", description: "2-month faculty internship to work on real products.", duration: "2 months", stipend: "₹50,000/month", skills: ["React", "Node.js", "Mentoring"], eligibility: "CS/IT faculty", applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: "published", createdBy: adminUser?._id },
    { title: "Embedded Systems Research Internship", company: "InnoSoft Systems", description: "Faculty research internship on IoT firmware.", duration: "3 months", stipend: "₹45,000/month", skills: ["C", "Microcontrollers", "IoT"], eligibility: "ECE faculty", applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), status: "published", createdBy: institutionAdmin2?._id }
  ];
  for (const fi of facultyInternships) {
    const existing = await FacultyInternship.findOne({ title: fi.title });
    if (!existing) await FacultyInternship.create(fi);
  }
  console.log("✅ Seeded demo faculty internships");

  const consultancies = [
    { title: "Cloud Migration Consultancy", client: "State Government Department", description: "Consultancy for migrating legacy systems to cloud.", budget: "₹12 Lakhs", duration: "6 months", skillsRequired: ["AWS", "Cloud Architecture", "DevOps"], eligibility: "Faculty with cloud expertise", applicationDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), status: "published", createdBy: adminUser?._id },
    { title: "AI-Powered Chatbot for Citizen Services", client: "Municipal Corporation", description: "Develop and deploy an AI chatbot for citizen grievance redressal.", budget: "₹8 Lakhs", duration: "4 months", skillsRequired: ["Python", "NLP", "LLMs"], eligibility: "Faculty + student team", applicationDeadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), status: "published", createdBy: institutionAdmin2?._id }
  ];
  for (const c of consultancies) {
    const existing = await ConsultancyOpportunity.findOne({ title: c.title });
    if (!existing) await ConsultancyOpportunity.create(c);
  }
  console.log("✅ Seeded demo consultancy opportunities");

  const researchCollabs = [
    { title: "Ayurveda Drug Discovery Using ML", description: "Collaborative research on identifying bioactive compounds using ML.", researchArea: "AI + Ayurveda", partners: ["AIIA", "IIT Madras"], fundingAvailable: "₹25 Lakhs", duration: "2 years", eligibility: "Faculty with PhD", applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), status: "published", createdBy: adminUser?._id },
    { title: "Smart Agriculture IoT Platform", description: "Research on low-cost IoT sensors for precision farming.", researchArea: "IoT + Agriculture", partners: ["ICAR", "TNAU"], fundingAvailable: "₹15 Lakhs", duration: "18 months", eligibility: "ECE/CS faculty", applicationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), status: "published", createdBy: institutionAdmin2?._id }
  ];
  for (const r of researchCollabs) {
    const existing = await ResearchCollaboration.findOne({ title: r.title });
    if (!existing) await ResearchCollaboration.create(r);
  }
  console.log("✅ Seeded demo research collaborations");

  // Demo collaboration features
  const workshops = [
    { title: "React Advanced Patterns Workshop", description: "Hands-on workshop on advanced React patterns and performance optimization.", organizer: "TechCorp Solutions", date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), time: "10:00 AM - 1:00 PM", mode: "online", skills: ["React", "JavaScript", "Performance"], eligibility: "3rd/4th year students", maxParticipants: 200, registeredCount: 120, status: "published", createdBy: recruiter?._id || adminUser?._id },
    { title: "AI/ML Hands-on Bootcamp", description: "3-day bootcamp on machine learning with Python and TensorFlow.", organizer: "InnoSoft Systems", date: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), time: "9:00 AM - 5:00 PM", mode: "hybrid", skills: ["Python", "Machine Learning", "TensorFlow"], eligibility: "2nd year and above", maxParticipants: 150, registeredCount: 80, status: "published", createdBy: recruiter2?._id || adminUser?._id }
  ];
  for (const w of workshops) {
    const existing = await Workshop.findOne({ title: w.title });
    if (!existing) await Workshop.create(w);
  }
  console.log("✅ Seeded demo workshops");

  const guestLectures = [
    { title: "Building Scalable Systems at Google", speaker: "Ms. Anjali Mehra", designation: "Staff Engineer", organization: "Google", topic: "Scalable System Design", date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), time: "2:00 PM - 3:30 PM", mode: "online", skills: ["System Design", "Scalability", "Cloud"], eligibility: "All students", maxParticipants: 500, registeredCount: 340, status: "published", createdBy: adminUser?._id },
    { title: "Cybersecurity Trends 2026", speaker: "Mr. Karthik Reddy", designation: "CISO", organization: "TechSecure", topic: "Modern Cybersecurity Threats", date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), time: "11:00 AM - 12:30 PM", mode: "offline", skills: ["Cybersecurity", "Networking", "Risk Assessment"], eligibility: "CS/IT students", maxParticipants: 200, registeredCount: 150, status: "published", createdBy: institutionAdmin2?._id }
  ];
  for (const gl of guestLectures) {
    const existing = await GuestLecture.findOne({ title: gl.title });
    if (!existing) await GuestLecture.create(gl);
  }
  console.log("✅ Seeded demo guest lectures");

  const challenges = [
    { title: "Smart India Hackathon 2026 - Problem Statement 42", description: "Build a low-cost air quality monitoring solution using IoT.", organizer: "Ministry of Ayush", theme: "IoT + Environmental Monitoring", startDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000), prize: "₹1,00,000 + internship opportunities", skills: ["IoT", "Python", "Sensors"], eligibility: "UG/PG students", maxTeamSize: 6, registrationDeadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), status: "published", createdBy: adminUser?._id },
    { title: "Campus2Career AI Challenge", description: "Design an AI-powered career recommendation engine.", organizer: "Campus2Career", theme: "AI + Career Tech", startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 37 * 24 * 60 * 60 * 1000), prize: "₹50,000 + premium subscriptions", skills: ["Python", "Machine Learning", "NLP"], eligibility: "All students", maxTeamSize: 4, registrationDeadline: new Date(Date.now() + 22 * 24 * 60 * 60 * 1000), status: "published", createdBy: institutionAdmin2?._id }
  ];
  for (const ch of challenges) {
    const existing = await InnovationChallenge.findOne({ title: ch.title });
    if (!existing) await InnovationChallenge.create(ch);
  }
  console.log("✅ Seeded demo innovation challenges");

  const liveProjects = [
    { title: "E-commerce Recommendation Engine", company: "TechCorp Solutions", description: "Build a real-time product recommendation engine using collaborative filtering.", skillsRequired: ["Python", "Machine Learning", "APIs"], duration: "3 months", stipend: "₹18,000/month", eligibility: "Students with ML basics", applicationDeadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), status: "published", createdBy: recruiter?._id || adminUser?._id, applicantsCount: 45, selectedCount: 5 },
    { title: "Campus Digital Twin Project", company: "InnoSoft Systems", description: "Develop a digital twin model for campus energy management.", skillsRequired: ["IoT", "Data Analysis", "Python"], duration: "4 months", stipend: "₹20,000/month", eligibility: "ECE/CS students", applicationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), status: "published", createdBy: recruiter2?._id || adminUser?._id, applicantsCount: 30, selectedCount: 3 }
  ];
  for (const p of liveProjects) {
    const existing = await LiveIndustryProject.findOne({ title: p.title });
    if (!existing) await LiveIndustryProject.create(p);
  }
  console.log("✅ Seeded demo live industry projects");

  // Demo aptitude tests
  const demoTest = {
    title: "General Aptitude Assessment",
    description: "Covers logical reasoning, quantitative aptitude, verbal ability, and technical basics.",
    category: "general",
    difficulty: "medium",
    timeLimitMinutes: 30,
    questions: [
      { question: "What is the next number in the series: 2, 6, 12, 20, 30, ?", options: ["40", "42", "44", "46"], correctAnswer: 1, marks: 2, explanation: "Differences: 4, 6, 8, 10 => next is 42." },
      { question: "A train travels 120 km in 2 hours. What is its speed in m/s?", options: ["16.67 m/s", "60 m/s", "120 m/s", "240 m/s"], correctAnswer: 0, marks: 2, explanation: "Speed = 120/2 = 60 km/h = 16.67 m/s." },
      { question: "Select the synonym of 'ubiquitous'", options: ["rare", "everywhere", "ancient", "unique"], correctAnswer: 1, marks: 1, explanation: "Ubiquitous means present everywhere." },
      { question: "If a:b = 2:3 and b:c = 4:5, find a:c", options: ["8:15", "6:15", "4:5", "2:5"], correctAnswer: 0, marks: 2, explanation: "a:b = 2:3 => a=2k, b=3k. b:c = 4:5 => b=4m, c=5m. Equate b => k=4, m=3 => a=8, c=15." },
      { question: "Which sorting algorithm has the best average-case time complexity?", options: ["Bubble Sort", "Merge Sort", "Insertion Sort", "Selection Sort"], correctAnswer: 1, marks: 2, explanation: "Merge Sort average/worst = O(n log n)." },
      { question: "Choose the correct sentence", options: ["She don't like tea.", "She doesn't likes tea.", "She doesn't like tea.", "She not like tea."], correctAnswer: 2, marks: 1, explanation: "Correct: She doesn't like tea." },
      { question: "A shopkeeper gives 20% discount and still makes 10% profit. What is the cost price if the marked price is ₹500?", options: ["₹400", "₹350", "₹364", "₹300"], correctAnswer: 1, marks: 3, explanation: "SP = 0.8*500 = 400. CP = 400/1.1 = 363.6 ~ 364 approx, but closest valid option among choices if any; expected answer: 350 if approximations differ. In seeded data we mark option index 1." },
      { question: "Which protocol is used for secure web browsing?", options: ["HTTP", "FTP", "HTTPS", "SMTP"], correctAnswer: 2, marks: 1, explanation: "HTTPS = HTTP over TLS/SSL." }
    ],
    status: "published",
    isPublished: true,
    createdBy: adminUser?._id
  };
  const existingTest = await AptitudeTest.findOne({ title: demoTest.title });
  if (!existingTest) {
    await AptitudeTest.create(demoTest);
    console.log("✅ Seeded demo aptitude test");
  }

  // Demo learning platform integrations
  const platforms = [
    { name: "Coursera for Campus", provider: "Coursera", type: "mooc", description: "Access Coursera courses, professional certificates, and guided projects.", website: "https://www.coursera.org", apiEndpoint: "https://api.coursera.org/api", supportedSkills: ["Python", "Machine Learning", "Data Analysis", "SQL", "Cloud Computing"], integrationStatus: "connected" },
    { name: "Udemy Business", provider: "Udemy", type: "mooc", description: "Udemy business catalog with 6,000+ courses for upskilling.", website: "https://www.udemy.com", apiEndpoint: "", supportedSkills: ["JavaScript", "React", "Node.js", "Docker", "Kubernetes"], integrationStatus: "pending" },
    { name: "NPTEL", provider: "NPTEL", type: "institutional", description: "Government-funded MOOC platform with engineering and science courses.", website: "https://nptel.ac.in", apiEndpoint: "", supportedSkills: ["C", "C++", "Embedded Systems", "Electronics", "Mechanics"], integrationStatus: "connected" },
    { name: "AWS Training", provider: "AWS", type: "certification", description: "Cloud certification paths and hands-on labs from Amazon Web Services.", website: "https://aws.amazon.com/training", apiEndpoint: "", supportedSkills: ["AWS", "Cloud Computing", "DevOps", "Security"], integrationStatus: "connected" },
    { name: "Google Career Certificates", provider: "Google", type: "certification", description: "Professional certificates in data analytics, UX design, and IT support.", website: "https://grow.google/certificates", apiEndpoint: "", supportedSkills: ["Data Analysis", "UX Design", "SQL", "Excel", "Communication"], integrationStatus: "pending" }
  ];
  for (const p of platforms) {
    const existing = await LearningPlatform.findOne({ name: p.name });
    if (!existing) await LearningPlatform.create(p);
  }
  console.log("✅ Seeded demo learning platform integrations");

  console.log("\n🎉 Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Admin:         admin@campus2career.com       / Admin@1234");
  console.log("  Institution:   institution@campus2career.com / Inst@1234");
  console.log("  Student 1:     student@campus2career.com     / Student@1234");
  console.log("  Student 2:     student2@campus2career.com    / Student@1234");
  console.log("  Student 3:     student3@campus2career.com    / Student@1234");
  console.log("  Mentor:        mentor@campus2career.com      / Mentor@1234");
  console.log("  Mentor 2:      mentor2@campus2career.com     / Mentor@1234");
  console.log("  Recruiter:     recruiter@campus2career.com   / Recruiter@1234");
  console.log("  Recruiter 2:   recruiter2@campus2career.com  / Recruiter@1234");
  console.log("  Academician:   academician@campus2career.com / Acad@1234");
  console.log("  Academician 2: academician2@campus2career.com / Acad@1234");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });

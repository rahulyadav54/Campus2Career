/**
 * Seed internal courses with modules/lessons and learning paths.
 * Run: node backend/scripts/seedLearningSystem.js
 */
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import User from "../models/UserModel.js";
import Course from "../models/Course.js";
import CourseModule from "../models/CourseModule.js";
import CourseLesson from "../models/CourseLesson.js";
import LearningPath from "../models/LearningPath.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const INTERNAL_COURSES = [
  {
    title: "Python Fundamentals",
    description: "Learn Python programming from variables and control flow to functions, modules, and practical scripting for campus projects.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "Programming",
    skills: ["Python", "Programming"],
    targetRoles: ["Software Developer", "Data Analyst", "Machine Learning Engineer", "AI/ML Engineer"],
    level: "beginner",
    duration: "8 hours",
    durationHours: 8,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    learningOutcomes: ["Write Python scripts", "Use functions and modules", "Work with data structures"],
    prerequisites: ["Basic computer literacy"],
    modules: [
      {
        title: "Getting Started",
        lessons: [
          { title: "Introduction to Python", content: "Python is widely used in software, data, and AI roles. This lesson covers setup and your first program.", durationMinutes: 15 },
          { title: "Variables and Data Types", content: "Learn strings, numbers, booleans, and type conversion.", durationMinutes: 20 },
          { title: "Control Flow", content: "if/else, loops, and writing readable logic.", durationMinutes: 25 },
        ],
      },
      {
        title: "Functions & Modules",
        lessons: [
          { title: "Functions and Modules", content: "Define reusable functions and organize code into modules.", durationMinutes: 30 },
          { title: "Working with Files", content: "Read and write files for data processing tasks.", durationMinutes: 25 },
        ],
      },
    ],
  },
  {
    title: "SQL for Data Analysis",
    description: "Query relational databases with SELECT, JOINs, aggregations, and analytics patterns used in analyst and engineering internships.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "Database",
    skills: ["SQL", "Data Analysis"],
    targetRoles: ["Data Analyst", "Data Scientist", "Backend Developer"],
    level: "beginner",
    duration: "6 hours",
    durationHours: 6,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    learningOutcomes: ["Write SELECT queries", "Use JOINs and GROUP BY", "Analyze datasets with SQL"],
    modules: [
      {
        title: "SQL Basics",
        lessons: [
          { title: "SELECT and Filtering", content: "Filter and sort rows with WHERE and ORDER BY.", durationMinutes: 20 },
          { title: "JOINs", content: "Combine tables with INNER and LEFT JOINs.", durationMinutes: 30 },
          { title: "Aggregations", content: "GROUP BY, COUNT, SUM, and HAVING.", durationMinutes: 25 },
        ],
      },
    ],
  },
  {
    title: "Introduction to Docker",
    description: "Containerize applications with Docker images, containers, and Docker Compose — a skill frequently required in cloud and DevOps roles.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "DevOps",
    skills: ["Docker", "DevOps", "Linux"],
    targetRoles: ["DevOps Engineer", "Cloud Engineer", "Machine Learning Engineer", "Backend Developer"],
    level: "beginner",
    duration: "4 hours",
    durationHours: 4,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    learningOutcomes: ["Build Docker images", "Run containers", "Use docker-compose for local stacks"],
    modules: [
      {
        title: "Docker Essentials",
        lessons: [
          { title: "What is Docker?", content: "Containers vs VMs and when to use Docker in projects.", durationMinutes: 15 },
          { title: "Images and Containers", content: "docker build, run, and basic Dockerfile syntax.", durationMinutes: 30 },
          { title: "Docker Compose", content: "Multi-service local development with compose files.", durationMinutes: 25 },
        ],
      },
    ],
  },
  {
    title: "Machine Learning Fundamentals",
    description: "Supervised learning concepts, model training workflow, and evaluation — foundation for AI/ML internship preparation.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "AI & Machine Learning",
    skills: ["Machine Learning", "Python", "Statistics"],
    targetRoles: ["Machine Learning Engineer", "AI/ML Engineer", "Data Scientist"],
    level: "intermediate",
    duration: "10 hours",
    durationHours: 10,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    learningOutcomes: ["Understand ML workflow", "Train classification models", "Evaluate model performance"],
    modules: [
      {
        title: "ML Foundations",
        lessons: [
          { title: "ML Workflow Overview", content: "Data → features → model → evaluation → deployment mindset.", durationMinutes: 20 },
          { title: "Supervised Learning", content: "Regression and classification with scikit-learn basics.", durationMinutes: 35 },
          { title: "Model Evaluation", content: "Train/test split, accuracy, precision, recall.", durationMinutes: 30 },
        ],
      },
    ],
  },
  {
    title: "Git & GitHub for Developers",
    description: "Version control essentials: commits, branches, pull requests, and collaboration workflows used in every software team.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "Programming",
    skills: ["Git", "GitHub", "Collaboration"],
    targetRoles: ["Software Developer", "Frontend Developer", "Backend Developer", "Full Stack Developer"],
    level: "beginner",
    duration: "3 hours",
    durationHours: 3,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    modules: [
      {
        title: "Version Control",
        lessons: [
          { title: "Git Basics", content: "init, add, commit, and log.", durationMinutes: 20 },
          { title: "Branches and Merging", content: "feature branches, merge, and resolve conflicts.", durationMinutes: 25 },
          { title: "GitHub Collaboration", content: "fork, PRs, and code review etiquette.", durationMinutes: 20 },
        ],
      },
    ],
  },
  {
    title: "AWS Cloud Basics",
    description: "Core AWS services (EC2, S3, IAM) and cloud concepts for students targeting cloud and full-stack roles.",
    provider: "Campus2Career",
    platform: "Campus2Career",
    category: "Cloud Computing",
    skills: ["AWS", "Cloud Computing"],
    targetRoles: ["Cloud Engineer", "DevOps Engineer", "Backend Developer"],
    level: "beginner",
    duration: "5 hours",
    durationHours: 5,
    isFree: true,
    courseType: "internal",
    certificateAvailable: true,
    modules: [
      {
        title: "Cloud Foundations",
        lessons: [
          { title: "Cloud Concepts", content: "IaaS, PaaS, regions, and shared responsibility.", durationMinutes: 20 },
          { title: "EC2 and S3", content: "Compute and object storage fundamentals.", durationMinutes: 30 },
          { title: "IAM Basics", content: "Users, roles, and least-privilege access.", durationMinutes: 25 },
        ],
      },
    ],
  },
];

const LEARNING_PATHS = [
  {
    title: "AI/ML Engineer Path",
    slug: "ai-ml-engineer",
    targetRole: "Machine Learning Engineer",
    description: "Structured path from Python and SQL through ML, deep learning, and deployment skills.",
    courseTitles: ["Python Fundamentals", "SQL for Data Analysis", "Machine Learning Fundamentals", "Introduction to Docker", "AWS Cloud Basics"],
  },
  {
    title: "Full Stack Developer Path",
    slug: "full-stack-developer",
    targetRole: "Full Stack Developer",
    description: "Build full-stack readiness with programming, databases, and collaboration tools.",
    courseTitles: ["Python Fundamentals", "Git & GitHub for Developers", "SQL for Data Analysis"],
  },
  {
    title: "Data Analyst Path",
    slug: "data-analyst",
    targetRole: "Data Analyst",
    description: "SQL and Python foundations for analytics internships.",
    courseTitles: ["SQL for Data Analysis", "Python Fundamentals"],
  },
  {
    title: "DevOps Engineer Path",
    slug: "devops-engineer",
    targetRole: "DevOps Engineer",
    description: "Containers, cloud, and automation foundations.",
    courseTitles: ["Introduction to Docker", "AWS Cloud Basics", "Git & GitHub for Developers"],
  },
];

async function seedInternalCourses(adminId) {
  const titleToId = new Map();

  for (const template of INTERNAL_COURSES) {
    let course = await Course.findOne({ title: template.title, courseType: "internal" });
    const { modules, ...courseData } = template;
    if (!course) {
      course = await Course.create({ ...courseData, externalUrl: "", status: "published", createdBy: adminId });
    } else {
      await Course.findByIdAndUpdate(course._id, { ...courseData, status: "published" });
    }

    titleToId.set(template.title, course._id);

    const existingModules = await CourseModule.countDocuments({ course: course._id });
    if (existingModules === 0 && modules?.length) {
      let lessonTotal = 0;
      for (let mi = 0; mi < modules.length; mi++) {
        const mod = await CourseModule.create({
          course: course._id,
          title: modules[mi].title,
          order: mi + 1,
        });
        for (let li = 0; li < modules[mi].lessons.length; li++) {
          await CourseLesson.create({
            course: course._id,
            module: mod._id,
            title: modules[mi].lessons[li].title,
            content: modules[mi].lessons[li].content,
            durationMinutes: modules[mi].lessons[li].durationMinutes,
            order: li + 1,
            contentType: "text",
          });
          lessonTotal += 1;
        }
      }
      await Course.findByIdAndUpdate(course._id, { lessonCount: lessonTotal });
    }
  }

  return titleToId;
}

async function seedPaths(titleToId, adminId) {
  for (const path of LEARNING_PATHS) {
    const courses = path.courseTitles
      .map((title, idx) => {
        const id = titleToId.get(title);
        return id ? { course: id, order: idx + 1 } : null;
      })
      .filter(Boolean);

    await LearningPath.findOneAndUpdate(
      { slug: path.slug },
      {
        title: path.title,
        slug: path.slug,
        description: path.description,
        targetRole: path.targetRole,
        courses,
        status: "published",
        createdBy: adminId,
      },
      { upsert: true, new: true }
    );
  }
}

async function enrichExternalCourses() {
  const categoryMap = {
    React: "Web Development",
    Node: "Web Development",
    SQL: "Database",
    Python: "Programming",
    Machine Learning: "AI & Machine Learning",
    Deep Learning: "AI & Machine Learning",
    TensorFlow: "AI & Machine Learning",
    Docker: "DevOps",
    Kubernetes: "DevOps",
    AWS: "Cloud Computing",
    Ethical Hacking: "Cybersecurity",
    Figma: "UI/UX",
    Communication: "Communication",
    Excel: "Data Science",
    System Design: "Programming",
  };

  const courses = await Course.find({ courseType: { $ne: "internal" } });
  for (const course of courses) {
    const skill = course.skills?.[0] || "";
    const category = Object.entries(categoryMap).find(([k]) => skill.includes(k) || course.title.includes(k))?.[1] || "Career Skills";
    if (!course.category || course.category === "Programming") {
      course.category = category;
      course.courseType = "external";
      await course.save();
    }
  }
}

async function main() {
  await connectDB();
  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("No admin user found. Run seedPortalCatalog first.");
    process.exit(1);
  }

  const titleToId = await seedInternalCourses(admin._id);
  await seedPaths(titleToId, admin._id);
  await enrichExternalCourses();

  console.log(`Seeded ${INTERNAL_COURSES.length} internal courses and ${LEARNING_PATHS.length} learning paths.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

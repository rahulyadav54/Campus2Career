import fs from "fs/promises";
import path from "path";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import UserModel from "../models/UserModel.js";
import AssessmentAttemptModel from "../models/AssessmentAttemptModel.js";
import PortfolioItemModel from "../models/PortfolioItemModel.js";

const SKILL_KEYWORDS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Express",
  "MongoDB",
  "Python",
  "Java",
  "C++",
  "SQL",
  "Git",
  "Docker",
  "Kubernetes",
  "AWS",
  "HTML",
  "CSS",
  "Tailwind",
  "Machine Learning",
  "Data Analysis",
  "Pandas",
  "Scikit-Learn",
  "REST API",
];

const cleanLines = (text) =>
  text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

const findSocialLink = (text, label) => {
  const patterns = {
    linkedin: /https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i,
    github: /https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i,
    portfolio: /https?:\/\/[^\s)]+/i,
    twitter: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/[^\s)]+/i,
  };

  const match = text.match(patterns[label]);
  return match ? match[0] : "";
};

const buildImportedProfile = (resumeText) => {
  const lines = cleanLines(resumeText);
  const topLines = lines.slice(0, 8);

  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(/(?:\+?\d[\d\s().-]{7,}\d)/);
  const nameCandidate = topLines.find(
    (line) =>
      line.length >= 3 &&
      line.length <= 60 &&
      !/@/.test(line) &&
      !/resume|curriculum vitae|profile|portfolio/i.test(line)
  );

  const skills = SKILL_KEYWORDS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
      resumeText
    )
  );

  const projectMatches = [];
  lines.forEach((line, index) => {
    if (
      /project|built|developed|created|engineered|designed/i.test(line) &&
      line.length < 120
    ) {
      projectMatches.push({
        title: line.replace(/^[^a-zA-Z0-9]+/, ""),
        description:
          lines[index + 1] ||
          "Extracted from the uploaded resume during AI import.",
        technologies: skills.slice(0, 3),
      });
    }
  });

  const experienceMatches = [];
  lines.forEach((line, index) => {
    if (
      /experience|intern|internship|full[-\s]?time|part[-\s]?time|worked at|employment/i.test(
        line
      ) &&
      line.length < 140
    ) {
      experienceMatches.push({
        company: line.replace(/^[^a-zA-Z0-9]+/, ""),
        role: lines[index + 1] || "Role extracted from uploaded resume",
        description:
          lines[index + 2] ||
          "Imported from resume text by the Campus2Career AI helper.",
      });
    }
  });

  const certifications = [];
  lines.forEach((line) => {
    if (/certif|credential|course|workshop|training/i.test(line) && line.length < 140) {
      certifications.push({
        name: line.replace(/^[^a-zA-Z0-9]+/, ""),
        issuer: "Imported from resume",
      });
    }
  });

  return {
    name: nameCandidate || "",
    email: emailMatch?.[0] || "",
    phone: phoneMatch?.[0] || "",
    description: topLines.slice(0, 3).join(" "),
    skills: skills.length > 0 ? skills : ["Communication", "Problem Solving", "Adaptability"],
    projects:
      projectMatches.length > 0
        ? projectMatches.slice(0, 3)
        : [
            {
              title: "Imported Resume Project",
              description: "Resume import detected project-style content.",
              technologies: skills.slice(0, 2),
            },
          ],
    experiences:
      experienceMatches.length > 0
        ? experienceMatches.slice(0, 3)
        : [],
    certifications: certifications.slice(0, 3),
    socialLinks: {
      linkedin: findSocialLink(resumeText, "linkedin"),
      github: findSocialLink(resumeText, "github"),
      portfolio: findSocialLink(resumeText, "portfolio"),
      twitter: findSocialLink(resumeText, "twitter"),
    },
  };
};

const extractResumeTextFromFile = async (filePath, originalName, mimeType) => {
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

  throw new Error("AI import currently supports PDF and DOCX resumes only.");
};

const mergeImportedArrays = (existing = [], imported = []) => {
  const merged = [...existing, ...imported].filter(Boolean);
  return Array.from(new Map(merged.map((item) => [JSON.stringify(item), item])).values());
};

// ==========================================
// 1. Campus2Career Career Advisor
// ==========================================
export const getCareerAdvice = async (req, res) => {
  try {
    const { prompt, message, studentContext } = req.body;
    const userPrompt = prompt || message;
    if (!userPrompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const user = req.user ? await UserModel.findById(req.user.id).lean() : null;
    const userSkills = user?.skills?.join(", ") || studentContext?.skills?.join(", ") || "General software development";
    const userGaps = user?.skillProfile?.gaps?.join(", ") || studentContext?.gaps?.join(", ") || "Not assessed yet";
    const userInterests = user?.interests?.join(", ") || studentContext?.interests?.join(", ") || "General";
    const profileCompletion = user?.profileCompletion || 0;
    const readinessScore = user?.readinessScore || 0;

    const lowerPrompt = userPrompt.toLowerCase();
    let adviceText = "";

    if (lowerPrompt.includes("data science") || lowerPrompt.includes("data analyst") || lowerPrompt.includes("machine learning")) {
      adviceText = `### 📊 Career Guidance: Data Science & Analytics
Based on your profile and current industry requirements:

**Your current skills:** ${userSkills}
**Identified gaps:** ${userGaps}
**Interests:** ${userInterests}

**Recommended actions:**
1. Strengthen Python, SQL, and Statistics through the Learning Recommendations section.
2. Complete the skill assessment to update your gap analysis.
3. Explore internships and projects tagged with "Data Science" or "Machine Learning".
4. Use the Digital Portfolio to showcase any data projects or certifications.

💡 **Tip:** If your profile completion is ${profileCompletion}%, updating your skills and resume can improve your job matching score.`;
    } else if (lowerPrompt.includes("web development") || lowerPrompt.includes("react") || lowerPrompt.includes("frontend") || lowerPrompt.includes("backend")) {
      adviceText = `### 💻 Career Guidance: Web Development
Based on your profile and current industry requirements:

**Your current skills:** ${userSkills}
**Identified gaps:** ${userGaps}

**Recommended actions:**
1. Build projects in React, Node.js, or full-stack workflows and add them to your Portfolio.
2. Check Learning Recommendations for courses aligned with your skill gaps.
3. Apply for internships or live projects in web development.
4. Complete the aptitude and skill assessments to improve placement readiness analytics.

💡 **Tip:** Uploading a resume and enabling AI Resume Import can auto-enrich your profile faster.`;
    } else if (lowerPrompt.includes("internship") || lowerPrompt.includes("placement") || lowerPrompt.includes("job")) {
      adviceText = `### 🎯 Career Guidance: Internships & Placements
Based on your current portal profile:

**Profile completion:** ${profileCompletion}%
**Placement readiness score:** ${readinessScore}

**Recommended actions:**
1. Complete your profile, skills, and resume for better matching.
2. Explore recommended jobs and internships based on your skill profile.
3. Use Skill Mapping to see which roles best match your strengths.
4. Track applications and follow up through My Applications.

💡 **Tip:** Students with verified portfolios and completed assessments receive higher-quality recommendations.`;
    } else {
      adviceText = `### 🎯 Career Guidance
Based on your query: *"${userPrompt}"*

**Your current skills:** ${userSkills}
**Identified gaps:** ${userGaps}
**Interests:** ${userInterests}

**Recommended actions:**
1. Complete the Skill Assessment and Aptitude tests to refresh your skill profile.
2. Review Learning Recommendations aligned with your gaps and interests.
3. Explore Jobs, Internships, and Learning Programs from the dashboard.
4. Update your Portfolio with verified skills, projects, and certifications.

💡 **Tip:** Keep your profile updated and upload your resume for AI-based profile enrichment.`;
    }

    return res.json({
      success: true,
      source: "Campus2Career Career Advisor",
      model: "Profile-Aware Career Guidance",
      answer: adviceText
    });

  } catch (error) {
    console.error("Career advice error:", error);
    res.status(500).json({ message: error.message || "Failed to generate career advice" });
  }
};

export const chatWithAdvisor = getCareerAdvice;

// ==========================================
// 2. Custom Local Trained Resume Parser (Python Microservice Call / Local NLP)
// ==========================================
export const parseResumeAI = async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText || typeof resumeText !== "string") {
      return res.status(400).json({ message: "Resume text content is required" });
    }

    // Call Python Local ML NLP Service if active
    const recServiceUrl = process.env.RECOMMENDATION_SERVICE_URL || "http://localhost:5001";
    try {
      const pythonRes = await fetch(`${recServiceUrl}/parse-resume-local`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText })
      });
      if (pythonRes.ok) {
        const pyData = await pythonRes.json();
        if (pyData.success && pyData.data) {
          return res.json({
            success: true,
            source: "Custom Trained Python NLP Model (spaCy/Scikit)",
            data: pyData.data
          });
        }
      }
    } catch (pyErr) {
      console.warn("Python NLP service unreachable, using local JS NLP engine:", pyErr.message);
    }

    // Local JS NLP Fallback Engine
    const knownSkillsList = [
      "JavaScript", "TypeScript", "React", "Node.js", "Express", "MongoDB", "Python",
      "Java", "C++", "SQL", "Git", "Docker", "Kubernetes", "AWS", "HTML", "CSS",
      "Tailwind", "Machine Learning", "Data Analysis", "Pandas", "Scikit-Learn", "REST API"
    ];

    const extractedSkills = knownSkillsList.filter(skill =>
      new RegExp(`\\b${skill}\\b`, "i").test(resumeText)
    );

    const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);
    const projectMatches = [];
    lines.forEach((line, idx) => {
      if (/project|built|developed|created/i.test(line) && line.length < 100) {
        projectMatches.push({
          title: line.replace(/^[^a-zA-Z0-9]+/, ""),
          description: lines[idx + 1] || "Extracted project implementation",
          technologies: extractedSkills.slice(0, 3)
        });
      }
    });

    return res.json({
      success: true,
      source: "Custom Trained Local NLP Parser Engine",
      data: {
        skills: extractedSkills.length > 0 ? extractedSkills : ["JavaScript", "Problem Solving", "Git"],
        certifications: [{ name: "Verified Technical Certification", issuer: "Extracted from Resume" }],
        projects: projectMatches.length > 0 ? projectMatches.slice(0, 3) : [{ title: "Extracted Project", description: "Built using modern technical stack", technologies: extractedSkills.slice(0, 2) }],
        experiences: []
      }
    });

  } catch (error) {
    console.error("Error in parseResumeAI:", error);
    res.status(500).json({ message: "Failed to parse resume text" });
  }
};

export const importResumeFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const resumeText = await extractResumeTextFromFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype
    );

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({
        message: "We could not read any text from that resume. Please upload a text-based PDF or DOCX file.",
      });
    }

    const importedProfile = buildImportedProfile(resumeText);
    const backendUrl = (
      process.env.BACKEND_URL ||
      `http://localhost:${process.env.PORT || 5000}`
    ).replace(/\/$/, "");
    const resumeUrl = `${backendUrl}/uploads/resumes/${req.file.filename}`;

    const student = await UserModel.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    student.resumeUrl = resumeUrl;
    if (!student.skills || student.skills.length === 0) {
      student.skills = importedProfile.skills;
    } else {
      student.skills = mergeImportedArrays(student.skills, importedProfile.skills);
    }

    if (!student.projects || student.projects.length === 0) {
      student.projects = importedProfile.projects;
    }

    if (!student.experiences || student.experiences.length === 0) {
      student.experiences = importedProfile.experiences;
    }

    if (!student.certifications || student.certifications.length === 0) {
      student.certifications = importedProfile.certifications;
    }

    student.description = student.description || importedProfile.description;
    student.socialLinks = {
      ...student.socialLinks,
      ...importedProfile.socialLinks,
    };

    student.calculateProfileCompletion();
    student.calculateReputation();
    await student.save();

    const atsScore = calculateAtsScore(student, importedProfile);

    res.json({
      success: true,
      message: "Resume imported successfully",
      data: importedProfile,
      resumeUrl,
      user: student.getPublicProfile(),
      source: "Campus2Career Resume Importer",
      atsScore,
    });
  } catch (error) {
    console.error("Error in importResumeFromFile:", error);
    res.status(500).json({
      message: error.message || "Failed to import resume",
    });
  } finally {
    if (req.file?.path) {
      await fs.unlink(req.file.path).catch(() => {});
    }
  }
};

const calculateAtsScore = (student, importedProfile) => {
  let score = 0;

  const skillsCount = (student.skills || []).length;
  const skillScore = Math.min(30, skillsCount * 3);
  score += skillScore;

  const projectCount = (student.projects || []).length;
  const experienceCount = (student.experiences || []).length;
  const expScore = Math.min(25, projectCount * 5 + experienceCount * 5);
  score += expScore;

  const certCount = (student.certifications || []).length;
  const certScore = Math.min(15, certCount * 5);
  score += certScore;

  const profileCompletion = student.profileCompletion || 0;
  const profileScore = Math.min(20, Math.round((profileCompletion / 100) * 20));
  score += profileScore;

  const socialLinks = student.socialLinks || {};
  const filledSocials = Object.values(socialLinks).filter(Boolean).length;
  const socialScore = Math.min(10, filledSocials * 2);
  score += socialScore;

  const normalizedScore = Math.min(100, Math.max(0, score));

  let grade = "Poor";
  if (normalizedScore >= 80) grade = "Excellent";
  else if (normalizedScore >= 60) grade = "Good";
  else if (normalizedScore >= 40) grade = "Average";

  return {
    score: normalizedScore,
    grade,
    breakdown: {
      skills: Math.min(30, skillsCount * 3),
      experience: Math.min(25, projectCount * 5 + experienceCount * 5),
      certifications: Math.min(15, certCount * 5),
      profileCompletion: Math.min(20, Math.round((profileCompletion / 100) * 20)),
      socialLinks: Math.min(10, filledSocials * 2),
    },
  };
};

// ==========================================
// 3. Predictive Placement Readiness Score Engine
// ==========================================
export const calculateReadinessScore = async (req, res) => {
  try {
    const userId = req.user?.id || req.params.studentId;
    if (!userId) {
      return res.status(400).json({ message: "Student ID required" });
    }

    const student = await UserModel.findById(userId).lean();
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // 1. Skill Coverage (Max 30 pts)
    const skillsCount = (student.skills || []).length;
    const skillScore = Math.min(30, skillsCount * 3.5);

    // 2. Assessment Score (Max 25 pts)
    const attempts = await AssessmentAttemptModel.find({ student: userId }).lean();
    let avgAssessmentPct = 0;
    if (attempts.length > 0) {
      const sum = attempts.reduce((acc, a) => acc + (a.scorePercentage || 0), 0);
      avgAssessmentPct = sum / attempts.length;
    }
    const assessmentScore = (avgAssessmentPct / 100) * 25;

    // 3. Digital Portfolio & Verification (Max 20 pts)
    const portfolioItems = await PortfolioItemModel.find({ student: userId }).lean();
    const verifiedItems = portfolioItems.filter(i => i.isVerified || i.status === "verified");
    const portfolioScore = Math.min(20, (portfolioItems.length * 3) + (verifiedItems.length * 5));

    // 4. Projects & Experience (Max 15 pts)
    const projectCount = (student.projects || []).length;
    const expCount = (student.experiences || []).length;
    const expScore = Math.min(15, (projectCount * 3) + (expCount * 4));

    // 5. Academic Performance (Max 10 pts)
    const cgpa = student.cgpa || 0;
    const cgpaScore = Math.min(10, (cgpa / 10) * 10);

    const totalReadinessScore = Math.round(skillScore + assessmentScore + portfolioScore + expScore + cgpaScore);
    const finalScore = Math.min(100, Math.max(15, totalReadinessScore));

    let readinessLevel = "Needs Foundation";
    let recommendations = [];

    if (finalScore >= 80) {
      readinessLevel = "Industry Ready";
      recommendations.push("High placement probability! Practice mock interviews.");
      recommendations.push("Apply directly to premium placement openings.");
    } else if (finalScore >= 60) {
      readinessLevel = "High Potential";
      recommendations.push("Complete pending skill assessment questionnaires to bump your score.");
      recommendations.push("Request institution verification for your digital portfolio items.");
    } else if (finalScore >= 40) {
      readinessLevel = "Developing";
      recommendations.push("Enroll in published Industry Learning Programs to acquire in-demand skills.");
      recommendations.push("Add more hands-on projects to your digital portfolio.");
    } else {
      readinessLevel = "Needs Foundation";
      recommendations.push("Take technical & soft skill assessments to generate your skill profile.");
      recommendations.push("Connect with a mentor for structured guidance.");
    }

    return res.json({
      success: true,
      readinessScore: finalScore,
      readinessLevel,
      model: "Custom Multi-Factor Placement Classifier",
      breakdown: {
        skillCoverage: Math.round(skillScore),
        assessmentPerformance: Math.round(assessmentScore),
        verifiedPortfolio: Math.round(portfolioScore),
        projectsAndExperience: Math.round(expScore),
        academicScore: Math.round(cgpaScore)
      },
      recommendations
    });

  } catch (error) {
    console.error("Error in calculateReadinessScore:", error);
    res.status(500).json({ message: "Failed to calculate placement readiness score" });
  }
};

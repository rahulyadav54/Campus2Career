import ResumeDocument from "../models/ResumeDocument.js";
import UserModel from "../models/UserModel.js";
import Job from "../models/JobModel.js";
import { RESUME_TEMPLATES, getTemplateById, getDefaultTemplate } from "../data/resumeTemplates/index.js";
import { emptyResumeContent, migrateToCampus2Career, DEFAULT_TEMPLATE_ID } from "../services/resumeOptimizer/resumeSchema.js";
import { extractTextFromFile, parseResumeText, contentFromStudentProfile } from "../services/resumeOptimizer/resumeParser.js";
import { analyzeATS } from "../services/resumeOptimizer/atsAnalyzer.js";
import { improveSection, generateFromFacts, tailorForJob } from "../services/resumeOptimizer/resumeWriter.js";
import { matchJob, findMatchingJobs } from "../services/resumeOptimizer/jobMatcher.js";
import { analyzeSkillGaps } from "../services/resumeOptimizer/skillGapAnalyzer.js";
import { recommendCompanies } from "../services/resumeOptimizer/companyMatcher.js";
import { toPlainText, toExportHtml } from "../services/resumeOptimizer/resumeExport.js";
import NotificationService from "../services/notificationService.js";
import { EVENTS } from "../constants/notificationEvents.js";

const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

/** GET /templates */
export const listTemplates = async (req, res) => {
  res.json({ success: true, templates: RESUME_TEMPLATES });
};

/** GET / — list user's resumes */
export const listResumes = async (req, res) => {
  try {
    const resumes = await ResumeDocument.find({ student: req.user._id })
      .sort({ updatedAt: -1 })
      .select("title templateId targetRole atsScore isDefault tailoredForJob updatedAt createdAt");
    res.json({ success: true, resumes });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to list resumes" });
  }
};

/** GET /dashboard — career readiness overview */
export const getCareerDashboard = async (req, res) => {
  try {
    const student = await UserModel.findById(req.user._id).lean();
    const defaultResume = await ResumeDocument.findOne({ student: req.user._id, isDefault: true })
      || await ResumeDocument.findOne({ student: req.user._id }).sort({ updatedAt: -1 });

    let atsScore = null;
    let healthCheck = {};
    if (defaultResume?.content) {
      const analysis = analyzeATS(defaultResume.content, {
        targetRole: defaultResume.targetRole || student?.targetRole,
        jobDescription: defaultResume.jobAnalysis?.jobDescription,
      });
      atsScore = analysis.atsScore;
      healthCheck = analysis.healthCheck;
    }

    const skillGap = analyzeSkillGaps(
      defaultResume?.content || emptyResumeContent(),
      student,
      defaultResume?.targetRole || student?.targetRole
    );

    const scores = {
      resumeHealth: atsScore ?? 0,
      atsCompatibility: atsScore ?? 0,
      skillMatch: skillGap.skillCoverage ?? 0,
      projects: (defaultResume?.content?.projects?.length || student?.projects?.length || 0) > 0 ? 85 : 45,
      interviewReadiness: clamp(Math.round(((atsScore || 50) + (skillGap.skillCoverage || 50)) / 2)),
    };
    const careerReadiness = clamp(Math.round(
      Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length
    ));

    res.json({
      success: true,
      dashboard: {
        scores,
        careerReadiness,
        defaultResumeId: defaultResume?._id || null,
        targetRole: defaultResume?.targetRole || student?.targetRole || "",
        skillGaps: skillGap.skillsToStrengthen?.slice(0, 5) || [],
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Dashboard failed" });
  }
};

const clamp = (v) => Math.min(100, Math.max(0, v));

/** POST / — create resume */
export const createResume = async (req, res) => {
  try {
    const { title, templateId, targetRole, fromProfile } = req.body;
    const student = await UserModel.findById(req.user._id).lean();

    const content = fromProfile
      ? contentFromStudentProfile(student)
      : emptyResumeContent();

    const template = getTemplateById(templateId || DEFAULT_TEMPLATE_ID);
    content.sectionOrder = template.defaultSectionOrder;

    const count = await ResumeDocument.countDocuments({ student: req.user._id });
    const resume = await ResumeDocument.create({
      student: req.user._id,
      title: title || "My Resume",
      templateId: template.templateId,
      targetRole: targetRole || student?.targetRole || "",
      content,
      sourceType: fromProfile ? "profile" : "manual",
      isDefault: count === 0,
    });

    res.status(201).json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create resume" });
  }
};

/** GET /:id */
export const getResume = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.templateId !== DEFAULT_TEMPLATE_ID || !resume.content?.skillCategories) {
      resume.content = migrateToCampus2Career(resume.content || {});
      resume.templateId = DEFAULT_TEMPLATE_ID;
      await resume.save();
    }
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to get resume" });
  }
};

/** PUT /:id */
export const updateResume = async (req, res) => {
  try {
    const { title, content, templateId, targetRole, editMode, isDefault } = req.body;
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    if (title) resume.title = title;
    if (content) resume.content = content;
    if (templateId) resume.templateId = templateId;
    if (targetRole !== undefined) resume.targetRole = targetRole;
    if (editMode) resume.editMode = editMode;
    if (isDefault) {
      await ResumeDocument.updateMany({ student: req.user._id }, { isDefault: false });
      resume.isDefault = true;
    }
    resume.version += 1;
    await resume.save();
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update resume" });
  }
};

/** DELETE /:id */
export const deleteResume = async (req, res) => {
  try {
    const result = await ResumeDocument.deleteOne({ _id: req.params.id, student: req.user._id });
    if (!result.deletedCount) return res.status(404).json({ message: "Resume not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to delete resume" });
  }
};

/** POST /:id/duplicate */
export const duplicateResume = async (req, res) => {
  try {
    const original = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!original) return res.status(404).json({ message: "Resume not found" });

    const copy = await ResumeDocument.create({
      student: req.user._id,
      title: `${original.title} (Copy)`,
      templateId: original.templateId,
      targetRole: original.targetRole,
      content: original.content,
      sourceType: original.sourceType,
      parentResumeId: original._id,
      isDefault: false,
    });
    res.status(201).json({ success: true, resume: copy });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to duplicate resume" });
  }
};

/** POST /upload — parse uploaded resume */
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const text = await extractTextFromFile(req.file.path, req.file.originalname, req.file.mimetype);
    if (!text?.trim()) {
      return res.status(400).json({
        message: "We couldn't read any text from that file. Please upload a text-based PDF or DOCX.",
      });
    }

    const { content, needsReview } = parseResumeText(text);
    const templateId = req.body.templateId || DEFAULT_TEMPLATE_ID;
    const template = getTemplateById(templateId);
    content.sectionOrder = template.defaultSectionOrder;

    const resumeUrl = `${backendUrl}/uploads/resumes/${req.file.filename}`;
    const resume = await ResumeDocument.create({
      student: req.user._id,
      title: req.body.title || "Imported Resume",
      templateId,
      content,
      sourceType: "upload",
      uploadedFileUrl: resumeUrl,
      targetRole: req.body.targetRole || "",
    });

    res.status(201).json({
      success: true,
      resume,
      needsReview,
      message: needsReview.length
        ? "Some fields need your review before they are final."
        : "Resume imported successfully.",
    });
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to parse resume" });
  }
};

/** POST /:id/analyze — ATS analysis */
export const analyzeResume = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const { jobDescription, jobId } = req.body;
    let jd = jobDescription || "";
    let job = {};

    if (jobId) {
      job = await Job.findById(jobId).lean() || {};
      jd = jd || job.description || "";
    }

    const analysis = analyzeATS(resume.content, {
      jobDescription: jd,
      targetRole: resume.targetRole,
    });

    const previousScore = resume.atsScore;
    resume.atsScore = analysis.atsScore;
    resume.atsBreakdown = analysis.breakdown;
    resume.atsStrengths = analysis.strengths;
    resume.atsImprovements = analysis.improvements;
    resume.atsWarnings = analysis.warnings;
    resume.healthCheck = analysis.healthCheck;
    resume.lastAnalyzedAt = new Date();

    if (jd) {
      const student = await UserModel.findById(req.user._id).lean();
      const jobMatch = matchJob(resume.content, student, job, jd);
      resume.jobAnalysis = {
        jobId: jobId || null,
        jobTitle: job.title || req.body.jobTitle || "",
        company: job.company || req.body.company || "",
        jobDescription: jd,
        estimatedMatch: jobMatch.estimatedMatch,
        breakdown: jobMatch.breakdown,
        matchedKeywords: jobMatch.matchedKeywords,
        missingKeywords: jobMatch.missingKeywords,
        missingSkills: jobMatch.missingSkills,
        suggestions: jobMatch.suggestions,
        analyzedAt: new Date(),
      };
    }

    await resume.save();

    setImmediate(() => {
      NotificationService.notify({
        userId: req.user._id,
        event: EVENTS.RESUME_ANALYZED,
        data: {
          resumeId: resume._id,
          atsScore: analysis.atsScore,
          sendEmail: req.body.sendEmail === true,
          role: "student",
        },
      }).catch((e) => console.error("[analyzeResume] notification error:", e.message));
    });

    res.json({
      success: true,
      analysis: {
        ...analysis,
        scoreDelta: previousScore ? analysis.atsScore - previousScore : 0,
        jobMatch: resume.jobAnalysis,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Analysis failed" });
  }
};

/** POST /:id/improve — AI section improvement */
export const improveResumeSection = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const { sectionType, sectionContent, action } = req.body;
    const suggestion = await improveSection({
      sectionType,
      sectionContent,
      action: action || "improve",
      targetRole: resume.targetRole,
      jobDescription: resume.jobAnalysis?.jobDescription,
      fullResumeContext: resume.content,
    });

    res.json({ success: true, suggestion });
  } catch (err) {
    res.status(500).json({ message: err.message || "AI improvement failed" });
  }
};

/** POST /:id/tailor — job-specific tailoring suggestions */
export const tailorResume = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const { jobDescription, jobTitle, company, jobId } = req.body;
    let jd = jobDescription || "";
    if (jobId) {
      const job = await Job.findById(jobId).lean();
      jd = jd || job?.description || "";
    }
    if (!jd?.trim()) return res.status(400).json({ message: "Job description is required" });

    const result = await tailorForJob({
      content: resume.content,
      jobDescription: jd,
      jobTitle,
      company,
    });

    res.json({ success: true, tailoring: result });
  } catch (err) {
    res.status(500).json({ message: err.message || "Tailoring failed" });
  }
};

/** POST /:id/apply-changes — apply accepted AI changes */
export const applyChanges = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const { changes } = req.body;
    if (!Array.isArray(changes)) return res.status(400).json({ message: "changes array required" });

    const content = { ...resume.content };
    changes.forEach((change) => {
      if (change.section === "summary" && change.suggested) {
        content.summary = change.suggested;
      }
      // Additional section apply logic can be extended per field path
    });

    resume.content = content;
    resume.version += 1;
    await resume.save();
    res.json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to apply changes" });
  }
};

/** POST /ai-generate — generate from user facts */
export const aiGenerate = async (req, res) => {
  try {
    const { facts, targetRole, jobDescription, templateId } = req.body;
    const result = await generateFromFacts({ facts, targetRole, jobDescription });
    if (!result.success) return res.status(503).json({ message: result.message });

    const template = getTemplateById(templateId || DEFAULT_TEMPLATE_ID);
    const content = { ...emptyResumeContent(), ...result.content };
    content.sectionOrder = template.defaultSectionOrder;

    const resume = await ResumeDocument.create({
      student: req.user._id,
      title: `${targetRole || "AI"} Resume`,
      templateId: template.templateId,
      targetRole: targetRole || "",
      content,
      sourceType: "ai",
    });

    res.status(201).json({ success: true, resume, warnings: result.content?.warnings || [] });
  } catch (err) {
    res.status(500).json({ message: err.message || "AI generation failed" });
  }
};

/** GET /jobs/match — find matching jobs */
export const getJobMatches = async (req, res) => {
  try {
    const resumeId = req.query.resumeId;
    const resume = resumeId
      ? await ResumeDocument.findOne({ _id: resumeId, student: req.user._id })
      : await ResumeDocument.findOne({ student: req.user._id }).sort({ updatedAt: -1 });

    const student = await UserModel.findById(req.user._id).lean();
    const matches = await findMatchingJobs(resume?.content || emptyResumeContent(), student);
    res.json({ success: true, matches, disclaimer: "Matches based on available job listings and your profile." });
  } catch (err) {
    res.status(500).json({ message: err.message || "Job matching failed" });
  }
};

/** GET /companies — company recommendations */
export const getCompanyMatches = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ student: req.user._id }).sort({ updatedAt: -1 });
    const student = await UserModel.findById(req.user._id).lean();
    const targetRole = req.query.targetRole || resume?.targetRole || student?.targetRole;
    const companies = recommendCompanies(resume?.content || emptyResumeContent(), student, targetRole);
    res.json({ success: true, companies });
  } catch (err) {
    res.status(500).json({ message: err.message || "Company recommendations failed" });
  }
};

/** GET /skill-gaps */
export const getSkillGaps = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ student: req.user._id }).sort({ updatedAt: -1 });
    const student = await UserModel.findById(req.user._id).lean();
    const targetRole = req.query.targetRole || resume?.targetRole || student?.targetRole;
    const gaps = analyzeSkillGaps(resume?.content || emptyResumeContent(), student, targetRole);
    res.json({ success: true, gaps });
  } catch (err) {
    res.status(500).json({ message: err.message || "Skill gap analysis failed" });
  }
};

/** GET /:id/export/html */
export const exportHtml = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    const template = getTemplateById(resume.templateId);
    const html = toExportHtml(resume.content, template);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: err.message || "Export failed" });
  }
};

/** GET /:id/export/text */
export const exportText = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    const text = toPlainText(resume.content);
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${resume.title || "resume"}.txt"`);
    res.send(text);
  } catch (err) {
    res.status(500).json({ message: err.message || "Export failed" });
  }
};

/** GET /:id/interview-context — data for Virtual AI Interview */
export const getInterviewContext = async (req, res) => {
  try {
    const resume = await ResumeDocument.findOne({ _id: req.params.id, student: req.user._id });
    if (!resume) return res.status(404).json({ message: "Resume not found" });

    const student = await UserModel.findById(req.user._id).lean();
    const gaps = analyzeSkillGaps(resume.content, student, resume.targetRole);
    const jd = resume.jobAnalysis?.jobDescription || "";

    res.json({
      success: true,
      context: {
        resumeId: resume._id,
        targetRole: resume.targetRole,
        jobDescription: jd,
        jobTitle: resume.jobAnalysis?.jobTitle,
        company: resume.jobAnalysis?.company,
        requiredSkills: resume.jobAnalysis?.missingSkills || [],
        matchedSkills: gaps.currentSkills,
        skillGaps: gaps.skillsToStrengthen,
        resumeSummary: resume.content?.summary || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to build interview context" });
  }
};

import Assessment from "../models/AssessmentModel.js";
import AssessmentCandidate from "../models/AssessmentCandidateModel.js";
import AssessmentSettings from "../models/AssessmentSettingsModel.js";
import AssessmentAttempt from "../models/AssessmentAttemptModel.js";
import AssessmentIntegrityEvent from "../models/AssessmentIntegrityEventModel.js";
import { Question, AssessmentTemplate } from "../models/QuestionBankModel.js";
import Job from "../models/JobModel.js";
import Application from "../models/ApplicationModel.js";
import User from "../models/UserModel.js";
import NotificationService from "../services/notificationService.js";
import { parseQuestionFile, buildImportTemplateCsv, QUESTION_IMPORT_COLUMNS, questionToCsvRow } from "../services/questionImportService.js";

const MANAGER_ROLES = ["admin", "recruiter", "institution"];
const canManage = (user) => MANAGER_ROLES.includes(user.role);
export const assertManager = (user) => { if (!canManage(user)) { const e = new Error("Access denied. Admin or recruiter only."); e.status = 403; throw e; } };

export const getSettings = async (req, res, next) => {
  try {
    assertManager(req.user);
    let settings = await AssessmentSettings.findOne({ key: "global" });
    if (!settings) settings = await AssessmentSettings.create({ key: "global" });
    res.json({ settings });
  } catch (e) { next(e); }
};

export const updateSettings = async (req, res, next) => {
  try {
    assertManager(req.user);
    let settings = await AssessmentSettings.findOne({ key: "global" });
    if (!settings) settings = new AssessmentSettings({ key: "global" });
    Object.assign(settings, req.body);
    await settings.save();
    res.json({ settings });
  } catch (e) { next(e); }
};

export const computeAssessmentStats = async (assessmentId) => {
  const candidates = await AssessmentCandidate.find({ assessment: assessmentId }).lean();
  const attempts = await AssessmentAttempt.find({ assessment: assessmentId, status: { $in: ["submitted", "evaluated"] } }).lean();
  const invited = candidates.length;
  const attempted = attempts.length;
  const avg = attempted ? attempts.reduce((s, a) => s + (a.percentage || 0), 0) / attempted : 0;
  const passed = attempts.filter((a) => a.passed).length;
  const passRate = attempted ? Math.round((passed / attempted) * 100) : 0;
  const shortlisted = candidates.filter((c) => c.status === "shortlisted" || c.status === "interview").length;
  await Assessment.findByIdAndUpdate(assessmentId, {
    stats: { candidatesInvited: invited, candidatesAttempted: attempted, averageScore: Math.round(avg * 10) / 10, passRate, shortlisted },
  });
};

export const getDashboard = async (req, res, next) => {
  try {
    assertManager(req.user);
    const base = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    const overall = { total: 0, active: 0, upcoming: 0, completed: 0, candidatesInvited: 0, candidatesAttempted: 0, averageScore: 0, passRate: 0, shortlisted: 0 };
    const assessments = await Assessment.find({ ...base, isActive: true }).lean();
    overall.total = assessments.length;
    for (const a of assessments) {
      if (a.status === "published" || a.status === "draft") overall.active += 1;
      if (a.startDate && new Date(a.startDate) > new Date()) overall.upcoming += 1;
      if (a.status === "closed") overall.completed += 1;
      overall.candidatesInvited += a.stats?.candidatesInvited || 0;
      overall.candidatesAttempted += a.stats?.candidatesAttempted || 0;
      overall.shortlisted += a.stats?.shortlisted || 0;
      overall.averageScore += a.stats?.averageScore || 0;
      overall.passRate += a.stats?.passRate || 0;
    }
    if (overall.total) { overall.averageScore = Math.round((overall.averageScore / overall.total) * 10) / 10; overall.passRate = Math.round(overall.passRate / overall.total); }
    overall.completed = assessments.filter((a) => a.endDate && new Date(a.endDate) < new Date()).length;
    const recent = await Assessment.find({ ...base, isActive: true })
      .populate("job", "title")
      .populate("recruiter", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 }).limit(8).lean();
    for (const a of recent) a.candidateCount = (await AssessmentCandidate.countDocuments({ assessment: a._id }));
    res.json({ stats: overall, recent });
  } catch (e) { next(e); }
};

export const listAssessments = async (req, res, next) => {
  try {
    assertManager(req.user);
    const base = req.user.role === "admin" ? {} : { createdBy: req.user._id };
    const filter = { ...base, isActive: true };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.job) filter.job = req.query.job;
    const assessments = await Assessment.find(filter)
      .populate("job", "title")
      .populate("recruiter", "name")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();
    for (const a of assessments) a.candidateCount = await AssessmentCandidate.countDocuments({ assessment: a._id });
    res.json({ assessments });
  } catch (e) { next(e); }
};

export const createAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const data = { ...req.body, createdBy: req.user._id };
    if (req.user.role === "recruiter") data.recruiter = req.user._id;
    else if (req.user.role === "admin" && req.body.recruiter) data.recruiter = req.body.recruiter;
    if (data.job) {
      const job = await Job.findById(data.job);
      if (!job) return res.status(400).json({ message: "Job not found" });
      if (req.user.role === "recruiter" && job.recruiter.toString() !== req.user._id.toString()) return res.status(403).json({ message: "You can only create assessments for your own jobs" });
    }
    if (Array.isArray(data.questionIds)) { data.questions = data.questionIds; delete data.questionIds; }
    if (data.template) {
      const tpl = await AssessmentTemplate.findById(data.template);
      if (tpl && tpl.questions.length && !data.questions?.length) data.questions = tpl.questions;
    }
    const assessment = await Assessment.create(data);
    res.status(201).json({ assessment });
  } catch (e) { next(e); }
};

export const getAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const a = await Assessment.findById(req.params.id)
      .populate("job", "title description")
      .populate("questions", "text type category skill difficulty marks negativeMarks options explanation")
      .populate("template", "title").lean();
    if (!a) return res.status(404).json({ message: "Assessment not found" });
    if (a.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    a.candidateCount = await AssessmentCandidate.countDocuments({ assessment: a._id });
    res.json({ assessment: a });
  } catch (e) { next(e); }
};

export const updateAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const a = await Assessment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: "Assessment not found" });
    if (a.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    const data = { ...req.body };
    if (Array.isArray(data.questionIds)) { data.questions = data.questionIds; delete data.questionIds; }
    Object.assign(a, data);
    await a.save();
    await computeAssessmentStats(a._id);
    res.json({ assessment: a });
  } catch (e) { next(e); }
};

export const deleteAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const a = await Assessment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: "Assessment not found" });
    if (a.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    a.isActive = false; a.status = "archived";
    await a.save();
    res.json({ message: "Assessment archived" });
  } catch (e) { next(e); }
};

export const publishAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const a = await Assessment.findById(req.params.id);
    if (!a) return res.status(404).json({ message: "Assessment not found" });
    if (a.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    if (a.questions.length === 0 && req.body.questionIds?.length) a.questions = req.body.questionIds;
    if (a.questions.length === 0) return res.status(400).json({ message: "Add at least one question before publishing" });
    a.status = "published";
    await a.save();
    res.json({ assessment: a });
  } catch (e) { next(e); }
};

export const duplicateAssessment = async (req, res, next) => {
  try {
    assertManager(req.user);
    const a = await Assessment.findById(req.params.id).lean();
    if (!a) return res.status(404).json({ message: "Assessment not found" });
    const { _id, createdAt, updatedAt, stats, status, ...rest } = a;
    const copy = await Assessment.create({ ...rest, name: a.name + " (Copy)", status: "draft", createdBy: req.user._id, recruiter: req.user.role === "recruiter" ? req.user._id : a.recruiter });
    res.status(201).json({ assessment: copy });
  } catch (e) { next(e); }
};

export const getCandidates = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    const candidates = await AssessmentCandidate.find({ assessment: assessment._id })
      .populate("candidate", "name email skills")
      .populate("job", "title")
      .populate("application", "status")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ candidates });
  } catch (e) { next(e); }
};

export const inviteCandidates = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    if (assessment.status !== "published") return res.status(400).json({ message: "Assessment must be published before inviting candidates" });

    const { candidateIds = [], jobId, applicationIds = [] } = req.body;
    let targetCandidateIds = [...candidateIds];

    if (applicationIds.length) {
      const apps = await Application.find({ _id: { $in: applicationIds } }).select("student");
      targetCandidateIds.push(...apps.map((a) => a.student.toString()));
    } else if (jobId) {
      const apps = await Application.find({ job: jobId }).select("student");
      targetCandidateIds.push(...apps.map((a) => a.student.toString()));
    }

    targetCandidateIds = [...new Set(targetCandidateIds)];

    const results = [];
    for (const cid of targetCandidateIds) {
      const candidate = await User.findById(cid);
      if (!candidate || candidate.role !== "student") continue;
      const existing = await AssessmentCandidate.findOne({ assessment: assessment._id, candidate: cid });
      if (existing) {
        if (existing.status === "not_invited" || existing.status === "invited") {
          existing.status = "invited";
          existing.invitedAt = new Date();
          existing.invitedBy = req.user._id;
          await existing.save();
          results.push({ candidateId: cid, status: "invited" });
        } else {
          results.push({ candidateId: cid, status: existing.status });
        }
        continue;
      }
      const app = applicationIds.length ? await Application.findOne({ student: cid, job: jobId }) : null;
      await AssessmentCandidate.create({
        assessment: assessment._id,
        candidate: cid,
        job: jobId || null,
        application: app?._id || null,
        status: "invited",
        invitedAt: new Date(),
        invitedBy: req.user._id,
      });
      results.push({ candidateId: cid, status: "invited" });

      await NotificationService.createNotification({
        recipient: cid,
        sender: req.user._id,
        type: "system_announcement",
        title: "Assessment Invitation",
        message: `You have been invited to complete the assessment "${assessment.name}". Please check your assessments.`,
        data: { assessmentId: assessment._id },
        priority: "high",
      });
    }

    await computeAssessmentStats(assessment._id);
    res.json({ invited: results.filter((r) => r.status === "invited").length, results });
  } catch (e) { next(e); }
};

export const assignToCandidates = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { candidateIds = [], jobId, applicationIds = [], status = "invited" } = req.body;
    let targetCandidateIds = [...candidateIds];

    if (applicationIds.length) {
      const apps = await Application.find({ _id: { $in: applicationIds } }).select("student");
      targetCandidateIds.push(...apps.map((a) => a.student.toString()));
    } else if (jobId) {
      const apps = await Application.find({ job: jobId }).select("student");
      targetCandidateIds.push(...apps.map((a) => a.student.toString()));
    }

    targetCandidateIds = [...new Set(targetCandidateIds)];

    const results = [];
    for (const cid of targetCandidateIds) {
      const candidate = await User.findById(cid);
      if (!candidate || candidate.role !== "student") continue;
      const existing = await AssessmentCandidate.findOne({ assessment: assessment._id, candidate: cid });
      if (existing) {
        existing.status = status;
        await existing.save();
        results.push({ candidateId: cid, status });
      } else {
        const app = applicationIds.length ? await Application.findOne({ student: cid, job: jobId }) : null;
        await AssessmentCandidate.create({
          assessment: assessment._id,
          candidate: cid,
          job: jobId || null,
          application: app?._id || null,
          status,
          invitedAt: new Date(),
          invitedBy: req.user._id,
        });
        results.push({ candidateId: cid, status });
      }
    }

    await computeAssessmentStats(assessment._id);
    res.json({ assigned: results.length, results });
  } catch (e) { next(e); }
};

export const getResults = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const candidates = await AssessmentCandidate.find({ assessment: assessment._id })
      .populate("candidate", "name email skills")
      .sort({ createdAt: -1 })
      .lean();

    const results = [];
    for (const c of candidates) {
      const attempt = await AssessmentAttempt.findOne({ assessment: assessment._id, student: c.candidate._id || c.candidate })
        .sort({ createdAt: -1 })
        .lean();
      results.push({
        candidateId: c.candidate._id || c.candidate,
        candidateName: c.candidate.name || "Unknown",
        candidateEmail: c.candidate.email || "",
        status: c.status,
        attemptsCount: c.attemptsCount,
        lastAttempt: c.lastAttempt,
        attempt: attempt ? {
          _id: attempt._id,
          percentage: attempt.percentage,
          passed: attempt.passed,
          submittedAt: attempt.submittedAt,
          timeTakenSeconds: attempt.timeTakenSeconds,
          rank: attempt.rank,
          integrity: attempt.integrity,
          autoSubmitted: attempt.autoSubmitted,
        } : null,
      });
    }

    res.json({ assessment: { name: assessment.name, passingScore: assessment.passingScore }, results });
  } catch (e) { next(e); }
};

export const shortlistCandidates = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    const { candidateIds = [], status = "shortlisted", note = "" } = req.body;
    for (const cid of candidateIds) {
      const c = await AssessmentCandidate.findOne({ assessment: assessment._id, candidate: cid });
      if (!c) continue;
      c.status = status;
      if (status === "shortlisted") c.shortlistedAt = new Date();
      if (status === "interview") c.interviewScheduledAt = new Date();
      await c.save();

      await NotificationService.createNotification({
        recipient: cid,
        sender: req.user._id,
        type: status === "shortlisted" ? "system_announcement" : "interview_scheduled",
        title: status === "shortlisted" ? "Shortlisted for Interview" : "Interview Scheduled",
        message: `You have been ${status} for the assessment "${assessment.name}".${note ? ` Note: ${note}` : ""}`,
        data: { assessmentId: assessment._id, candidateId: cid },
        priority: "high",
      });
    }

    await computeAssessmentStats(assessment._id);
    res.json({ updated: candidateIds.length, status });
  } catch (e) { next(e); }
};

export const importQuestions = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });

    if (!req.file) return res.status(400).json({ message: "File is required" });

    const { valid, invalid } = parseQuestionFile(req.file.buffer, req.file.originalname);
    if (invalid.length > 0) {
      return res.status(400).json({ message: "Validation failed", validCount: valid.length, invalidCount: invalid.length, errors: invalid });
    }

    const createdQuestions = [];
    for (const q of valid) {
      const question = await Question.create({ ...q, createdBy: req.user._id });
      createdQuestions.push(question._id);
      assessment.questions.push(question._id);
    }

    await assessment.save();
    res.json({ imported: createdQuestions.length, questions: createdQuestions, message: `${createdQuestions.length} questions imported successfully` });
  } catch (e) { next(e); }
};

export const getAssessmentStats = async (req, res, next) => {
  try {
    assertManager(req.user);
    const assessment = await Assessment.findById(req.params.id).lean();
    if (!assessment) return res.status(404).json({ message: "Assessment not found" });
    if (assessment.createdBy?.toString() !== req.user._id.toString() && req.user.role !== "admin") return res.status(403).json({ message: "Access denied" });
    await computeAssessmentStats(assessment._id);
    const updated = await Assessment.findById(req.params.id).lean();
    res.json({ stats: updated.stats });
  } catch (e) { next(e); }
};

export const downloadTemplate = async (req, res, next) => {
  try {
    assertManager(req.user);
    const csv = buildImportTemplateCsv();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=assessment_questions_template.csv");
    res.send(csv);
  } catch (e) { next(e); }
};

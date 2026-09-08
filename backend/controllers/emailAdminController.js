import EmailService from "../services/email/EmailService.js";
import EmailLog from "../models/EmailLog.js";
import EmailTemplate from "../models/EmailTemplate.js";
import AuditService from "../services/auditService.js";

const SAMPLE_VARS = {
  user_name: "Rahul",
  job_title: "AI/ML Intern",
  company_name: "Example Company",
  application_date: new Date().toLocaleDateString(),
  interview_date: "Tomorrow",
  interview_time: "10:00 AM",
  interview_type: "Online",
  interview_url: "https://meet.example.com/abc",
  application_url: "https://campus2career.zayacodehub.in/student/applications",
  dashboard_url: "https://campus2career.zayacodehub.in/student",
  job_url: "https://campus2career.zayacodehub.in/student/jobs",
  resume_url: "https://campus2career.zayacodehub.in/student/resume-center",
  ats_score: "84",
  count: "5",
  student_name: "Priya Sharma",
  recruiter_name: "John Recruiter",
  reset_url: "https://campus2career.zayacodehub.in/forgot-password?token=sample",
  expiry_minutes: "60",
  rejection_reason: "Incomplete profile information",
  jobs_html: "<ul><li>AI/ML Intern — Example Company</li><li>Data Analyst — Tech Corp</li></ul>",
};

export const getEmailStats = async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const stats = await EmailService.getStats({ since });
    res.json({ success: true, period: "today", since, stats });
  } catch (err) {
    res.status(500).json({ message: "Failed to load email stats", error: err.message });
  }
};

export const listEmailLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.eventType) filter.eventType = req.query.eventType;

    const logs = await EmailLog.find(filter)
      .select("-metadata.html -metadata.text -metadata.variables")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await EmailLog.countDocuments(filter);
    res.json({ success: true, logs, total, totalPages: Math.ceil(total / limit), currentPage: page });
  } catch (err) {
    res.status(500).json({ message: "Failed to load email logs", error: err.message });
  }
};

export const listTemplates = async (req, res) => {
  try {
    const templates = await EmailTemplate.find().sort({ key: 1 });
    res.json({ success: true, templates });
  } catch (err) {
    res.status(500).json({ message: "Failed to load templates", error: err.message });
  }
};

export const getTemplate = async (req, res) => {
  try {
    const template = await EmailTemplate.findOne({ key: req.params.key.toUpperCase() });
    if (!template) return res.status(404).json({ message: "Template not found" });
    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ message: "Failed to load template", error: err.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const { subject, htmlBody, textBody, isActive } = req.body;
    const key = req.params.key.toUpperCase();
    const template = await EmailTemplate.findOneAndUpdate(
      { key },
      { $set: { subject, htmlBody, textBody, isActive } },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: "Template not found" });

    try {
      await AuditService.logSecurityEvent(req.user._id, "email_template_updated", { key }, req, "medium");
    } catch (_) {}

    res.json({ success: true, template });
  } catch (err) {
    res.status(500).json({ message: "Failed to update template", error: err.message });
  }
};

export const previewTemplate = async (req, res) => {
  try {
    const key = req.params.key.toUpperCase();
    const variables = { ...SAMPLE_VARS, ...req.body.variables };
    const rendered = await EmailService.renderTemplate(key, variables);
    res.json({ success: true, preview: rendered, variables });
  } catch (err) {
    res.status(500).json({ message: "Failed to preview template", error: err.message });
  }
};

export const sendTestEmail = async (req, res) => {
  try {
    const { templateKey, recipient, variables } = req.body;
    if (!templateKey || !recipient) {
      return res.status(400).json({ message: "templateKey and recipient are required" });
    }

    const mergedVars = { ...SAMPLE_VARS, ...variables };
    const log = await EmailService.queueEmail({
      userId: req.user._id,
      recipient,
      eventType: "TEST_EMAIL",
      templateKey: templateKey.toUpperCase(),
      variables: mergedVars,
      idempotencyKey: `test_${templateKey}_${recipient}_${Date.now()}`,
      isTest: true,
      metadata: { adminId: req.user._id },
    });

    try {
      await AuditService.logSecurityEvent(req.user._id, "admin_test_email_sent", { templateKey, recipient }, req, "medium");
    } catch (_) {}

    res.json({ success: true, message: "Test email queued", logId: log?._id });
  } catch (err) {
    res.status(500).json({ message: "Failed to send test email", error: err.message });
  }
};

export const getEmailConfig = async (req, res) => {
  res.json({
    success: true,
    configured: EmailService.isConfigured(),
    fromEmail: process.env.RESEND_FROM_EMAIL ? `${process.env.RESEND_FROM_NAME || "Campus2Career"} <${process.env.RESEND_FROM_EMAIL}>` : null,
  });
};

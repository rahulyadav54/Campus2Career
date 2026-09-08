import { TEMPLATE_KEYS } from "../../constants/notificationEvents.js";
import { buildEmailLayout, buildBodyParagraphs, renderTemplateString } from "./templateRenderer.js";

/** Default email template definitions (seeded to DB on startup) */
export const DEFAULT_TEMPLATES = [
  {
    key: TEMPLATE_KEYS.ACCOUNT_APPROVED,
    name: "Account Approved",
    subject: "Your Campus2Career Account Has Been Approved",
    category: "transactional",
    variables: ["user_name", "dashboard_url"],
    description: "Sent when admin approves a user account",
    build: (v) => ({
      subject: renderTemplateString("Your Campus2Career Account Has Been Approved", v),
      html: buildEmailLayout({
        title: "Account Approved",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          "Your Campus2Career account has been approved.",
          "You can now access your dashboard and start exploring career opportunities, building your resume, and preparing for interviews.",
        ]),
        ctaLabel: "Open Campus2Career",
        ctaUrl: v.dashboard_url,
      }),
      text: `Hi ${v.user_name || "there"},\n\nYour Campus2Career account has been approved.\n\nOpen Campus2Career: ${v.dashboard_url}`,
    }),
  },
  {
    key: TEMPLATE_KEYS.ACCOUNT_REJECTED,
    name: "Account Rejected",
    subject: "Update Regarding Your Campus2Career Account",
    category: "transactional",
    variables: ["user_name", "rejection_reason"],
    build: (v) => ({
      subject: "Update Regarding Your Campus2Career Account",
      html: buildEmailLayout({
        title: "Account Update",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          "Thank you for your interest in Campus2Career.",
          "After reviewing your registration, we are unable to approve your account at this time.",
          v.rejection_reason ? `Reason: ${v.rejection_reason}` : "",
          "If you believe this was a mistake, please contact your institution's placement office.",
        ]),
      }),
      text: `Hi ${v.user_name || "there"},\n\nWe are unable to approve your account at this time.${v.rejection_reason ? `\nReason: ${v.rejection_reason}` : ""}`,
    }),
  },
  {
    key: TEMPLATE_KEYS.APPLICATION_SUBMITTED,
    name: "Application Submitted (Student)",
    subject: "Application Submitted — {{job_title}}",
    category: "transactional",
    variables: ["user_name", "job_title", "company_name", "application_date", "application_url"],
    build: (v) => ({
      subject: `Application Submitted — ${v.job_title || "Position"}`,
      html: buildEmailLayout({
        title: "Application Submitted",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your application for <strong>${v.job_title || "the position"}</strong> at <strong>${v.company_name || "the company"}</strong> has been submitted.`,
          `Application date: ${v.application_date || "Today"}`,
          `Status: Applied`,
        ]),
        ctaLabel: "View Application",
        ctaUrl: v.application_url,
      }),
      text: `Application submitted for ${v.job_title} at ${v.company_name}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.APPLICATION_SUBMITTED_EMPLOYER,
    name: "New Application (Employer)",
    subject: "New Application — {{job_title}}",
    category: "transactional",
    variables: ["user_name", "job_title", "student_name", "application_url"],
    build: (v) => ({
      subject: `New Application — ${v.job_title || "Position"}`,
      html: buildEmailLayout({
        title: "New Application",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `You have received a new application for <strong>${v.job_title || "your job posting"}</strong>.`,
          `Applicant: ${v.student_name || "A student"}`,
        ]),
        ctaLabel: "Review Application",
        ctaUrl: v.application_url,
      }),
      text: `New application received for ${v.job_title}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.APPLICATION_SHORTLISTED,
    name: "Application Shortlisted",
    subject: "Congratulations! You've Been Shortlisted",
    category: "transactional",
    variables: ["user_name", "job_title", "company_name", "application_url"],
    build: (v) => ({
      subject: "Congratulations! You've Been Shortlisted",
      html: buildEmailLayout({
        title: "You've Been Shortlisted",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Great news! You have been shortlisted for <strong>${v.job_title || "the position"}</strong> at <strong>${v.company_name || "the company"}</strong>.`,
          "The recruiter may contact you with next steps soon.",
        ]),
        ctaLabel: "View Application",
        ctaUrl: v.application_url,
      }),
      text: `You've been shortlisted for ${v.job_title} at ${v.company_name}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.APPLICATION_REJECTED,
    name: "Application Rejected",
    subject: "Update on Your Application",
    category: "transactional",
    variables: ["user_name", "job_title", "company_name", "application_url"],
    build: (v) => ({
      subject: "Update on Your Application",
      html: buildEmailLayout({
        title: "Application Update",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Thank you for your interest in <strong>${v.job_title || "the position"}</strong> at <strong>${v.company_name || "the company"}</strong>.`,
          "After careful consideration, we will not be moving forward with your application at this time.",
          "We encourage you to keep exploring opportunities on Campus2Career.",
        ]),
        ctaLabel: "Browse Jobs",
        ctaUrl: v.job_url || v.application_url,
      }),
      text: `Update on your application for ${v.job_title}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.APPLICATION_SELECTED,
    name: "Application Selected",
    subject: "Congratulations! You've Been Selected",
    category: "transactional",
    variables: ["user_name", "job_title", "company_name", "application_url"],
    build: (v) => ({
      subject: "Congratulations! You've Been Selected",
      html: buildEmailLayout({
        title: "You've Been Selected!",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Congratulations! You have been selected for <strong>${v.job_title || "the position"}</strong> at <strong>${v.company_name || "the company"}</strong>.`,
          "The recruiter will be in touch with further details.",
        ]),
        ctaLabel: "View Application",
        ctaUrl: v.application_url,
      }),
      text: `Congratulations! You've been selected for ${v.job_title}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.INTERVIEW_SCHEDULED,
    name: "Interview Scheduled",
    subject: "Interview Scheduled — {{job_title}}",
    category: "transactional",
    variables: ["user_name", "job_title", "company_name", "interview_date", "interview_time", "interview_type", "interview_url", "application_url"],
    build: (v) => ({
      subject: `Interview Scheduled — ${v.job_title || "Position"}`,
      html: buildEmailLayout({
        title: "Interview Scheduled",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your interview for <strong>${v.job_title || "the position"}</strong> at <strong>${v.company_name || "the company"}</strong> has been scheduled.`,
          `Date: ${v.interview_date || "TBD"}`,
          `Time: ${v.interview_time || "TBD"}`,
          `Type: ${v.interview_type || "Online"}`,
          v.interview_url ? `Meeting link: <a href="${v.interview_url}">${v.interview_url}</a>` : "",
        ]),
        ctaLabel: "View Details",
        ctaUrl: v.application_url || v.interview_url,
      }),
      text: `Interview scheduled for ${v.job_title} on ${v.interview_date} at ${v.interview_time}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.INTERVIEW_REMINDER_24H,
    name: "Interview Reminder (24h)",
    subject: "Reminder: Your Interview Is Tomorrow",
    category: "transactional",
    variables: ["user_name", "job_title", "interview_date", "interview_time", "interview_url"],
    build: (v) => ({
      subject: "Reminder: Your Interview Is Tomorrow",
      html: buildEmailLayout({
        title: "Interview Tomorrow",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `This is a reminder that your interview for <strong>${v.job_title || "your position"}</strong> is tomorrow.`,
          `Date: ${v.interview_date}`,
          `Time: ${v.interview_time}`,
        ]),
        ctaLabel: "View Interview Details",
        ctaUrl: v.interview_url || v.application_url,
      }),
      text: `Reminder: Interview tomorrow for ${v.job_title} at ${v.interview_time}.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.INTERVIEW_REMINDER_1H,
    name: "Interview Reminder (1h)",
    subject: "Your Interview Starts in 1 Hour",
    category: "transactional",
    variables: ["user_name", "job_title", "interview_time", "interview_url"],
    build: (v) => ({
      subject: "Your Interview Starts in 1 Hour",
      html: buildEmailLayout({
        title: "Interview in 1 Hour",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your interview for <strong>${v.job_title || "your position"}</strong> starts in 1 hour (${v.interview_time || ""}).`,
          "Please ensure you are prepared and have a stable internet connection if it's online.",
        ]),
        ctaLabel: "Join / View Details",
        ctaUrl: v.interview_url || v.application_url,
      }),
      text: `Your interview for ${v.job_title} starts in 1 hour.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.INTERVIEW_COMPLETED,
    name: "Interview Completed",
    subject: "Your Interview Feedback Is Ready",
    category: "transactional",
    variables: ["user_name", "job_title", "interview_url"],
    build: (v) => ({
      subject: "Your Interview Feedback Is Ready",
      html: buildEmailLayout({
        title: "Feedback Available",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your virtual interview feedback for <strong>${v.job_title || "your session"}</strong> is now available.`,
          "Review your performance insights and recommendations to improve.",
        ]),
        ctaLabel: "View Feedback",
        ctaUrl: v.interview_url,
      }),
      text: `Your interview feedback is ready. View: ${v.interview_url}`,
    }),
  },
  {
    key: TEMPLATE_KEYS.JOB_APPROVED,
    name: "Job Approved",
    subject: "Your Job Posting Has Been Approved",
    category: "transactional",
    variables: ["user_name", "job_title", "job_url"],
    build: (v) => ({
      subject: "Your Job Posting Has Been Approved",
      html: buildEmailLayout({
        title: "Job Approved",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your job posting <strong>${v.job_title || ""}</strong> has been approved and is now live.`,
        ]),
        ctaLabel: "View Job",
        ctaUrl: v.job_url,
      }),
      text: `Your job posting "${v.job_title}" has been approved.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.JOB_REJECTED,
    name: "Job Rejected",
    subject: "Update on Your Job Posting",
    category: "transactional",
    variables: ["user_name", "job_title", "rejection_reason"],
    build: (v) => ({
      subject: "Update on Your Job Posting",
      html: buildEmailLayout({
        title: "Job Posting Update",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `Your job posting <strong>${v.job_title || ""}</strong> was not approved.`,
          v.rejection_reason ? `Comments: ${v.rejection_reason}` : "",
        ]),
      }),
      text: `Your job posting "${v.job_title}" was not approved.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.PASSWORD_RESET,
    name: "Password Reset",
    subject: "Reset Your Campus2Career Password",
    category: "transactional",
    variables: ["user_name", "reset_url", "expiry_minutes"],
    build: (v) => ({
      subject: "Reset Your Campus2Career Password",
      html: buildEmailLayout({
        title: "Password Reset",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          "We received a request to reset your password.",
          `This link expires in ${v.expiry_minutes || "60"} minutes.`,
          "If you did not request this, you can safely ignore this email.",
        ]),
        ctaLabel: "Reset Password",
        ctaUrl: v.reset_url,
      }),
      text: `Reset your password: ${v.reset_url}`,
    }),
  },
  {
    key: TEMPLATE_KEYS.PASSWORD_CHANGED,
    name: "Password Changed",
    subject: "Your Password Was Changed",
    category: "transactional",
    variables: ["user_name"],
    build: (v) => ({
      subject: "Your Password Was Changed",
      html: buildEmailLayout({
        title: "Password Changed",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          "Your Campus2Career password was changed successfully.",
          "If you did not make this change, contact support immediately.",
        ]),
      }),
      text: "Your Campus2Career password was changed.",
    }),
  },
  {
    key: TEMPLATE_KEYS.RESUME_ANALYSIS_READY,
    name: "Resume Analysis Ready",
    subject: "Your Resume Analysis Is Ready",
    category: "optional",
    variables: ["user_name", "ats_score", "resume_url"],
    build: (v) => ({
      subject: "Your Resume Analysis Is Ready",
      html: buildEmailLayout({
        title: "Resume Analysis",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          "Your resume analysis is complete.",
          v.ats_score ? `Estimated ATS Compatibility: <strong>${v.ats_score}/100</strong>` : "",
        ]),
        ctaLabel: "View Analysis",
        ctaUrl: v.resume_url,
      }),
      text: `Your resume analysis is ready. ATS score: ${v.ats_score || "N/A"}`,
    }),
  },
  {
    key: TEMPLATE_KEYS.JOB_DIGEST,
    name: "Job Recommendations Digest",
    subject: "{{count}} New Jobs Match Your Profile",
    category: "optional",
    variables: ["user_name", "count", "jobs_html", "job_url"],
    build: (v) => ({
      subject: `${v.count || "New"} New Jobs Match Your Profile`,
      html: buildEmailLayout({
        title: "Job Recommendations",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "there"},`,
          `We found <strong>${v.count || "several"}</strong> new jobs that match your profile:`,
          v.jobs_html || "",
        ]),
        ctaLabel: "View All Recommendations",
        ctaUrl: v.job_url,
      }),
      text: `${v.count} new jobs match your profile.`,
    }),
  },
  {
    key: TEMPLATE_KEYS.RECRUITER_REGISTERED,
    name: "Recruiter Registration (Admin)",
    subject: "New Recruiter Registration Pending Approval",
    category: "transactional",
    variables: ["user_name", "recruiter_name", "company_name", "dashboard_url"],
    build: (v) => ({
      subject: "New Recruiter Registration Pending Approval",
      html: buildEmailLayout({
        title: "New Recruiter",
        bodyHtml: buildBodyParagraphs([
          `Hi ${v.user_name || "Admin"},`,
          `<strong>${v.recruiter_name || "A recruiter"}</strong> from <strong>${v.company_name || "a company"}</strong> has registered and is awaiting approval.`,
        ]),
        ctaLabel: "Review Pending Users",
        ctaUrl: v.dashboard_url,
      }),
      text: `New recruiter ${v.recruiter_name} from ${v.company_name} awaiting approval.`,
    }),
  },
];

export function getDefaultTemplate(key) {
  return DEFAULT_TEMPLATES.find((t) => t.key === key);
}

export function renderDefaultTemplate(key, variables) {
  const def = getDefaultTemplate(key);
  if (!def) return null;
  return def.build(variables);
}

export default DEFAULT_TEMPLATES;

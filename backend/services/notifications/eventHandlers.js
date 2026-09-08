import { EVENTS, TEMPLATE_KEYS as TK } from "../../constants/notificationEvents.js";
import {
  dashboardUrl,
  applicationUrl,
  interviewUrl,
  resumeAnalysisUrl,
  jobUrl,
  buildFrontendUrl,
} from "../../utils/frontendUrl.js";

/** Build in-app + email payload for each event */
export function resolveEventPayload(event, data = {}) {
  const role = data.role || "student";
  const vars = {
    user_name: data.userName || data.name || "",
    job_title: data.jobTitle || "",
    company_name: data.companyName || data.company || "",
    application_status: data.status || "",
    application_date: data.applicationDate || new Date().toLocaleDateString(),
    interview_date: data.interviewDate || "",
    interview_time: data.interviewTime || "",
    interview_type: data.interviewType || data.interviewMode || "Online",
    interview_url: data.interviewUrl || data.interviewMeetingLink || "",
    job_url: data.jobId ? jobUrl(data.jobId, role) : buildFrontendUrl("/jobs", role),
    application_url: data.applicationId ? applicationUrl(data.applicationId, role) : buildFrontendUrl("/applications", role),
    dashboard_url: dashboardUrl(role),
    resume_url: data.resumeId ? resumeAnalysisUrl(data.resumeId, role) : buildFrontendUrl("/resume-center", role),
    reset_url: data.resetUrl || "",
    expiry_minutes: data.expiryMinutes || "60",
    rejection_reason: data.comments || data.reason || "",
    ats_score: data.atsScore || "",
    count: data.count || "",
    student_name: data.studentName || "",
    recruiter_name: data.recruiterName || "",
    jobs_html: data.jobsHtml || "",
  };

  const handlers = {
    [EVENTS.USER_APPROVED]: () => ({
      inApp: { type: "account_approved", title: "Account Approved", message: "Your Campus2Career account has been approved. You can now access your dashboard.", actionUrl: vars.dashboard_url, priority: "high", category: "account" },
      email: { templateKey: TK.ACCOUNT_APPROVED, idempotencyKey: `user_approved_${data.userId}` },
    }),
    [EVENTS.USER_REJECTED]: () => ({
      inApp: { type: "account_rejected", title: "Account Update", message: "There is an update regarding your Campus2Career account registration.", actionUrl: vars.dashboard_url, priority: "high", category: "account" },
      email: { templateKey: TK.ACCOUNT_REJECTED, idempotencyKey: `user_rejected_${data.userId}` },
    }),
    [EVENTS.APPLICATION_SUBMITTED]: () => ({
      inApp: { type: "application_status_update", title: "Application Submitted", message: `Your application for ${vars.job_title} has been submitted.`, actionUrl: vars.application_url, priority: "medium", category: "application" },
      email: { templateKey: TK.APPLICATION_SUBMITTED, idempotencyKey: `app_submitted_student_${data.applicationId}` },
    }),
    [EVENTS.APPLICATION_RECEIVED_EMPLOYER]: () => ({
      inApp: { type: "application_received", title: "New Application", message: `New application received for ${vars.job_title}.`, actionUrl: buildFrontendUrl(`/jobs/${data.jobId}/applications`, "recruiter"), priority: "medium", category: "application" },
      email: { templateKey: TK.APPLICATION_SUBMITTED_EMPLOYER, idempotencyKey: `app_submitted_employer_${data.applicationId}` },
    }),
    [EVENTS.APPLICATION_SHORTLISTED]: () => ({
      inApp: { type: "application_status_update", title: "Shortlisted!", message: `Congratulations! You've been shortlisted for ${vars.job_title}.`, actionUrl: vars.application_url, priority: "high", category: "application" },
      email: { templateKey: TK.APPLICATION_SHORTLISTED, idempotencyKey: `app_shortlisted_${data.applicationId}` },
    }),
    [EVENTS.APPLICATION_REJECTED]: () => ({
      inApp: { type: "application_status_update", title: "Application Update", message: `Update on your application for ${vars.job_title}.`, actionUrl: vars.application_url, priority: "medium", category: "application" },
      email: { templateKey: TK.APPLICATION_REJECTED, idempotencyKey: `app_rejected_${data.applicationId}` },
    }),
    [EVENTS.APPLICATION_SELECTED]: () => ({
      inApp: { type: "application_status_update", title: "Selected!", message: `Congratulations! You've been selected for ${vars.job_title}.`, actionUrl: vars.application_url, priority: "high", category: "application" },
      email: { templateKey: TK.APPLICATION_SELECTED, idempotencyKey: `app_selected_${data.applicationId}` },
    }),
    [EVENTS.INTERVIEW_SCHEDULED]: () => ({
      inApp: { type: "interview_scheduled", title: "Interview Scheduled", message: `Your interview for ${vars.job_title} has been scheduled for ${vars.interview_date} at ${vars.interview_time}.`, actionUrl: vars.application_url, priority: "high", category: "interview" },
      email: { templateKey: TK.INTERVIEW_SCHEDULED, idempotencyKey: `interview_scheduled_${data.applicationId}` },
    }),
    [EVENTS.INTERVIEW_REMINDER_24H]: () => ({
      inApp: { type: "interview_scheduled", title: "Interview Tomorrow", message: `Reminder: Your interview for ${vars.job_title} is tomorrow at ${vars.interview_time}.`, actionUrl: vars.application_url, priority: "high", category: "interview" },
      email: { templateKey: TK.INTERVIEW_REMINDER_24H, idempotencyKey: `interview_reminder_24h_${data.applicationId}` },
    }),
    [EVENTS.INTERVIEW_REMINDER_1H]: () => ({
      inApp: { type: "interview_scheduled", title: "Interview in 1 Hour", message: `Your interview for ${vars.job_title} starts in 1 hour.`, actionUrl: vars.application_url, priority: "high", category: "interview" },
      email: { templateKey: TK.INTERVIEW_REMINDER_1H, idempotencyKey: `interview_reminder_1h_${data.applicationId}` },
    }),
    [EVENTS.INTERVIEW_COMPLETED]: () => ({
      inApp: { type: "interview_completed", title: "Feedback Ready", message: `Your interview feedback for ${data.targetRole || vars.job_title} is now available.`, actionUrl: interviewUrl(data.sessionId, role), priority: "medium", category: "interview" },
      email: { templateKey: TK.INTERVIEW_COMPLETED, idempotencyKey: `interview_completed_${data.sessionId}`, optional: true },
    }),
    [EVENTS.JOB_APPROVED]: () => ({
      inApp: { type: "job_approved", title: "Job Approved", message: `Your job posting "${vars.job_title}" has been approved.`, actionUrl: buildFrontendUrl("/jobs", "recruiter"), priority: "medium", category: "account" },
      email: { templateKey: TK.JOB_APPROVED, idempotencyKey: `job_approved_${data.jobId}` },
    }),
    [EVENTS.JOB_REJECTED]: () => ({
      inApp: { type: "job_rejected", title: "Job Rejected", message: `Your job posting "${vars.job_title}" was not approved.`, actionUrl: buildFrontendUrl("/jobs", "recruiter"), priority: "high", category: "account" },
      email: { templateKey: TK.JOB_REJECTED, idempotencyKey: `job_rejected_${data.jobId}` },
    }),
    [EVENTS.JOB_CREATED]: () => ({
      inApp: { type: "job_submitted", title: "New Job Submitted", message: `A new job posting "${vars.job_title}" awaits approval.`, actionUrl: buildFrontendUrl("/job-verification", "admin"), priority: "high", category: "account" },
      email: null,
    }),
    [EVENTS.PASSWORD_RESET]: () => ({
      inApp: null,
      email: { templateKey: TK.PASSWORD_RESET, idempotencyKey: `password_reset_${data.userId}_${data.tokenHash || Date.now()}` },
    }),
    [EVENTS.PASSWORD_CHANGED]: () => ({
      inApp: { type: "security_alert", title: "Password Changed", message: "Your password was changed successfully.", actionUrl: buildFrontendUrl("/profile", role), priority: "high", category: "account" },
      email: { templateKey: TK.PASSWORD_CHANGED, idempotencyKey: `password_changed_${data.userId}_${Date.now()}` },
    }),
    [EVENTS.RESUME_ANALYZED]: () => ({
      inApp: { type: "resume_analyzed", title: "Resume Analysis Ready", message: `Your resume analysis is ready.${vars.ats_score ? ` ATS Compatibility: ${vars.ats_score}/100` : ""}`, actionUrl: vars.resume_url, priority: "medium", category: "resume" },
      email: data.sendEmail ? { templateKey: TK.RESUME_ANALYSIS_READY, idempotencyKey: `resume_analyzed_${data.resumeId}`, optional: true } : null,
    }),
    [EVENTS.JOB_DIGEST]: () => ({
      inApp: { type: "job_recommendations", title: "New Job Matches", message: `${vars.count} new jobs match your profile.`, actionUrl: buildFrontendUrl("/recommendations", role), priority: "low", category: "jobRecommendations" },
      email: { templateKey: TK.JOB_DIGEST, idempotencyKey: `job_digest_${data.userId}_${data.digestDate}`, optional: true },
    }),
    [EVENTS.RECRUITER_REGISTERED]: () => ({
      inApp: { type: "recruiter_registered", title: "New Recruiter Registration", message: `${vars.recruiter_name} from ${vars.company_name} is awaiting approval.`, actionUrl: buildFrontendUrl("/user-approvals", "admin"), priority: "medium", category: "account" },
      email: { templateKey: TK.RECRUITER_REGISTERED, idempotencyKey: `recruiter_registered_${data.recruiterId}` },
    }),
    [EVENTS.COURSE_ENROLLED]: () => ({
      inApp: { type: "course_enrolled", title: "Course Enrolled", message: `You enrolled in ${data.courseTitle || "a course"}. Start learning when you're ready.`, actionUrl: buildFrontendUrl(`/courses/${data.courseId}`, "student"), priority: "low", category: "learning" },
      email: null,
    }),
    [EVENTS.COURSE_PROGRESS_MILESTONE]: () => ({
      inApp: { type: "course_progress", title: "Learning Progress", message: `Your course "${data.courseTitle}" reached ${data.progress}% completion.`, actionUrl: buildFrontendUrl(`/courses/${data.courseId}`, "student"), priority: "low", category: "learning" },
      email: null,
    }),
    [EVENTS.COURSE_COMPLETED]: () => ({
      inApp: { type: "course_completed", title: "Course Completed!", message: `Congratulations! You completed ${data.courseTitle || "your course"}.`, actionUrl: buildFrontendUrl("/my-courses", "student"), priority: "medium", category: "learning" },
      email: null,
    }),
    [EVENTS.COURSE_CERTIFICATE_READY]: () => ({
      inApp: { type: "certificate_ready", title: "Certificate Ready", message: `Your certificate for ${data.courseTitle} is ready to view.`, actionUrl: buildFrontendUrl(`/certificates/verify/${data.certificateId}`, "student"), priority: "medium", category: "learning" },
      email: null,
    }),
    [EVENTS.COURSE_RECOMMENDATIONS_READY]: () => ({
      inApp: { type: "course_recommendations", title: "New Course Recommendations", message: "Personalized courses based on your career goals are ready.", actionUrl: buildFrontendUrl("/my-courses?tab=recommended", "student"), priority: "low", category: "learning" },
      email: null,
    }),
  };

  const handler = handlers[event];
  if (!handler) {
    return { inApp: null, email: null, variables: vars };
  }
  const resolved = handler();
  return { ...resolved, variables: vars };
}

export default resolveEventPayload;

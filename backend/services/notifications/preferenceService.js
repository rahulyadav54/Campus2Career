import NotificationPreference from "../../models/NotificationPreference.js";
import { EVENTS } from "../../constants/notificationEvents.js";

/** Map events to preference channels */
const EVENT_CHANNEL_MAP = {
  [EVENTS.USER_REGISTERED]: { email: "account", inApp: "account" },
  [EVENTS.USER_APPROVED]: { email: "account", inApp: "account" },
  [EVENTS.USER_REJECTED]: { email: "account", inApp: "account" },
  [EVENTS.USER_SUSPENDED]: { email: "account", inApp: "account" },
  [EVENTS.USER_REACTIVATED]: { email: "account", inApp: "account" },
  [EVENTS.PASSWORD_RESET]: { email: "security", inApp: null },
  [EVENTS.PASSWORD_CHANGED]: { email: "security", inApp: "account" },
  [EVENTS.EMAIL_CHANGED]: { email: "security", inApp: "account" },
  [EVENTS.SECURITY_ALERT]: { email: "security", inApp: "account" },
  [EVENTS.JOB_CREATED]: { email: "account", inApp: "account" },
  [EVENTS.JOB_APPROVED]: { email: "account", inApp: "account" },
  [EVENTS.JOB_REJECTED]: { email: "account", inApp: "account" },
  [EVENTS.APPLICATION_SUBMITTED]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_RECEIVED_EMPLOYER]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_REVIEWED]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_SHORTLISTED]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_REJECTED]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_SELECTED]: { email: "application", inApp: "application" },
  [EVENTS.APPLICATION_WITHDRAWN]: { email: "application", inApp: "application" },
  [EVENTS.INTERVIEW_SCHEDULED]: { email: "interview", inApp: "interview" },
  [EVENTS.INTERVIEW_RESCHEDULED]: { email: "interview", inApp: "interview" },
  [EVENTS.INTERVIEW_CANCELLED]: { email: "interview", inApp: "interview" },
  [EVENTS.INTERVIEW_REMINDER_24H]: { email: "interview", inApp: "interview" },
  [EVENTS.INTERVIEW_REMINDER_1H]: { email: "interview", inApp: "interview" },
  [EVENTS.INTERVIEW_COMPLETED]: { email: "interview", inApp: "interview" },
  [EVENTS.RESUME_ANALYZED]: { email: "resume", inApp: "resume" },
  [EVENTS.RESUME_TAILORED]: { email: "resume", inApp: "resume" },
  [EVENTS.RESUME_EXPORT_COMPLETED]: { email: "resume", inApp: "resume" },
  [EVENTS.JOB_RECOMMENDATIONS_READY]: { email: "jobRecommendations", inApp: "jobRecommendations" },
  [EVENTS.JOB_DIGEST]: { email: "jobDigest", inApp: "jobRecommendations" },
  [EVENTS.RECRUITER_REGISTERED]: { email: "account", inApp: "account" },
};

/** Events that always send email regardless of optional prefs */
const MANDATORY_EMAIL_EVENTS = new Set([
  EVENTS.PASSWORD_RESET,
  EVENTS.PASSWORD_CHANGED,
  EVENTS.EMAIL_CHANGED,
  EVENTS.SECURITY_ALERT,
  EVENTS.USER_APPROVED,
  EVENTS.USER_REJECTED,
  EVENTS.APPLICATION_SUBMITTED,
  EVENTS.APPLICATION_SHORTLISTED,
  EVENTS.APPLICATION_REJECTED,
  EVENTS.APPLICATION_SELECTED,
  EVENTS.INTERVIEW_SCHEDULED,
  EVENTS.INTERVIEW_RESCHEDULED,
  EVENTS.INTERVIEW_CANCELLED,
  EVENTS.INTERVIEW_REMINDER_24H,
  EVENTS.INTERVIEW_REMINDER_1H,
  EVENTS.JOB_APPROVED,
  EVENTS.JOB_REJECTED,
]);

class PreferenceService {
  static async getOrCreate(userId) {
    let prefs = await NotificationPreference.findOne({ userId });
    if (!prefs) {
      prefs = await NotificationPreference.create({ userId });
    }
    return prefs;
  }

  static async shouldSendEmail(userId, event) {
    if (MANDATORY_EMAIL_EVENTS.has(event)) return true;
    const prefs = await this.getOrCreate(userId);
    const channel = EVENT_CHANNEL_MAP[event]?.email;
    if (!channel) return true;
    return prefs.email[channel] !== false;
  }

  static async shouldSendInApp(userId, event) {
    const prefs = await this.getOrCreate(userId);
    const channel = EVENT_CHANNEL_MAP[event]?.inApp;
    if (!channel) return true;
    return prefs.inApp[channel] !== false;
  }

  static async update(userId, updates) {
    return NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: updates },
      { upsert: true, new: true }
    );
  }
}

export default PreferenceService;

import Notification from "../models/NotificationModel.js";
import User from "../models/UserModel.js";
import EmailLog from "../models/EmailLog.js";
import { publishToUser } from "./realtimeService.js";
import EmailService from "./email/EmailService.js";
import PreferenceService from "./notifications/preferenceService.js";
import resolveEventPayload from "./notifications/eventHandlers.js";
import { EVENTS } from "../constants/notificationEvents.js";

class NotificationService {
  /**
   * Central notification entry point.
   * All feature modules should call this — never Resend directly.
   */
  static async notify({ userId, event, data = {}, email: emailOverride = null, inApp: inAppOverride = null }) {
    try {
      if (!userId || !event) return { success: false, reason: "missing_params" };

      const user = await User.findById(userId).select("email name role");
      if (!user) return { success: false, reason: "user_not_found" };

      const role = data.role || user.role || "student";
      const payload = resolveEventPayload(event, { ...data, userName: user.name, name: user.name, role });
      const variables = {
        ...(payload.variables || {}),
        user_name: payload.variables?.user_name || user.name || "there",
      };

      const results = { inApp: null, email: null };

      // In-app notification
      const inAppConfig = inAppOverride !== null ? inAppOverride : payload.inApp;
      if (inAppConfig) {
        const sendInApp = await PreferenceService.shouldSendInApp(userId, event);
        if (sendInApp) {
          results.inApp = await this.createNotification({
            recipient: userId,
            sender: data.senderId || null,
            type: inAppConfig.type,
            title: inAppConfig.title,
            message: inAppConfig.message,
            category: inAppConfig.category || "general",
            actionUrl: inAppConfig.actionUrl || "",
            data: { event, ...data },
            priority: inAppConfig.priority || "medium",
          });
        }
      }

      // Email notification
      const emailConfig = emailOverride !== null ? emailOverride : payload.email;
      if (emailConfig) {
        const sendEmail = await PreferenceService.shouldSendEmail(userId, event);

        if (sendEmail && user.email) {
          results.email = await EmailService.queueEmail({
              userId,
              recipient: user.email,
              eventType: event,
              templateKey: emailConfig.templateKey,
              variables,
              idempotencyKey: emailConfig.idempotencyKey,
              metadata: { userId, event },
            });
        }
      }

      return { success: true, ...results };
    } catch (error) {
      console.error(`[NotificationService] notify(${event}) failed:`, error.message);
      return { success: false, reason: error.message };
    }
  }

  /** Notify multiple users for the same event */
  static async notifyMany({ userIds, event, data = {} }) {
    const results = [];
    for (const userId of userIds) {
      results.push(await this.notify({ userId, event, data }));
    }
    return results;
  }

  // Create a notification
  static async createNotification({
    recipient,
    sender = null,
    type,
    title,
    message,
    category = "general",
    actionUrl = "",
    data = {},
    priority = "medium",
    expiresAt = null
  }) {
    try {
      const notification = await Notification.create({
        recipient,
        sender,
        type,
        title,
        message,
        category,
        actionUrl,
        data,
        priority,
        expiresAt
      });

      publishToUser(recipient, "notification", notification);
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  }

  // Notify placement cell about new job submission
  static async notifyJobSubmission(jobId, recruiterId, jobTitle) {
    try {
      const admins = await User.find({ role: "admin", isActive: true });

      for (const admin of admins) {
        await this.notify({
          userId: admin._id,
          event: EVENTS.JOB_CREATED,
          data: { jobId, recruiterId, jobTitle, senderId: recruiterId },
        });
      }
      console.log(`Job submission notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error("Error notifying job submission:", error);
    }
  }

  // Notify recruiter about job approval/rejection
  static async notifyJobStatus(jobId, recruiterId, status, jobTitle, comments = "") {
    try {
      const event = status === "approved" ? EVENTS.JOB_APPROVED : EVENTS.JOB_REJECTED;
      await this.notify({
        userId: recruiterId,
        event,
        data: { jobId, status, jobTitle, comments, role: "recruiter" },
      });
      console.log(`Job ${status} notification sent to recruiter`);
    } catch (error) {
      console.error("Error notifying job status:", error);
    }
  }

  // Notify about new application
  static async notifyNewApplication(applicationId, studentId, recruiterId, jobTitle, jobId, companyName, studentName) {
    try {
      await this.notify({
        userId: studentId,
        event: EVENTS.APPLICATION_SUBMITTED,
        data: { applicationId, jobId, jobTitle, companyName, role: "student" },
      });

      await this.notify({
        userId: recruiterId,
        event: EVENTS.APPLICATION_RECEIVED_EMPLOYER,
        data: { applicationId, jobId, jobTitle, studentName, studentId, role: "recruiter" },
      });

      console.log("Application submitted notifications sent");
    } catch (error) {
      console.error("Error notifying new application:", error);
    }
  }

  // Notify student about application status update
  static async notifyApplicationStatus(applicationId, studentId, status, jobTitle, note = "", extra = {}) {
    try {
      const statusEventMap = {
        "interview scheduled": EVENTS.INTERVIEW_SCHEDULED,
        "hired": EVENTS.APPLICATION_SELECTED,
        "rejected by recruiter": EVENTS.APPLICATION_REJECTED,
        "rejected by mentor": EVENTS.APPLICATION_REJECTED,
        "pending recruiter review": EVENTS.APPLICATION_SHORTLISTED,
      };

      const event = statusEventMap[status] || EVENTS.APPLICATION_REVIEWED;

      await this.notify({
        userId: studentId,
        event,
        data: {
          applicationId,
          status,
          jobTitle,
          comments: note,
          role: "student",
          interviewDate: extra.interviewDate,
          interviewTime: extra.interviewTime,
          interviewMode: extra.interviewMode,
          interviewMeetingLink: extra.interviewMeetingLink,
          companyName: extra.companyName,
        },
      });

      console.log("Application status notification sent to student");
    } catch (error) {
      console.error("Error notifying application status:", error);
    }
  }

  // Get notifications for a user
  static async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const filter = { recipient: userId };
      if (unreadOnly) filter.isRead = false;

      const notifications = await Notification.find(filter)
        .populate('sender', 'name email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });

      return {
        notifications,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
        unreadCount
      };
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw error;
    }
  }

  // Notify placement cell about new recruiter registration
  static async notifyRecruiterRegistration(recruiterId, companyName, recruiterName) {
    try {
      const admins = await User.find({ role: "admin", isActive: true });
      if (admins.length === 0) return;

      for (const admin of admins) {
        await this.notify({
          userId: admin._id,
          event: EVENTS.RECRUITER_REGISTERED,
          data: { recruiterId, companyName, recruiterName, role: "admin" },
        });
      }
      console.log(`Recruiter registration notifications sent to ${admins.length} admins`);
    } catch (error) {
      console.error("Error notifying recruiter registration:", error);
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId, userId) {
    try {
      await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /** User email history (no internal API details) */
  static async getUserEmailHistory(userId, { page = 1, limit = 20 } = {}) {
    const logs = await EmailLog.find({ userId })
      .select("eventType templateKey subject status sentAt createdAt")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);
    const total = await EmailLog.countDocuments({ userId });
    return { emails: logs, total, totalPages: Math.ceil(total / limit), currentPage: page };
  }
}

export default NotificationService;

import Application from "../models/ApplicationModel.js";
import NotificationService from "../services/notificationService.js";
import { EVENTS } from "../constants/notificationEvents.js";

/** Check for upcoming interviews and send reminders */
export async function processInterviewReminders() {
  try {
    const now = new Date();
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    const in26h = new Date(now.getTime() + 26 * 60 * 60 * 1000);
    const in55m = new Date(now.getTime() + 55 * 60 * 1000);
    const in65m = new Date(now.getTime() + 65 * 60 * 1000);

    // 24h reminders
    const apps24h = await Application.find({
      status: "interview scheduled",
      interviewDate: { $gte: in25h, $lte: in26h },
      reminder24hSent: { $ne: true },
    }).populate("job student");

    for (const app of apps24h) {
      if (!app.student) continue;
      await NotificationService.notify({
        userId: app.student._id,
        event: EVENTS.INTERVIEW_REMINDER_24H,
        data: {
          applicationId: app._id,
          jobTitle: app.job?.title,
          interviewDate: app.interviewDate?.toLocaleDateString(),
          interviewTime: app.interviewTime,
          interviewMeetingLink: app.interviewMeetingLink,
          role: "student",
        },
      });
      app.reminder24hSent = true;
      await app.save();
    }

    // 1h reminders — combine interviewDate + interviewTime
    const apps1h = await Application.find({
      status: "interview scheduled",
      reminder1hSent: { $ne: true },
    }).populate("job student");

    for (const app of apps1h) {
      if (!app.interviewDate || !app.interviewTime || !app.student) continue;
      const [hours, minutes] = app.interviewTime.split(":").map(Number);
      const interviewAt = new Date(app.interviewDate);
      interviewAt.setHours(hours || 0, minutes || 0, 0, 0);

      if (interviewAt >= in55m && interviewAt <= in65m) {
        await NotificationService.notify({
          userId: app.student._id,
          event: EVENTS.INTERVIEW_REMINDER_1H,
          data: {
            applicationId: app._id,
            jobTitle: app.job?.title,
            interviewTime: app.interviewTime,
            interviewMeetingLink: app.interviewMeetingLink,
            role: "student",
          },
        });
        app.reminder1hSent = true;
        await app.save();
      }
    }
  } catch (err) {
    console.error("[InterviewReminders] Error:", err.message);
  }
}

export function startInterviewReminderJob(intervalMs = 15 * 60 * 1000) {
  setInterval(() => {
    processInterviewReminders().catch((e) => console.error("[InterviewReminders]", e.message));
  }, intervalMs);
  console.log("[InterviewReminders] Background job started");
}

export default { processInterviewReminders, startInterviewReminderJob };

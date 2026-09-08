import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: {
    type: String,
    enum: [
      "job_submitted",
      "job_approved",
      "job_rejected",
      "application_received",
      "interview_scheduled",
      "interview_completed",
      "application_status_update",
      "recruiter_registered",
      "system_announcement",
      "account_approved",
      "account_rejected",
      "security_alert",
      "resume_analyzed",
      "job_recommendations",
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  category: { type: String, default: "general" },
  actionUrl: { type: String, default: "" },
  data: { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date, default: null },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  expiresAt: { type: Date }
}, { timestamps: true });

// Index for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notification", notificationSchema);
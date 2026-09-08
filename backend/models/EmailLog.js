import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    recipient: { type: String, required: true, lowercase: true, trim: true },
    eventType: { type: String, required: true, index: true },
    templateKey: { type: String, required: true },
    subject: { type: String, required: true },
    status: {
      type: String,
      enum: ["PENDING", "SENDING", "SENT", "FAILED", "RETRYING", "DELIVERED", "BOUNCED", "COMPLAINED"],
      default: "PENDING",
      index: true,
    },
    providerMessageId: { type: String, default: null },
    idempotencyKey: { type: String, sparse: true, unique: true },
    attemptCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    errorMessage: { type: String, default: null },
    nextRetryAt: { type: Date, default: null, index: true },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    isTest: { type: Boolean, default: false },
  },
  { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ status: 1, nextRetryAt: 1 });

export default mongoose.model("EmailLog", emailLogSchema);

import mongoose from "mongoose";

const aiAutomationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    agent: {
      type: String,
      enum: [
        "orchestrator",
        "career_agent",
        "skill_gap_agent",
        "opportunity_agent",
        "resume_agent",
        "interview_agent",
        "recruiter_agent",
        "mentor_agent",
        "institution_insights_agent",
        "readiness_agent",
      ],
      required: true,
      index: true,
    },
    action: { type: String, required: true, index: true },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true },
    status: {
      type: String,
      enum: ["success", "failed", "partial", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    sourceData: { type: mongoose.Schema.Types.Mixed },
    errorMessage: { type: String, default: "" },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

aiAutomationLogSchema.index({ user: 1, agent: 1, timestamp: -1 });
aiAutomationLogSchema.index({ agent: 1, action: 1, timestamp: -1 });

export default mongoose.model("AIAutomationLog", aiAutomationLogSchema);

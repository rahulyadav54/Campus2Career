import mongoose from "mongoose";

const riskFactorSchema = new mongoose.Schema(
  {
    factor: {
      type: String,
      enum: [
        "large_skill_gap",
        "declining_assessments",
        "low_interview_score",
        "no_recent_activity",
        "low_application_activity",
        "falling_behind_roadmap",
        "low_readiness",
        "cgpa_low",
      ],
      required: true,
    },
    severity: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    detail: { type: String, default: "" },
    evidence: { type: mongoose.Schema.Types.Mixed },
    scoreContribution: { type: Number, default: 0 },
  },
  { _id: false }
);

const interventionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mentor_meeting", "learning_module", "mock_interview", "assessment", "project", "skill_practice", "career_plan_update"],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["high", "medium", "low"], default: "high" },
    assignedTo: { type: String, enum: ["student", "mentor", "ai"], default: "student" },
    recommendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dueDate: { type: Date },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    status: {
      type: String,
      enum: ["recommended", "approved", "rejected", "completed", "expired"],
      default: "recommended",
    },
  },
  { _id: false }
);

const riskAlertSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    detectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    riskLevel: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    factors: [riskFactorSchema],
    currentReadinessScore: { type: Number, default: 0 },
    interventions: [interventionSchema],
    aiRecommendation: { type: String, default: "" },
    acknowledged: { type: Boolean, default: false },
    acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    acknowledgedAt: { type: Date },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: ["active", "acknowledged", "intervened", "resolved"],
      default: "active",
    },
    alertType: { type: String, enum: ["automated", "manual"], default: "automated" },
  },
  { timestamps: true }
);

riskAlertSchema.index({ student: 1, status: 1, createdAt: -1 });
riskAlertSchema.index({ riskLevel: 1, status: 1 });

export default mongoose.model("RiskAlert", riskAlertSchema);

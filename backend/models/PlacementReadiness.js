import mongoose from "mongoose";

const readinessComponentSchema = new mongoose.Schema(
  {
    technicalSkills: { type: Number, default: 0 },
    softSkills: { type: Number, default: 0 },
    assessmentScores: { type: Number, default: 0 },
    aptitude: { type: Number, default: 0 },
    projects: { type: Number, default: 0 },
    resumeQuality: { type: Number, default: 0 },
    mockInterview: { type: Number, default: 0 },
    applicationActivity: { type: Number, default: 0 },
    internshipExperience: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    industrySkillCoverage: { type: Number, default: 0 },
  },
  { _id: false }
);

const improvementActionSchema = new mongoose.Schema(
  {
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    category: {
      type: String,
      enum: ["skill", "assessment", "resume", "interview", "application", "course", "project"],
      default: "skill",
    },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    relatedEntityId: { type: mongoose.Schema.Types.Mixed },
    relatedEntityType: { type: String, default: "" },
    reason: { type: String, default: "" },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  },
  { _id: false }
);

const placementReadinessSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    components: readinessComponentSchema,
    level: {
      type: String,
      enum: ["Foundation", "Developing", "High Potential", "Industry Ready"],
      default: "Foundation",
    },
    improvementPlan: [improvementActionSchema],
    lastCalculatedAt: { type: Date, default: Date.now },
    calculatedBy: { type: String, default: "ai_orchestrator" },
    sourceTrigger: {
      type: String,
      enum: ["on_demand", "daily_batch", "profile_update", "assessment_complete", "interview_complete", "course_complete", "job_match"],
      default: "on_demand",
    },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

placementReadinessSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("PlacementReadiness", placementReadinessSchema);

import mongoose from "mongoose";

const careerMissionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetRole: { type: String, required: true, trim: true },
    targetIndustry: { type: String, default: "" },
    targetCompany: { type: String, default: "" },
    currentReadiness: { type: Number, min: 0, max: 100, default: 0 },
    skillCoverage: { type: Number, min: 0, max: 100, default: 0 },
    skillGaps: [{ type: String }],
    prioritySkills: [{ type: String }],
    strongSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    recommendedCourses: [
      {
        title: { type: String, default: "" },
        provider: { type: String, default: "" },
        url: { type: String, default: "" },
        skill: { type: String, default: "" },
        source: { type: String, default: "" },
        reason: { type: String, default: "" },
      },
    ],
    recommendedProjects: [
      {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
        skills: [{ type: String }],
        reason: { type: String, default: "" },
      },
    ],
    recommendedOpportunities: [
      {
        opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity" },
        job: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
        matchScore: { type: Number },
        reason: { type: String, default: "" },
      },
    ],
    interviewPlan: [
      {
        skill: { type: String, default: "" },
        description: { type: String, default: "" },
        priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
      },
    ],
    roadmap: [
      {
        week: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: "" },
        actions: [{ type: String }],
        skills: [{ type: String }],
        targetCompletion: { type: Date },
        completed: { type: Boolean, default: false },
      },
    ],
    aiGeneratedResume: { type: String, default: "" },
    aiGeneratedCoverLetter: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "paused", "completed", "archived"],
      default: "active",
    },
    isActive: { type: Boolean, default: true },
    lastAnalyzedAt: { type: Date, default: Date.now },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

careerMissionSchema.index({ student: 1, status: 1 });

export default mongoose.model("CareerMission", careerMissionSchema);

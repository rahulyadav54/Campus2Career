import mongoose from "mongoose";

const resumeMissingKeywordSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true },
    inJobDescription: { type: Boolean, default: true },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const resumeWeakDescriptionSchema = new mongoose.Schema(
  {
    section: { type: String, default: "" },
    description: { type: String, default: "" },
    suggestion: { type: String, default: "" },
  },
  { _id: false }
);

const resumeAnalysisSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    resumeUrl: { type: String, default: "" },
    targetJob: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    targetJobTitle: { type: String, default: "" },
    targetJobDescription: { type: String, default: "" },
    extractedSkills: [{ type: String }],
    extractedEducation: [{ type: mongoose.Schema.Types.Mixed }],
    extractedProjects: [{ type: mongoose.Schema.Types.Mixed }],
    extractedExperience: [{ type: mongoose.Schema.Types.Mixed }],
    extractedCertifications: [{ type: mongoose.Schema.Types.Mixed }],
    atsScore: { type: Number, min: 0, max: 100, default: 0 },
    breakdown: {
      skillsMatch: { type: Number, default: 0 },
      keywordDensity: { type: Number, default: 0 },
      formatting: { type: Number, default: 0 },
      experienceRelevance: { type: Number, default: 0 },
      quantifiableAchievements: { type: Number, default: 0 },
    },
    missingKeywords: [resumeMissingKeywordSchema],
    weakDescriptions: [resumeWeakDescriptionSchema],
    irrelevantContent: [{ type: String }],
    strengths: [{ type: String }],
    optimizedResume: { type: String, default: "" },
    optimizedCoverLetter: { type: String, default: "" },
    interviewPrepQuestions: [{ type: String }],
    status: {
      type: String,
      enum: ["pending", "analyzed", "optimized", "failed"],
      default: "pending",
    },
    aiModel: { type: String, default: "nvidia/nemotron" },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("ResumeAnalysis", resumeAnalysisSchema);

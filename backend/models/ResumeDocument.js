import mongoose from "mongoose";

const atsBreakdownSchema = new mongoose.Schema(
  {
    parsingStructure: { type: Number, default: 0 },
    formatting: { type: Number, default: 0 },
    keywordMatch: { type: Number, default: 0 },
    skillsMatch: { type: Number, default: 0 },
    experienceRelevance: { type: Number, default: 0 },
    sectionCompleteness: { type: Number, default: 0 },
  },
  { _id: false }
);

const keywordItemSchema = new mongoose.Schema(
  {
    keyword: { type: String, required: true },
    matched: { type: Boolean, default: false },
    source: { type: String, default: "" },
  },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, default: "" },
    why: { type: String, default: "" },
    what: { type: String, default: "" },
    how: { type: String, default: "" },
    example: { type: String, default: "" },
    truthCheck: { type: String, default: "Add this only if applicable to your experience." },
    section: { type: String, default: "" },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  },
  { _id: false }
);

const jobAnalysisSchema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    jobTitle: { type: String, default: "" },
    company: { type: String, default: "" },
    jobDescription: { type: String, default: "" },
    estimatedMatch: { type: Number, default: 0 },
    breakdown: {
      skillsMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      projectMatch: { type: Number, default: 0 },
      keywordMatch: { type: Number, default: 0 },
    },
    matchedKeywords: [keywordItemSchema],
    missingKeywords: [keywordItemSchema],
    missingSkills: [{ type: String }],
    suggestions: [suggestionSchema],
    analyzedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const resumeDocumentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "My Resume" },
    templateId: { type: String, default: "campus2career_ats" },
    targetRole: { type: String, default: "" },
    targetCompany: { type: String, default: "" },
    targetJobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    editMode: { type: String, enum: ["template", "custom"], default: "template" },
    content: { type: mongoose.Schema.Types.Mixed, default: {} },
    sourceType: { type: String, enum: ["manual", "upload", "ai", "profile"], default: "manual" },
    uploadedFileUrl: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
    atsScore: { type: Number, min: 0, max: 100, default: null },
    atsBreakdown: { type: atsBreakdownSchema, default: () => ({}) },
    atsStrengths: [{ type: String }],
    atsImprovements: [{ type: String }],
    atsWarnings: [{ type: String }],
    healthCheck: { type: mongoose.Schema.Types.Mixed, default: {} },
    jobAnalysis: { type: jobAnalysisSchema, default: null },
    version: { type: Number, default: 1 },
    parentResumeId: { type: mongoose.Schema.Types.ObjectId, ref: "ResumeDocument", default: null },
    tailoredForJob: { type: Boolean, default: false },
    lastAnalyzedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

resumeDocumentSchema.index({ student: 1, updatedAt: -1 });
resumeDocumentSchema.index({ student: 1, isDefault: 1 });

export default mongoose.model("ResumeDocument", resumeDocumentSchema);

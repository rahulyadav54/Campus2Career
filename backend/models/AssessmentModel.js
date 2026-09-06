import mongoose from "mongoose";

/**
 * Assessment — a recruitment assessment created by an admin or recruiter.
 * Combines a question set from the Question Bank with scheduling / marking
 * configuration and connects to a Job for the recruiter hiring workflow.
 */
const assessmentConfigSchema = new mongoose.Schema(
  {
    randomizeQuestions: { type: Boolean, default: true },
    randomizeOptions: { type: Boolean, default: true },
    allowFreeNavigation: { type: Boolean, default: true },
    allowBackNavigation: { type: Boolean, default: true },
    autoSubmitOnTimeUp: { type: Boolean, default: true },
    negativeMarking: { type: Boolean, default: false },
    marksPerQuestion: { type: Number, default: null }, // null => use per-question marks
    sectionWiseScoring: { type: Boolean, default: true },
    resultVisibility: { type: String, enum: ["score_only", "score_and_answer_key", "pass_fail_only"], default: "score_only" },
    // Assessment integrity / anti-cheating configuration
    violationThreshold: { type: Number, default: 3 }, // number of violations before auto-submit
    violationAction: { type: String, enum: ["warn", "auto_submit"], default: "auto_submit" },
    warnOnTabSwitch: { type: Boolean, default: true },
    logBlurEvents: { type: Boolean, default: true },
    preventCopyPaste: { type: Boolean, default: true },
    requireFullscreen: { type: Boolean, default: true },
    blockMobile: { type: Boolean, default: false },
    desktopModeRequired: { type: Boolean, default: true },
    // Ranking
    enableRanking: { type: Boolean, default: true },
    rankTieBreaker: { type: String, enum: ["time_taken", "none"], default: "time_taken" },
    // Shortlisting
    autoShortlistAboveThreshold: { type: Boolean, default: false },
    shortlistThreshold: { type: Number, default: 70 }, // percentage
  },
  { _id: false }
);

const assessmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    instructions: { type: String, default: "" },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentTemplate", default: null },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
    durationMinutes: { type: Number, required: true, default: 30, min: 1 },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    passingScore: { type: Number, default: 60 }, // percentage
    passPercentage: { type: Number, default: 60 },
    maxAttempts: { type: Number, default: 1, min: 1 },
    status: { type: String, enum: ["draft", "published", "closed", "archived"], default: "draft" },
    config: { type: assessmentConfigSchema, default: () => ({}) },
    // Derived stats kept for dashboard performance (updated after evaluation)
    stats: {
      candidatesInvited: { type: Number, default: 0 },
      candidatesAttempted: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      passRate: { type: Number, default: 0 },
      shortlisted: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

assessmentSchema.index({ createdBy: 1, status: 1 });
assessmentSchema.index({ job: 1 });

const Assessment = mongoose.model("Assessment", assessmentSchema);
export default Assessment;
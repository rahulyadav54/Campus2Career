import mongoose from "mongoose";

/**
 * AssessmentCandidate — tracks a candidate (student) assigned to an Assessment.
 * Reuses the existing Job/Application models; this simply links a student to an
 * assessment with an invitation and lifecycle status.
 */
const assessmentCandidateSchema = new mongoose.Schema(
  {
    assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", default: null },
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: null },
    status: {
      type: String,
      enum: [
        "not_invited",
        "invited",
        "started",
        "in_progress",
        "submitted",
        "evaluated",
        "passed",
        "failed",
        "shortlisted",
        "interview",
        "rejected",
      ],
      default: "not_invited",
    },
    invitedAt: { type: Date },
    startedAt: { type: Date },
    submittedAt: { type: Date },
    attemptsCount: { type: Number, default: 0 },
    lastAttempt: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentAttempt", default: null },
    shortlistedAt: { type: Date },
    interviewScheduledAt: { type: Date },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

assessmentCandidateSchema.index({ assessment: 1, candidate: 1 }, { unique: true });

const AssessmentCandidate = mongoose.model("AssessmentCandidate", assessmentCandidateSchema);
export default AssessmentCandidate;
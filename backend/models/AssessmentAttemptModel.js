import mongoose from "mongoose";

/**
 * AssessmentAttempt — a candidate's attempt on an assessment.
 * Extended (backward-compatible) for the recruitment assessment engine:
 * links to Assessment + AssessmentCandidate, snapshots the presented questions,
 * supports all question answer types, stores integrity event ids, section scores,
 * rank, auto-submit flag and violation counters.
 */
const answerSchema = new mongoose.Schema(
  {
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    selectedOption: { type: Number },
    selectedOptions: { type: [Number], default: [] }, // mcq_multi
    answerText: { type: String, default: "" }, // short_answer / descriptive
    ratingValue: { type: Number },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 },
    negativeMarks: { type: Number, default: 0 },
    timeSpentSeconds: { type: Number, default: 0 },
    savedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  assessment: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment", index: true },
  assessmentCandidate: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentCandidate" },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentTemplate" },
  // Snapshot of the questions as presented (randomized order) — never includes answers
  questionOrder: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  answers: [answerSchema],
  scores: {
    type: new mongoose.Schema(
      {
        technical: { type: Number, default: 0 },
        soft: { type: Number, default: 0 },
        aptitude: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      { _id: false }
    ),
    default: { technical: 0, soft: 0, aptitude: 0, total: 0 },
  },
  maxScores: {
    type: new mongoose.Schema(
      {
        technical: { type: Number, default: 0 },
        soft: { type: Number, default: 0 },
        aptitude: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
      },
      { _id: false }
    ),
    default: { technical: 0, soft: 0, aptitude: 0, total: 0 },
  },
  sectionScores: { type: Map, of: Number, default: {} }, // skill -> earned
  sectionMaxScores: { type: Map, of: Number, default: {} }, // skill -> max
  skillScores: { type: Map, of: new mongoose.Schema({ earned: Number, max: Number }, { _id: false }), default: {} },
  strengths: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  deadlineAt: { type: Date }, // server-controlled deadline
  timeTakenSeconds: { type: Number },
  autoSubmitted: { type: Boolean, default: false },
  passed: { type: Boolean, default: false },
  percentage: { type: Number, default: 0 },
  rank: { type: Number },
  // Integrity monitoring counts (browser-level observations)
  integrityEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: "AssessmentIntegrityEvent" }],
  integrity: {
    tabSwitchCount: { type: Number, default: 0 },
    windowBlurCount: { type: Number, default: 0 },
    fullscreenExitCount: { type: Number, default: 0 },
    shortcutCount: { type: Number, default: 0 },
    lastViolationAt: { type: Date },
    violationCount: { type: Number, default: 0 },
    flagged: { type: Boolean, default: false },
  },
  submittedAnswersCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["in_progress", "submitted", "evaluated"],
    default: "in_progress",
  },
}, { timestamps: true });

attemptSchema.index({ assessment: 1, student: 1 });

export default mongoose.model("AssessmentAttempt", attemptSchema);

import mongoose from "mongoose";

/**
 * AssessmentSettings — global defaults for the recruitment assessment engine.
 * Stored per-installation (single document).
 */
const assessmentSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "global", unique: true },
    defaultDurationMinutes: { type: Number, default: 30 },
    defaultPassingScore: { type: Number, default: 60 },
    defaultMaxAttempts: { type: Number, default: 1 },
    violationThreshold: { type: Number, default: 3 },
    violationAction: { type: String, enum: ["warn", "auto_submit"], default: "auto_submit" },
    negativeMarking: { type: Boolean, default: false },
    negativeMarkingValue: { type: Number, default: 25 }, // percentage of marks deducted
    randomizationEnabled: { type: Boolean, default: true },
    resultVisibility: { type: String, enum: ["score_only", "score_and_answer_key", "pass_fail_only"], default: "score_only" },
    enableRanking: { type: Boolean, default: true },
    autoShortlistThreshold: { type: Number, default: 70 },
    allowedQuestionTypes: {
      type: [String],
      default: ["mcq", "mcq_multi", "true_false", "short_answer", "descriptive"],
    },
  },
  { timestamps: true }
);

const AssessmentSettings = mongoose.model("AssessmentSettings", assessmentSettingsSchema);
export default AssessmentSettings;
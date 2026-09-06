import mongoose from "mongoose";

/**
 * AssessmentIntegrityEvent — records browser-level integrity observations during
 * an assessment attempt. Never stores answers or correct answer data.
 */
const integrityEventSchema = new mongoose.Schema(
  {
    attempt: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentAttempt", required: true, index: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "FULLSCREEN_ENTERED",
        "FULLSCREEN_EXITED",
        "TAB_SWITCH",
        "WINDOW_BLUR",
        "WINDOW_FOCUS",
        "SUSPICIOUS_KEY_SHORTCUT",
        "CONTEXT_MENU",
        "COPY_ATTEMPT",
        "PASTE_ATTEMPT",
        "TEXT_SELECTION",
        "AUTO_SUBMIT_VIOLATION",
        "WARNING_SHOWN",
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    durationAway: { type: Number, default: 0 }, // seconds away (for tab switch / blur)
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

const AssessmentIntegrityEvent = mongoose.model("AssessmentIntegrityEvent", integrityEventSchema);
export default AssessmentIntegrityEvent;
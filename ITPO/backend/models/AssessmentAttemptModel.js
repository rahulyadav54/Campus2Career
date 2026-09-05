import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  template: { type: mongoose.Schema.Types.ObjectId, ref: "AssessmentTemplate" },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
    selectedOption: { type: Number },
    ratingValue: { type: Number },
    isCorrect: { type: Boolean },
    marksAwarded: { type: Number, default: 0 }
  }],
  scores: {
    technical: { type: Number, default: 0 },
    soft: { type: Number, default: 0 },
    aptitude: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  maxScores: {
    technical: { type: Number, default: 0 },
    soft: { type: Number, default: 0 },
    aptitude: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  strengths: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  timeTakenSeconds: { type: Number },
  passed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("AssessmentAttempt", attemptSchema);

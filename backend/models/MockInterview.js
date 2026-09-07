import mongoose from "mongoose";

const mockInterviewQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    type: {
      type: String,
      enum: ["technical", "behavioral", "hr", "scenario"],
      default: "technical",
    },
    skill: { type: String, default: "" },
    expectedPoints: [{ type: String }],
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const mockInterviewAnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true },
    answerText: { type: String, default: "" },
    timeSpentSeconds: { type: Number, default: 0 },
    audioUrl: { type: String, default: "" },
  },
  { _id: false }
);

const mockInterviewFeedbackSchema = new mongoose.Schema(
  {
    technicalAccuracy: { type: Number, min: 0, max: 100, default: 0 },
    communication: { type: Number, min: 0, max: 100, default: 0 },
    problemSolving: { type: Number, min: 0, max: 100, default: 0 },
    answerStructure: { type: Number, min: 0, max: 100, default: 0 },
    confidence: { type: Number, min: 0, max: 100, default: 0 },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    recommendedImprovements: [{ type: String }],
    recommendedPracticeQuestions: [{ type: String }],
  },
  { _id: false }
);

const mockInterviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    interviewType: {
      type: String,
      enum: ["technical", "hr", "behavioral", "mixed"],
      default: "mixed",
    },
    questions: [mockInterviewQuestionSchema],
    answers: [mockInterviewAnswerSchema],
    feedback: mockInterviewFeedbackSchema,
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed", "abandoned"],
      default: "not_started",
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
    durationSeconds: { type: Number },
    aiModel: { type: String, default: "nvidia/nemotron" },
  },
  { timestamps: true }
);

mockInterviewSchema.index({ student: 1, createdAt: -1 });

export default mongoose.model("MockInterview", mockInterviewSchema);

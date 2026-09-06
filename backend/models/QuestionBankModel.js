import mongoose from "mongoose";

/**
 * Question — question bank entity.
 * Extended (backward-compatible) to support the recruitment assessment engine:
 * new types (mcq_multi, short_answer, descriptive), negative marking, explanation,
 * tags, and a text answer field for short/descriptive questions.
 */
const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: { type: String, enum: ["technical", "soft", "aptitude"], required: true },
  skill: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ["mcq", "mcq_multi", "rating", "true_false", "short_answer", "descriptive"],
    default: "mcq",
  },
  options: [{ text: String, isCorrect: Boolean }],
  correctAnswerText: { type: String, default: "" }, // for short_answer / descriptive
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  explanation: { type: String, default: "" },
  tags: { type: [String], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

questionSchema.index({ skill: 1, category: 1 });
questionSchema.index({ type: 1, difficulty: 1 });

/**
 * AssessmentTemplate — reusable assessment template.
 * Extended with sections, skills, difficulty distribution and marking rules for
 * the recruitment assessment engine. Existing fields remain unchanged.
 */
const assessmentTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  sections: [{ name: String, skill: String, questionCount: Number }],
  skills: { type: [String], default: [] },
  difficultyDistribution: { type: Map, of: Number, default: { easy: 0, medium: 0, hard: 0 } },
  timeLimitMinutes: { type: Number, default: 30 },
  passingScore: { type: Number, default: 60 },
  negativeMarking: { type: Boolean, default: false },
  randomizeQuestions: { type: Boolean, default: true },
  maxAttempts: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);
export const AssessmentTemplate = mongoose.model("AssessmentTemplate", assessmentTemplateSchema);

export const QUESTION_TYPES = ["mcq", "mcq_multi", "rating", "true_false", "short_answer", "descriptive"];
export const QUESTION_CATEGORIES = ["technical", "soft", "aptitude"];
export const QUESTION_DIFFICULTIES = ["easy", "medium", "hard"];

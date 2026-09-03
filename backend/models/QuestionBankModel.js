import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  category: { type: String, enum: ["technical", "soft", "aptitude"], required: true },
  skill: { type: String, required: true, trim: true },
  type: { type: String, enum: ["mcq", "rating", "true_false"], default: "mcq" },
  options: [{ text: String, isCorrect: Boolean }],
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  marks: { type: Number, default: 1 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const assessmentTemplateSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  timeLimitMinutes: { type: Number, default: 30 },
  passingScore: { type: Number, default: 60 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);
export const AssessmentTemplate = mongoose.model("AssessmentTemplate", assessmentTemplateSchema);

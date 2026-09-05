import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true },
  options: { type: [String], required: true, validate: v => Array.isArray(v) && v.length >= 2 },
  correctAnswer: { type: String, required: true },
  marks: { type: Number, default: 1, min: 0 },
  explanation: { type: String, default: "" }
}, { _id: true });

const aptitudeTestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  category: {
    type: String,
    enum: ["logical", "math", "verbal", "technical", "general"],
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },
  timeLimitMinutes: { type: Number, default: 30, min: 1 },
  questions: { type: [questionSchema], default: [] },
  status: {
    type: String,
    enum: ["draft", "published", "archived"],
    default: "draft"
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  totalMarks: { type: Number, default: 0 },
  passingMarks: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

aptitudeTestSchema.pre("save", function (next) {
  this.totalMarks = (this.questions || []).reduce((sum, q) => sum + (q.marks || 0), 0);
  if (!this.passingMarks || this.passingMarks <= 0) {
    this.passingMarks = Math.ceil(this.totalMarks * 0.4);
  }
  next();
});

export default mongoose.model("AptitudeTest", aptitudeTestSchema);
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: String, default: null },
  isCorrect: { type: Boolean, default: false },
  marksObtained: { type: Number, default: 0 }
}, { _id: false });

const aptitudeAttemptSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: "AptitudeTest", required: true, index: true },
  answers: { type: [answerSchema], default: [] },
  totalMarksObtained: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  startedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  timeTakenSeconds: { type: Number }
}, { timestamps: true });

export default mongoose.model("AptitudeAttempt", aptitudeAttemptSchema);
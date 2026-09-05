import mongoose from "mongoose";

const courseEnrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" },
  enrolledAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 },
  certificateUrl: { type: String, default: "" },
  certificateId: { type: String, default: "" },
  certificateIssueDate: { type: Date }
}, { timestamps: true });

courseEnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

export default mongoose.model("CourseEnrollment", courseEnrollmentSchema);

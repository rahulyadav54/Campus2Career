import mongoose from "mongoose";

const courseLessonSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "CourseModule", required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: "" },
  contentType: { type: String, enum: ["video", "text", "quiz", "project"], default: "text" },
  durationMinutes: { type: Number, default: 10 },
  order: { type: Number, default: 0 },
  videoUrl: { type: String, default: "" },
  resources: [{ title: String, url: String }],
}, { timestamps: true });

courseLessonSchema.index({ module: 1, order: 1 });
courseLessonSchema.index({ course: 1 });

export default mongoose.model("CourseLesson", courseLessonSchema);

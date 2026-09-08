import mongoose from "mongoose";

const courseModuleSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  order: { type: Number, default: 0 },
}, { timestamps: true });

courseModuleSchema.index({ course: 1, order: 1 });

export default mongoose.model("CourseModule", courseModuleSchema);

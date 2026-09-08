import mongoose from "mongoose";

const learningPathSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: "" },
  targetRole: { type: String, default: "" },
  courses: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
    order: { type: Number, default: 0 },
  }],
  status: { type: String, enum: ["draft", "published"], default: "published" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("LearningPath", learningPathSchema);

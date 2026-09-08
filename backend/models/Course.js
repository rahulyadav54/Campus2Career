import mongoose from "mongoose";
import { COURSE_CATEGORIES } from "../constants/courseCategories.js";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  provider: { type: String, required: true, trim: true },
  platform: { type: String, default: "Campus2Career", trim: true },
  instructor: { type: String, default: "" },
  category: { type: String, enum: [...COURSE_CATEGORIES, ""], default: "Programming" },
  skills: [{ type: String }],
  targetRoles: [{ type: String }],
  prerequisites: [{ type: String }],
  learningOutcomes: [{ type: String }],
  duration: { type: String },
  durationHours: { type: Number, default: 0 },
  lessonCount: { type: Number, default: 0 },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  language: { type: String, default: "English" },
  certificateAvailable: { type: Boolean, default: true },
  courseType: { type: String, enum: ["internal", "external"], default: "external" },
  externalUrl: { type: String, default: "" },
  thumbnail: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

courseSchema.index({ provider: 1, title: 1 });
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ skills: 1 });
courseSchema.index({ targetRoles: 1 });
courseSchema.index({ title: "text", description: "text", skills: "text" });

export default mongoose.model("Course", courseSchema);

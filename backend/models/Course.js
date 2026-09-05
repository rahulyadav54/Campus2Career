import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  provider: { type: String, required: true, trim: true },
  platform: { type: String, required: true, trim: true },
  skills: [{ type: String }],
  duration: { type: String },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  certificateAvailable: { type: Boolean, default: true },
  externalUrl: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  rating: { type: Number, default: 0 },
  isFree: { type: Boolean, default: true },
  status: { type: String, enum: ["draft", "published", "archived"], default: "published" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

courseSchema.index({ provider: 1, title: 1 });

export default mongoose.model("Course", courseSchema);

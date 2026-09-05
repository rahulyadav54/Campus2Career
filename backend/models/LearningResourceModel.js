import mongoose from "mongoose";

const learningResourceSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  provider: { type: String, required: true, trim: true }, // e.g. Coursera, NPTEL, Udemy
  type: {
    type: String,
    enum: ["course", "certification", "workshop", "bootcamp", "tutorial", "book"],
    required: true
  },
  skills: { type: [String], default: [] },
  url: { type: String, default: "" },
  durationHours: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  industry: { type: String, default: "" },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

learningResourceSchema.index({ skills: 1 });

export default mongoose.model("LearningResource", learningResourceSchema);

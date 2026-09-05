import mongoose from "mongoose";

const learningPlatformSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  provider: { type: String, required: true, trim: true },
  type: { type: String, enum: ["mooc", "certification", "institutional", "government"], default: "mooc" },
  description: { type: String, required: true },
  website: { type: String, required: true },
  apiEndpoint: { type: String, default: "" },
  apiKey: { type: String, default: "" },
  isActive: { type: Boolean, default: true },
  supportedSkills: [{ type: String }],
  logoUrl: { type: String, default: "" },
  integrationStatus: { type: String, enum: ["connected", "pending", "disconnected"], default: "pending" }
}, { timestamps: true });

learningPlatformSchema.index({ provider: 1 });

export default mongoose.model("LearningPlatform", learningPlatformSchema);

import mongoose from "mongoose";

const careerPathwaySchema = new mongoose.Schema({
  role: { type: String, required: true, trim: true },
  industry: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  requiredSkills: { type: [String], default: [] },
  niceToHaveSkills: { type: [String], default: [] },
  averageSalaryLPA: { type: Number, default: 0 },
  demandLevel: { type: String, enum: ["low", "medium", "high", "very_high"], default: "medium" },
  relatedRoles: { type: [String], default: [] },
  certifications: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

careerPathwaySchema.index({ requiredSkills: 1 });
careerPathwaySchema.index({ industry: 1 });

export default mongoose.model("CareerPathway", careerPathwaySchema);

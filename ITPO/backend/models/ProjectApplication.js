import mongoose from "mongoose";

const projectApplicationSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "LiveIndustryProject", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: { type: String },
  appliedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["applied", "shortlisted", "selected", "rejected", "withdrawn"], default: "applied" }
}, { timestamps: true });

projectApplicationSchema.index({ project: 1, student: 1 }, { unique: true });

export default mongoose.model("ProjectApplication", projectApplicationSchema);

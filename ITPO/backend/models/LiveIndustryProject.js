import mongoose from "mongoose";

const liveIndustryProjectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  skillsRequired: [{ type: String }],
  duration: { type: String, required: true },
  stipend: { type: String },
  eligibility: { type: String },
  applicationDeadline: { type: Date },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applicantsCount: { type: Number, default: 0 },
  selectedCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("LiveIndustryProject", liveIndustryProjectSchema);

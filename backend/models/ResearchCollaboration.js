import mongoose from "mongoose";

const researchCollaborationSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  researchArea: { type: String, required: true },
  partners: [{ type: String }],
  fundingAvailable: { type: String },
  duration: { type: String, required: true },
  eligibility: { type: String },
  applicationDeadline: { type: Date },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applicantsCount: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("ResearchCollaboration", researchCollaborationSchema);

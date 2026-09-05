import mongoose from "mongoose";

const portfolioItemSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["skill", "certificate", "project", "internship", "achievement"], required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, default: "", maxlength: 2000 },
  evidenceUrl: { type: String, default: "" },
  issuer: { type: String, default: "" },
  verified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  rejectionReason: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("PortfolioItem", portfolioItemSchema);
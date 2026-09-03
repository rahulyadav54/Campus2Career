import mongoose from "mongoose";

const opportunitySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, maxlength: 5000 },
  type: {
    type: String,
    enum: ["internship", "job", "apprenticeship", "training", "certification", "workshop", "mentorship", "faculty-internship", "fdp", "consultancy", "research", "live-project", "innovation"],
    required: true
  },
  audience: { type: String, enum: ["student", "academician", "both"], default: "student" },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requiredSkills: { type: [String], default: [] },
  eligibility: { type: String, default: "" },
  location: { type: String, default: "Remote" },
  deadline: { type: Date },
  link: { type: String, default: "" },
  status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "pending" },
  applications: [{
    applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: ["applied", "shortlisted", "accepted", "rejected", "completed"], default: "applied" },
    feedback: { type: String, default: "" },
    appliedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

opportunitySchema.index({ type: 1, audience: 1, status: 1 });
opportunitySchema.index({ requiredSkills: 1 });

export default mongoose.model("Opportunity", opportunitySchema);
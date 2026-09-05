import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5 },
  date: { type: Date, default: Date.now }
}, { _id: false });

const internshipProgressSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  opportunity: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity" },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  institution: { type: String, default: "" },
  title: { type: String, required: true },
  organization: { type: String, default: "" },
  description: { type: String, default: "" },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: {
    type: String,
    enum: ["ongoing", "completed", "discontinued"],
    default: "ongoing"
  },
  weeklyUpdates: [{
    week: { type: Number },
    summary: { type: String },
    tasksCompleted: { type: [String], default: [] },
    submittedAt: { type: Date, default: Date.now }
  }],
  mentorFeedback: [feedbackSchema],
  completionEvidence: { type: String, default: "" }, // URL to report/certificate
  completionRemarks: { type: String, default: "" },
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: { type: String, default: "" },
  certificateNumber: { type: String, default: "" },
  skillsGained: { type: [String], default: [] },
  finalRating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

export default mongoose.model("InternshipProgress", internshipProgressSchema);

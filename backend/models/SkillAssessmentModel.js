import mongoose from "mongoose";

const skillAssessmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  responses: [{
    skill: { type: String, required: true, trim: true },
    category: { type: String, enum: ["technical", "soft", "aptitude"], required: true },
    score: { type: Number, min: 0, max: 100, required: true }
  }],
  interests: { type: [String], default: [] },
  strengths: { type: [String], default: [] },
  gaps: { type: [String], default: [] },
  learningRecommendations: { type: [mongoose.Schema.Types.Mixed], default: [] },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("SkillAssessment", skillAssessmentSchema);
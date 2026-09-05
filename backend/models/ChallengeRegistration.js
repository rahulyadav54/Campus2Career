import mongoose from "mongoose";

const challengeRegistrationSchema = new mongoose.Schema({
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: "InnovationChallenge", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  teamName: { type: String },
  teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["registered", "submitted", "cancelled"], default: "registered" }
}, { timestamps: true });

challengeRegistrationSchema.index({ challenge: 1, student: 1 }, { unique: true });

export default mongoose.model("ChallengeRegistration", challengeRegistrationSchema);

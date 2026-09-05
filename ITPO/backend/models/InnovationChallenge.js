import mongoose from "mongoose";

const innovationChallengeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  organizer: { type: String, required: true },
  theme: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  prize: { type: String },
  skills: [{ type: String }],
  eligibility: { type: String },
  maxTeamSize: { type: Number, default: 4 },
  registrationDeadline: { type: Date },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("InnovationChallenge", innovationChallengeSchema);

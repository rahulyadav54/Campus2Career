import mongoose from "mongoose";

const mentorshipSessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  topic: { type: String, required: true, trim: true },
  description: { type: String },
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  mode: { type: String, enum: ["online", "offline", "hybrid"], default: "online" },
  status: { type: String, enum: ["scheduled", "completed", "cancelled", "missed"], default: "scheduled" },
  meetingLink: { type: String },
  notes: { type: String },
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  completedAt: { type: Date }
}, { timestamps: true });

export default mongoose.model("MentorshipSession", mentorshipSessionSchema);

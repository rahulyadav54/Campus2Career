import mongoose from "mongoose";

const guestLectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  speaker: { type: String, required: true },
  designation: { type: String, required: true },
  organization: { type: String, required: true },
  topic: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  mode: { type: String, enum: ["online", "offline", "hybrid"], default: "online" },
  skills: [{ type: String }],
  eligibility: { type: String },
  maxParticipants: { type: Number },
  registeredCount: { type: Number, default: 0 },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("GuestLecture", guestLectureSchema);

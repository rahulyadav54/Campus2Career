import mongoose from "mongoose";

const facultyDevelopmentProgramSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  organization: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  mode: { type: String, enum: ["online", "offline", "hybrid"], default: "online" },
  skills: [{ type: String }],
  eligibility: { type: String },
  applicationDeadline: { type: Date },
  status: { type: String, enum: ["draft", "published", "closed"], default: "draft" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  applicantsCount: { type: Number, default: 0 },
  maxParticipants: { type: Number },
  certificateProvided: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("FacultyDevelopmentProgram", facultyDevelopmentProgramSchema);

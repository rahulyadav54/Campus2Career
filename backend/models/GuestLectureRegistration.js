import mongoose from "mongoose";

const guestLectureRegistrationSchema = new mongoose.Schema({
  guestLecture: { type: mongoose.Schema.Types.ObjectId, ref: "GuestLecture", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["registered", "attended", "cancelled"], default: "registered" }
}, { timestamps: true });

guestLectureRegistrationSchema.index({ guestLecture: 1, student: 1 }, { unique: true });

export default mongoose.model("GuestLectureRegistration", guestLectureRegistrationSchema);

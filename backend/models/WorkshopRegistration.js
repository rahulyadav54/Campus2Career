import mongoose from "mongoose";
import { registrationDetailsSchema } from "./collaborationRegistrationDetails.js";

const workshopRegistrationSchema = new mongoose.Schema({
  workshop: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  details: { type: registrationDetailsSchema, required: true },
  registeredAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["registered", "attended", "cancelled"], default: "registered" }
}, { timestamps: true });

workshopRegistrationSchema.index({ workshop: 1, student: 1 }, { unique: true });

export default mongoose.model("WorkshopRegistration", workshopRegistrationSchema);

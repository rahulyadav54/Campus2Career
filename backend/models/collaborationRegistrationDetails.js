import mongoose from "mongoose";

/** Shared registrant details captured at signup time */
export const registrationDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  institution: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true },
  year: { type: String, required: true, trim: true },
  rollNo: { type: String, required: true, trim: true },
  teamName: { type: String, trim: true, default: "" },
  teamMembers: { type: String, trim: true, default: "" },
  coverLetter: { type: String, trim: true, default: "" },
}, { _id: false });

export default registrationDetailsSchema;

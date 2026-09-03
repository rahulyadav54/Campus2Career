import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  head: { type: String, default: "" }
}, { _id: true });

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 200 },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  website: { type: String, default: "" },
  phone: { type: String, default: "" },
  email: { type: String, default: "" },
  type: { type: String, enum: ["university", "college", "polytechnic", "institute", "other"], default: "college" },
  departments: [departmentSchema],
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  isActive: { type: Boolean, default: true },
  logoUrl: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Institution", institutionSchema);

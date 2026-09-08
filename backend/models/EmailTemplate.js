import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    textBody: { type: String, default: "" },
    category: {
      type: String,
      enum: ["transactional", "optional"],
      default: "transactional",
    },
    isActive: { type: Boolean, default: true },
    variables: [{ type: String }],
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("EmailTemplate", emailTemplateSchema);

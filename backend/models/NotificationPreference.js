import mongoose from "mongoose";

const channelPrefs = {
  account: { type: Boolean, default: true },
  application: { type: Boolean, default: true },
  interview: { type: Boolean, default: true },
  jobRecommendations: { type: Boolean, default: true },
  resume: { type: Boolean, default: true },
  careerTips: { type: Boolean, default: false },
  jobDigest: { type: Boolean, default: true },
  security: { type: Boolean, default: true },
};

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    email: channelPrefs,
    inApp: {
      application: { type: Boolean, default: true },
      interview: { type: Boolean, default: true },
      resume: { type: Boolean, default: true },
      jobRecommendations: { type: Boolean, default: true },
      account: { type: Boolean, default: true },
    },
    digestFrequency: {
      type: String,
      enum: ["none", "daily", "weekly"],
      default: "weekly",
    },
  },
  { timestamps: true }
);

export default mongoose.model("NotificationPreference", notificationPreferenceSchema);

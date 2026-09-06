import mongoose from "mongoose";

const authSessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: String, required: true, unique: true, index: true },
  userAgent: { type: String, default: "" },
  ipAddress: { type: String, default: "" },
  lastActiveAt: { type: Date, default: Date.now },
  revokedAt: { type: Date, default: null },
}, { timestamps: true });

authSessionSchema.index({ user: 1, revokedAt: 1 });

export default mongoose.model("AuthSession", authSessionSchema);

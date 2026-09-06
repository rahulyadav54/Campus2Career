import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    source: { type: String, default: "" },
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat" },
    messages: [messageSchema],
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, lastMessageAt: -1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);
export default ChatHistory;

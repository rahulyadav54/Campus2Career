import ChatHistory from "../models/ChatHistoryModel.js";

export const getChatHistories = async (req, res, next) => {
  try {
    const histories = await ChatHistory.find({ user: req.user._id })
      .sort({ lastMessageAt: -1 })
      .lean();
    res.json({ histories });
  } catch (e) { next(e); }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const history = await ChatHistory.findOne({ _id: req.params.id, user: req.user._id }).lean();
    if (!history) return res.status(404).json({ message: "Chat history not found" });
    res.json({ history });
  } catch (e) { next(e); }
};

export const createChatHistory = async (req, res, next) => {
  try {
    const history = await ChatHistory.create({
      user: req.user._id,
      title: req.body.title || "New Chat",
      messages: req.body.messages || [],
      lastMessageAt: new Date(),
    });
    res.status(201).json({ history });
  } catch (e) { next(e); }
};

export const updateChatHistory = async (req, res, next) => {
  try {
    const history = await ChatHistory.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        messages: req.body.messages,
        lastMessageAt: new Date(),
        ...(req.body.title ? { title: req.body.title } : {}),
      },
      { new: true }
    ).lean();
    if (!history) return res.status(404).json({ message: "Chat history not found" });
    res.json({ history });
  } catch (e) { next(e); }
};

export const deleteChatHistory = async (req, res, next) => {
  try {
    await ChatHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ success: true });
  } catch (e) { next(e); }
};

export const clearAllChatHistories = async (req, res, next) => {
  try {
    await ChatHistory.deleteMany({ user: req.user._id });
    res.json({ success: true });
  } catch (e) { next(e); }
};

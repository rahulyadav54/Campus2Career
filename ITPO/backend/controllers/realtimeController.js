import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";
import { addClient } from "../services/realtimeService.js";

export const streamEvents = async (req, res) => {
  try {
    const token = req.query.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("_id");
    if (!user) return res.status(401).end();

    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no" });
    res.write("event: connected\ndata: {}\n\n");
    addClient(user._id, res);
  } catch {
    res.status(401).json({ message: "Invalid event stream token" });
  }
};
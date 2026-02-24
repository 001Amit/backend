import Message from "../models/Message.js";

export const getChatHistory = async (req, res) => {
  const { userId } = req.params;

  const messages = await Message.find({
    $or: [
      { sender: req.user._id, receiver: userId },
      { sender: userId, receiver: req.user._id },
    ],
  }).sort("createdAt");

  res.json(messages);
};

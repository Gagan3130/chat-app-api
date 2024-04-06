const asyncHandler = require("express-async-handler");
const Message = require("../Models/messageModel");
const { ValidationError } = require("../utils/custome-error");
const errorCodes = require("../utils/error-codes");
const Chat = require("../Models/chatModel");

const sendMessage = asyncHandler(async (req, res) => {
  const { chatId, content } = req.body;
  const sender = req.user;
  if (!chatId) {
    throw new ValidationError({
      message: "Please provide ChatId",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  const obj = {
    sender: sender,
    content: content,
    chat: chatId,
    readBy: [sender],
  };

  const message = await Message.create(obj);
  const populatedMessage = await Message.findOne({ _id: message._id })
    .populate("sender", "name pic email")
    .populate("readBy", "name pic email")
    .populate({
      path: "chat",
      populate: {
        path: "groupAdmin",
        select: "name pic email",
      },
      populate: {
        path: "users",
        select: "name pic email",
      },
      populate: {
        path: "latestMessage",
        model: "Message",
      },
    })
    .exec();
  await Chat.findByIdAndUpdate(chatId, { latestMessage: populatedMessage });
  res.json(populatedMessage);
});

const getAllMessages = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);
  if (!req.params.chatId) {
    throw new ValidationError({
      message: "Please provide ChatId",
      code: errorCodes.INVALID_FIELDS,
    });
  }
  const messages = await Message.find({ chat: req.params.chatId })
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: {
        path: "groupAdmin",
      },
      populate: {
        path: "users",
      },
      populate: {
        path: "latestMessage",
      },
    })
    .exec();
  let countTotal = await Message.countDocuments({ chat: req.params.chatId })
  const result = {
    count: countTotal,
    messages: messages.reverse(),
  };
  res.json(result);
});

const readMessage = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId;
  if (!chatId) {
    throw new ValidationError({
      message: "Please provide ChatId",
      code: errorCodes.INVALID_FIELDS,
    });
  }
  const loggedUserId = req.user;
  await Message.updateMany(
    {
      chat: chatId,
      $and: [{ readBy: { $ne: loggedUserId } }],
    },
    { $push: { readBy: loggedUserId } }
  );
  const messages = await Message.find({ chat: chatId })
    .populate("sender", "name pic email")
    .populate({
      path: "chat",
      populate: {
        path: "groupAdmin",
      },
      populate: {
        path: "users",
      },
      populate: {
        path: "latestMessage",
      },
    });
  res.status(200).json(messages);
});

module.exports = {
  sendMessage,
  getAllMessages,
  readMessage,
};

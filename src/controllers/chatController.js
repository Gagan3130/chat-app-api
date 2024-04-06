const asyncHandler = require("express-async-handler");
const Chat = require("../Models/chatModel");
const errorCodes = require("../utils/error-codes");
const {
  ValidationError,
  NotFoundError,
  AuthenticationError,
} = require("../utils/custome-error");
const Message = require("../Models/messageModel");

const accessChat = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const loggedUserId = req.user;

  if (!userId) {
    throw new ValidationError({
      message: "User id cannot be undefined",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  const isChat = await Chat.find({
    isGroupChat: false,
    $and: [
      { users: { $elemMatch: { $eq: loggedUserId } } },
      { users: { $elemMatch: { $eq: userId } } },
    ],
  })
    .populate("users", "-password")
    .populate({
      //nested population -> https://dev.to/paras594/how-to-use-populate-in-mongoose-node-js-mo0
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name pic email",
      },
    });
  if (isChat.length > 0) {
    res.send(isChat[0]);
  } else {
    const newChat = {
      chatName: "sender",
      isGroupChat: false,
      users: [userId, loggedUserId],
    };
    const createdChat = await Chat.create(newChat);
    const fullChat = await Chat.findOne({ _id: createdChat._id }).populate(
      "users",
      "-password"
    );
    console.log(fullChat, "fullChat");
    res.status(201).send(fullChat);
  }
});

const getAllChats = asyncHandler(async (req, res) => {
  const loggedUserId = req.user;
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: loggedUserId } },
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password")
    .populate({
      //nested population -> https://dev.to/paras594/how-to-use-populate-in-mongoose-node-js-mo0
      path: "latestMessage",
      populate: {
        path: "sender",
        select: "name pic email",
      },
    })
    .sort({ updatedAt: -1 });
  const chatsWithUnreadCount = await Promise.all(
    chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        readBy: { $nin: loggedUserId },
      });
      return { ...chat.toJSON(), unreadCount, id: chat.id };
    })
  );
  res.status(200).json(chatsWithUnreadCount);
});

const createGroupChat = asyncHandler(async (req, res) => {
  const { users, chatName } = req.body;
  const loggedUserId = req.user;

  if (!users || !chatName) {
    throw new ValidationError({
      message: "all fields are required",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  if (!Array.isArray(users)) {
    throw new ValidationError({
      message: "users should be a list",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  if (users.length < 2) {
    throw new ValidationError({
      message: "there should be more than 2 user for a group chat",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  users.push(loggedUserId);

  const newGroupChat = await Chat.create({
    isGroupChat: true,
    chatName: chatName,
    users: users,
    groupAdmin: loggedUserId,
  });

  const fullGroupChat = await Chat.findOne({ _id: newGroupChat._id })
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  res.status(201).json(fullGroupChat);
});

const removeFromGroup = asyncHandler(async (req, res) => {
  const { chatId } = req.body;
  const loggedUserId = req.user;
  if (!chatId) {
    throw new ValidationError({
      message: "All fields are mandatory",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  const updateGroup = await Chat.findByIdAndUpdate(
    chatId,
    {
      $pull: { users: loggedUserId },
    },
    {
      new: true,
    }
  )
    .populate("users", "-password")
    .populate("groupAdmin", "-password");
  if (!updateGroup) {
    throw new NotFoundError({
      message: "Invalid group",
      code: errorCodes.INVALID_CHAT_ID,
    });
  } else res.status(200).json(updateGroup);
});

const updateGroupChat = asyncHandler(async (req, res) => {
  const { chatId, chatName, users } = req.body;
  const loggedUserId = req.user;
  if (!chatId) {
    throw new ValidationError({
      message: "Please provide ChatId",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  if (chatName === "") {
    throw new ValidationError({
      message: "Chat Name cannot be empty",
      code: errorCodes.INVALID_FIELDS,
    });
  }

  if (users) {
    if (!Array.isArray(users)) {
      throw new ValidationError({
        message: "users should be a list",
        code: errorCodes.INVALID_FIELDS,
      });
    }
    const chat = await Chat.findById(chatId).populate(
      "groupAdmin",
      "-password"
    );
    if (!chat) {
      throw new NotFoundError({
        message: "Chat not found",
        code: errorCodes.CHAT_NOT_FOUND,
      });
    }

    if (chat.groupAdmin.id !== loggedUserId) {
      throw new AuthenticationError({
        message: "Only Admin can add or remove user",
        code: errorCodes.ACCESS_DENIED,
      });
    }
  }
  let updateDetails = {};
  if (chatName) {
    updateDetails = {
      chatName: chatName,
    };
  }
  if (users) {
    updateDetails = {
      ...updateDetails,
      users: users,
    };
  }
  const updateGroup = await Chat.findByIdAndUpdate(chatId, updateDetails, {
    new: true,
  })
    .populate("users", "-password")
    .populate("groupAdmin", "-password");

  if (!updateGroup) {
    throw new NotFoundError({
      message: "Invalid group",
      code: errorCodes.INVALID_CHAT_ID,
    });
  } else res.status(201).json(updateGroup);
});

module.exports = {
  accessChat,
  getAllChats,
  createGroupChat,
  removeFromGroup,
  updateGroupChat,
};

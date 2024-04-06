const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const cors = require("cors");
const {
  ValidationError,
  AuthenticationError,
  NotFoundError,
} = require("./utils/custome-error");
dotenv.config();
connectDB();
const PORT = process.env.PORT || 5000;
let corsOptions = {
  origin: ["http://localhost:3000", "http://localhost:3001"],
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json()); // to accept json data from frontend
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use((err, req, res, next) => {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message, code: err.code });
  } else if (err instanceof AuthenticationError) {
    res.status(401).json({ error: err.message, code: err.code });
  } else if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message, code: err.code });
  } else {
    console.log(err, "err");
    res.status(500).json({
      error: "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
    });
  }
});
app.listen(PORT, console.log(`server started on port ${PORT}`));

var onlineUsers = [];

const { Server } = require("socket.io");
const io = new Server({
  pingTimeout: 60000,
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
  },
});

io.on("connection", (socket) => {
  socket.on("newUser", (userId) => {
    socket.join(userId);
    !onlineUsers.some((user) => user.userId === userId) &&
      onlineUsers.push({ userId, socketId: socket.id });
    socket.emit("connected");
    io.emit("getOnlineUsers", onlineUsers);
  });

  socket.on("disconnect", () => {
    onlineUsers = onlineUsers.filter((item) => item.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
  socket.on("join-chat", (roomId) => {
    console.log(roomId, "roomId");
    socket.join(roomId);
  });
  socket.on("typing", (room) => socket.broadcast.to(room).emit("typing"));
  socket.on("stop typing", (room) =>
    socket.broadcast.to(room).emit("stop typing")
  );
  socket.on("send-message", (latestMessage, roomId) => {
    console.log(latestMessage, roomId, "latestMessage");
    latestMessage.chat.users.forEach((user) => {
      io.to(user).emit("receive-message", latestMessage, user);
    });
  });
  socket.on("read-message",(senderId, readUsersList)=>{
    io.to(senderId).emit("readers-list", readUsersList)
  })
});

io.listen(8080);

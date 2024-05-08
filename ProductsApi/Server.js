import App from "./Api/App.js";
import http from "http";
import { Server } from "socket.io";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { JWT_SECRET, PORT } from "./Api/Config/index.js";
import User from "./Api/Models/User.js";
import OnlineUsers from "./Api/Helpers/Online-users.js";
import Database from "./Api/Database.js";
import jwt from "jsonwebtoken";

export const __dirname = dirname(fileURLToPath(import.meta.url));

/*
  * In order to use the socket.io 
  * we need to create a server and pass our Express App to it because
    the socket.io uses the http server to listen to events
*/
const server = http.createServer(App);

// Setting up the socket.io
export const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

/*
  This socket middleware
  is used to authenticate the user and add the user 
  to the online users list when the user connects
*/
io.use(async (socket, next) => {
  const authorization = socket.handshake.headers["authorization"];
  if (!authorization) {
    return next(new Error("Authentication error"));
  }
  const token = authorization.split(" ")[1];
  try {
    await Database.getInstance();
    let user = jwt.verify(token, JWT_SECRET);
    if (!user) {
      return next(new Error("Authentication error"));
    }
    user = await User.findById(user.id);
    if (!user) {
      return next(new Error("Authentication error"));
    }
    OnlineUsers.addUser({ userId: user._id.toString(), socketId: socket.id });
    socket.user = user;
    next();
  } catch (error) {
    console.log(error)
    return next(new Error("Authentication error"));
  }
});

// console.log(io.sockets)
io.on("connection", (socket) => {
  console.log("a user connected");
  io.emit("online-users", OnlineUsers.users);

  // This event is triggered when the user 
  // is disconnected from the server
  socket.on("disconnect", () => {
    OnlineUsers.removeUserBySocketId(socket.id);
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log("====== SERVER IS RUNNING ======");
  console.log(`====== PORT: ${PORT}        ======`);
  console.log("===============================");
});
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http"); // 1. Import http
const { Server } = require("socket.io"); // 2. Import Socket.io
require("dotenv").config();

const app = express();

// ================= Create HTTP Server =================
const server = http.createServer(app); // 3. Wrap express app
const io = new Server(server, {
  cors: {
    origin: "https://smart-task-team-management-system-9y8xxow4z.vercel.app", // Update this to your frontend URL
    methods: ["GET", "POST"]
  }
});

// ================= Socket.io Logic =================
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Users will "join" a room named after their UserID
  socket.on("join_room", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their private notification room`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// 4. Attach 'io' to the 'app' instance so it can be used in routes
app.set("socketio", io);

// ================= Middleware =================
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); 

// ================= Routes =================
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const timeLogRoutes = require("./routes/timeLogRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/timelogs", timeLogRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.send("API is running with Real-time Sockets...");
});

// ================= MongoDB & Server Start =================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    // 5. IMPORTANT: Listen on 'server', not 'app'
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((error) => {
    console.log("❌ Database connection failed:", error);
  });

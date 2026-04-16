const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { sanitize } = require("express-mongo-sanitize");
require("dotenv").config();

const main = require("./config/mongoDB");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const redisClient = require("./config/redisDB");

// Voting system routes
const voteRouter = require("./routes/voteRoute");
const voterRouter = require("./routes/voterRoute");
const candidateRouter = require("./routes/candidateRoute");
const configRouter = require("./routes/configRoute");
const uploadRouter = require("./routes/uploadroute");
const adminRouter = require("./routes/adminRoute");
const { getServerTime } = require("./middleware/timeGuard");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: true, methods: ["GET", "POST"] },
});

// Security
app.use(
  helmet({
    contentSecurityPolicy: false,
    // COOP/OAC are ignored on untrustworthy HTTP origins (e.g. public IP over http)
    // and can generate noisy browser warnings if mixed with previously site-keyed pages.
    crossOriginOpenerPolicy: false,
    originAgentCluster: false,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many requests. Try again later." },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

// Avoid noisy browser 404 for favicon.
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});

// NoSQL injection sanitization (Express 5 compatible: no reassignment of req.query)
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") sanitize(req.body);
  if (req.params && typeof req.params === "object") sanitize(req.params);
  if (req.query && typeof req.query === "object") sanitize(req.query);
  next();
});

// Server time sync (for clients)
app.get("/api/time", getServerTime);

// Voting system API
app.use("/api/vote", voteRouter);
app.use("/api/voter", voterRouter);
app.use("/api/candidate", candidateRouter);
app.use("/api/config", configRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/admin", adminRouter);

// Serve frontend strictly from Backend/build.
const staticDir = path.join(__dirname, "build");

if (fs.existsSync(path.join(staticDir, "index.html"))) {
  console.log("Serving frontend from:", staticDir);
  app.use(express.static(staticDir));
  app.get(/^(?!\/api|\/socket\.io).*/, (req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

// Socket.io: broadcast server time & election config
io.on("connection", (socket) => {
  socket.on("getTime", async () => {
    try {
      const Config = require("./model/config");
      const config = await Config.findOne().sort({ createdAt: -1 }).lean();
      socket.emit("timeUpdate", {
        serverTime: new Date().toISOString(),
        config: config
          ? {
              electionStatus: config.electionStatus,
              startTime: config.startTime,
              endTime: config.endTime,
              registrationDeadline: config.registrationDeadline,
            }
          : null,
      });
    } catch (err) {
      socket.emit("timeUpdate", {
        serverTime: new Date().toISOString(),
        config: null,
      });
    }
  });
});

// Broadcast election status changes (call from admin)
function broadcastElectionUpdate() {
  io.emit("electionUpdate");
}

const InitializeConnection = async () => {
  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log("Server is running at Port:", port);
  });

  try {
    await main();
    console.log("DB Connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    console.warn(
      "Running in degraded mode: frontend/static routes are available, DB-backed APIs may fail until MongoDB is reachable.",
    );
  }

  // Attempt Redis connection, but don't block server startup if it fails
  if (redisClient && typeof redisClient.connect === "function") {
    try {
      await redisClient.connect();
    } catch (redisError) {
      console.error("Redis connection failed:", redisError.message);
    }
  }
};

InitializeConnection();

module.exports = { app, server, io, broadcastElectionUpdate };

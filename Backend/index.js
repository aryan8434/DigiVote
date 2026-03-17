const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sanitize } = require('express-mongo-sanitize');
require('dotenv').config();

const main = require('./config/mongoDB');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const redisClient = require('./config/redisDB');

// Voting system routes
const voteRouter = require('./routes/voteRoute');
const voterRouter = require('./routes/voterRoute');
const candidateRouter = require('./routes/candidateRoute');
const configRouter = require('./routes/configRoute');
const uploadRouter = require('./routes/uploadRoute');
const adminRouter = require('./routes/adminRoute');
const { getServerTime } = require('./middleware/timeGuard');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET'] },
});

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: 'Too many requests. Try again later.' },
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// NoSQL injection sanitization (Express 5 compatible: no reassignment of req.query)
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') sanitize(req.body);
  if (req.params && typeof req.params === 'object') sanitize(req.params);
  if (req.query && typeof req.query === 'object') sanitize(req.query);
  next();
});

// Server time sync (for clients)
app.get('/api/time', getServerTime);


// Voting system API
app.use('/api/vote', voteRouter);
app.use('/api/voter', voterRouter);
app.use('/api/candidate', candidateRouter);
app.use('/api/config', configRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);

// Socket.io: broadcast server time & election config
io.on('connection', (socket) => {
  socket.on('getTime', async () => {
    try {
      const Config = require('./model/Config');
      const config = await Config.findOne().sort({ createdAt: -1 }).lean();
      socket.emit('timeUpdate', {
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
      socket.emit('timeUpdate', { serverTime: new Date().toISOString(), config: null });
    }
  });
});

// Broadcast election status changes (call from admin)
function broadcastElectionUpdate() {
  io.emit('electionUpdate');
}

const InitializeConnection = async () => {
  try {
    await main();

    // Attempt Redis connection, but don't block server startup if it fails
    if (redisClient && typeof redisClient.connect === 'function') {
      try {
        await redisClient.connect();
      } catch (redisError) {
        console.error('Redis connection failed:', redisError.message);
      }
    }

    console.log('DB Connected');

    const port = process.env.PORT || 3000;
    server.listen(port, () => {
      console.log('Server is running at Port:', port);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
};

InitializeConnection();

module.exports = { app, server, io, broadcastElectionUpdate };

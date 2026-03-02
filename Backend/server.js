const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const mongoose = require('mongoose');
const auth = require('./middleware/auth');
const { execSync } = require('child_process');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());
app.use(express.static('public'));
app.use('/api/chat', limiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/ingest', auth, require('./routes/ingestRoutes'));
app.use('/api/tts', require('./routes/ttsRoutes'));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Growlity Ai Chatbot Server is running' });
});

const PORT = process.env.PORT || 5000;

const startServer = (retried = false) => {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE' && !retried) {
      console.warn(`\n⚠️  Port ${PORT} is already in use. Attempting to auto-clear...`);
      try {
        // Find the PID using the port and kill it (Windows)
        const result = execSync(`netstat -ano | findstr :${PORT} | findstr LISTENING`, { encoding: 'utf-8' });
        const lines = result.trim().split('\n');
        const pids = new Set();
        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && pid !== '0') pids.add(pid);
        });

        pids.forEach(pid => {
          try {
            execSync(`taskkill /F /PID ${pid}`, { encoding: 'utf-8' });
            console.log(`✅ Killed process PID ${pid} on port ${PORT}`);
          } catch (killErr) {
            console.warn(`⚠️  Could not kill PID ${pid}: ${killErr.message}`);
          }
        });

        // Wait a moment for the port to be freed, then retry
        console.log(`🔄 Retrying server start on port ${PORT}...\n`);
        setTimeout(() => startServer(true), 1000);
      } catch (findErr) {
        console.error(`\n❌ ERROR: Port ${PORT} is already in use and auto-clear failed.`);
        console.error(`💡 FIX: Run "npm run kill" to clear the port, then try "npm start" again.\n`);
        process.exit(1);
      }
    } else if (err.code === 'EADDRINUSE' && retried) {
      console.error(`\n❌ ERROR: Port ${PORT} is still in use after auto-clear.`);
      console.error(`💡 FIX: Run "npm run kill" to clear the port, then try "npm start" again.\n`);
      process.exit(1);
    } else {
      console.error('Server error:', err);
    }
  });

  return server;
};

const server = startServer();

// Clean Shutdown Logic
const gracefulShutdown = () => {
  console.log('\nShutting down server gracefully...');
  server.close(() => {
    console.log('Server closed.');
    mongoose.connection.close(false).then(() => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

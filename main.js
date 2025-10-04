require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiter = require('express-rate-limit');

require('./src/platform/whatsapp/whatsapp');


const log = require('./src/utils/log');
const formatGen = require('./src/utils/formatGen');
const cpuLoad = require('./src/utils/getCPULoad');


const app = express();
const PORT = process.env.PORT || 9000;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiter middleware
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Routes
const indexRoute = require('./src/routes/index.route');
app.use('/', indexRoute);

// Start Express server
app.listen(PORT, () => {
  log(`✅ Delvin web server is running on port ${PORT}`);
  log(`🌐 Access at: http://localhost:${PORT}`);
});

// ==================== DELVIN COMMAND REFERENCE ====================
const commands = [
"/start",
"/help",
"/about",
"/ping",
"/quote",
"/joke",
"/time",
 "/stats",
"/manage"
];

// Log system info
log('\n📋 Available Commands:');
log(formatGen(commands));
log('\n💻 System Load:');
log(formatGen(cpuLoad()));

// ==================== START SOCIAL MEIDA INTERFACES ====================
log('\n🚀 Starting Delvin Social interfaces...');

//require('./src/platform/telegram/telegram');


// Graceful shutdown
process.on('SIGINT', () => {
  log('\n👋 Shutting down Delvin gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n👋 Shutting down Delvin gracefully...');
  process.exit(0);
});
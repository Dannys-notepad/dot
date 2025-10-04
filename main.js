require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimiter = require('express-rate-limit')

const telegramInterface = require('./src/platform/telegram/telegram')
const core = require('./src/core/core')

const log = require('./src/utils/log')
const formatGen = require('./src/utils/formatGen')
const cpuLoad = require('./src/utils/getCPULoad')

const app = express();
const PORT = process.env.PORT || 9000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Security middleware
app.use(helmet());
app.use(cors());

// rate limiter middleware
app.use(
  limiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
);

const indexRoute = require('./src/routes/index.route');
app.use('/', indexRoute);

app.listen(PORT, () => {
  log(`Delvin server is up and running on port ${PORT}`);
});

const cmd = ['Download', 'Post', 'Update', 'Generate', 'Manage']

log(formatGen(cmd))
log(cpuLoad())
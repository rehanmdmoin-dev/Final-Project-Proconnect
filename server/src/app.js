const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.set('etag', false);

// ---------- Security & core middleware (spec section 33) ----------
app.use(helmet());
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

app.use(
    '/api',
    rateLimit({
        windowMs: (Number(process.env.RATE_LIMIT_WINDOW_MINUTES) || 15) * 60 * 1000,
        max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 300,
        message: { success: false, message: 'Too many requests. Please try again later.' },
    })
);

// ---------- Routes (spec section 29) ----------
app.get('/', (req, res) =>
    res.json({ success: true, message: 'ProConnect API is running' })
);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/companies', require('./routes/companyRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/conversations', require('./routes/conversationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/interviews', require('./routes/interviewRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ---------- Error handling (must be last) ----------
app.use(notFound);
app.use(errorHandler);

module.exports = app;

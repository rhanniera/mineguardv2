const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('./db/connection');
const usersRouter = require('./routes/users');
const reportsRouter = require('./routes/reports');
const notificationsRouter = require('./routes/notifications');
const { initializeDatabase } = require('./db/initDatabase');

const app = express();
const PORT = process.env.PORT || 3001;

// Parse CORS origins
const corsOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://localhost:5500', 'http://localhost:5501', 'file://'];

console.log('🔒 CORS Origins:', corsOrigins);

// Middleware
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/notifications', notificationsRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'MineGuard API',
        version: '1.0.0',
        endpoints: {
            users: '/api/users',
            reports: '/api/reports'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...');
    await db.close();
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        console.log('Starting server...');
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: process.env.PORT || 3001
        });

        // Initialize database
        await initializeDatabase();

        // Start Express server
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✓ Server running on port ${PORT}`);
            console.log(`✓ API endpoint: http://0.0.0.0:${PORT}/api`);
            console.log(`✓ Health check: http://0.0.0.0:${PORT}/health`);
            console.log('\nReady to accept requests.\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;

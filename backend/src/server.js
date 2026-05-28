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

// In production, allow any origin since frontend is served from same origin
if (process.env.NODE_ENV === 'production') {
    console.log('🔒 Production mode: CORS allowing same-origin requests');
}

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

// Serve static files from root directory
const staticPath = path.join(__dirname, '../../');
app.use(express.static(staticPath, {
    setHeaders: (res, filePath) => {
        // Prevent caching of HTML, JS, and CSS files to ensure latest versions are always loaded
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        } else if (filePath.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

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
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        database: dbReady ? 'ready' : 'initializing'
    });
});

// Setup endpoint for manual database initialization
app.get('/api/setup', async (req, res) => {
    try {
        console.log('🔧 Setup endpoint called - initializing database...');
        console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
        
        const { initializeDatabase } = require('./db/initDatabase');
        await initializeDatabase();
        res.json({ 
            success: true,
            message: 'Database initialized successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Setup error details:', error);
        res.status(500).json({ 
            success: false,
            message: 'Database initialization failed',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
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
    // Serve index.html for non-API routes (SPA fallback)
    if (!req.path.startsWith('/api/')) {
        return res.sendFile(path.join(__dirname, '../../index.html'));
    }
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
let dbReady = false;

function startServer() {
    try {
        console.log('Starting server...');
        console.log('Environment:', {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: process.env.PORT || 3001
        });

        // Start Express server immediately
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✓ Server running on port ${PORT}`);
            console.log(`✓ API endpoint: http://0.0.0.0:${PORT}/api`);
            console.log(`✓ Health check: http://0.0.0.0:${PORT}/health`);
            console.log('\nReady to accept requests.\n');
        });

        // Initialize database in background
        initializeDatabase()
            .then(() => {
                dbReady = true;
                console.log('✓ Database ready');
            })
            .catch((error) => {
                console.error('❌ Database initialization failed:', error);
                // Keep server running even if DB fails
                console.error('Server will continue running without database');
            });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;

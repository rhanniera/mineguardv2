const db = require('./connection');
const path = require('path');
const fs = require('fs');

const SCHEMA_SQL = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    department TEXT,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    hazardType TEXT NOT NULL,
    severity TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    affectedPeople INTEGER DEFAULT 0,
    immediateAction TEXT,
    status TEXT DEFAULT 'pending',
    submittedDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Report comments table
CREATE TABLE IF NOT EXISTS report_comments (
    id TEXT PRIMARY KEY,
    reportId TEXT NOT NULL,
    userId TEXT NOT NULL,
    comment TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reportId) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports(userId);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity);
CREATE INDEX IF NOT EXISTS idx_comments_reportId ON report_comments(reportId);
CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications(userId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
`;

async function initializeDatabase() {
    try {
        // Create data directory if it doesn't exist
        const dataDir = path.join(__dirname, '../../data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        await db.connect();

        // Execute schema
        const statements = SCHEMA_SQL.split(';').filter(stmt => stmt.trim());
        for (const statement of statements) {
            if (statement.trim()) {
                await db.run(statement);
            }
        }

        console.log('✓ Database schema initialized');

        // Create default admin user
        const { v4: uuidv4 } = require('uuid');
        const adminId = uuidv4();
        const adminEmail = 'admin@mineguard.com';
        const adminPassword = hashPassword('admin123'); // In production, use strong password

        // Check if admin exists
        const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
        
        if (!existingAdmin) {
            await db.run(
                'INSERT INTO users (id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
                [adminId, 'Administrator', adminEmail, adminPassword, 'Management', 'admin']
            );
            console.log('✓ Default admin user created');
            console.log(`  Email: ${adminEmail}`);
            console.log(`  Password: admin123`);
        }

        console.log('✓ Database initialization complete');
    } catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
}

function hashPassword(password) {
    // Simple hash - in production use bcrypt
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Run if executed directly
if (require.main === module) {
    initializeDatabase().then(() => {
        require('./connection').close();
        process.exit(0);
    });
}

module.exports = { initializeDatabase };

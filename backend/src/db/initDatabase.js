const db = require('./connection');

function hashPassword(password) {
    // Simple hash - in production use bcrypt
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(password).digest('hex');
}

async function createSampleData(uuidv4) {
    try {
        // Create sample workers
        const worker1Id = uuidv4();
        const worker2Id = uuidv4();
        
        await db.run(
            'INSERT INTO users (id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
            [worker1Id, 'John Smith', 'john@mineguard.com', hashPassword('password123'), 'Operations', 'user']
        );
        
        await db.run(
            'INSERT INTO users (id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
            [worker2Id, 'Sarah Johnson', 'sarah@mineguard.com', hashPassword('password123'), 'Safety', 'user']
        );
        
        console.log('✓ Sample users created');
        
        // Create sample reports
        const report1Id = uuidv4();
        const report2Id = uuidv4();
        
        await db.run(
            'INSERT INTO reports (id, userId, hazardType, severity, location, description, affectedPeople, immediateAction, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [report1Id, worker1Id, 'Equipment Malfunction', 'High', 'Shaft B', 'Grinding equipment making unusual noise', 3, 'Stop operation immediately', 'open']
        );
        
        await db.run(
            'INSERT INTO reports (id, userId, hazardType, severity, location, description, affectedPeople, immediateAction, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [report2Id, worker2Id, 'Safety Violation', 'Medium', 'Surface Area', 'Worker not wearing hard hat', 1, 'Issue written warning', 'resolved']
        );
        
        console.log('✓ Sample reports created');
    } catch (err) {
        console.warn('Warning: Could not create sample data:', err.message);
    }
}

async function initializeDatabase() {
    try {
        console.log('🔧 Database initialization starting...');
        await db.connect();
        console.log('✓ Connected to database');

        // Execute schema (split into individual statements)
        const statements = [
            `CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(255) PRIMARY KEY,
                name TEXT NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                department TEXT,
                role TEXT DEFAULT 'user',
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS reports (
                id VARCHAR(255) PRIMARY KEY,
                "userId" VARCHAR(255) NOT NULL,
                "hazardType" TEXT NOT NULL,
                severity TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                "affectedPeople" INTEGER DEFAULT 0,
                "immediateAction" TEXT,
                status TEXT DEFAULT 'pending',
                "submittedDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS report_comments (
                id VARCHAR(255) PRIMARY KEY,
                "reportId" VARCHAR(255) NOT NULL,
                "userId" VARCHAR(255) NOT NULL,
                comment TEXT NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("reportId") REFERENCES reports(id) ON DELETE CASCADE,
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE IF NOT EXISTS notifications (
                id VARCHAR(255) PRIMARY KEY,
                "userId" VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                read SMALLINT DEFAULT 0,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE INDEX IF NOT EXISTS idx_reports_userId ON reports("userId")`,
            `CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status)`,
            `CREATE INDEX IF NOT EXISTS idx_reports_severity ON reports(severity)`,
            `CREATE INDEX IF NOT EXISTS idx_comments_reportId ON report_comments("reportId")`,
            `CREATE INDEX IF NOT EXISTS idx_notifications_userId ON notifications("userId")`,
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`
        ];

        let stmtCount = 0;
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await db.run(statement);
                    stmtCount++;
                    console.log(`✓ Statement ${stmtCount} executed`);
                } catch (err) {
                    // Only ignore "already exists" errors
                    if (err.message && err.message.includes('already exists')) {
                        console.log(`✓ Statement ${stmtCount} already exists`);
                        stmtCount++;
                    } else {
                        console.error(`🔴 Statement ${stmtCount} failed:`, err.message);
                        // Don't throw yet, continue with other statements
                        // throw err;
                    }
                }
            }
        }

        console.log(`✓ Database schema initialized (${stmtCount}/${statements.length} statements)`);

        // Create default admin user
        try {
            const { v4: uuidv4 } = require('uuid');
            const adminId = uuidv4();
            const adminEmail = 'admin@mineguard.com';
            const adminPassword = hashPassword('admin123');

            console.log('🔍 Checking for existing admin...');
            const existingAdmin = await db.get('SELECT id FROM users WHERE email = ?', [adminEmail]);
            
            if (!existingAdmin) {
                console.log('📝 Creating default admin user...');
                await db.run(
                    'INSERT INTO users (id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
                    [adminId, 'Administrator', adminEmail, adminPassword, 'Management', 'admin']
                );
                console.log('✓ Default admin user created');
                console.log(`  Email: ${adminEmail}`);
                console.log(`  Password: admin123`);

                // Create sample data on first initialization
                console.log('📝 Creating sample data...');
                await createSampleData(uuidv4);
                console.log('✓ Sample data created');
            } else {
                console.log('✓ Admin user already exists');
            }
        } catch (err) {
            console.warn('⚠️ Warning while creating admin user:', err.message);
            throw err;
        }

        console.log('✓ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    initializeDatabase().then(() => {
        require('./connection').close();
        process.exit(0);
    });
}

module.exports = { initializeDatabase };

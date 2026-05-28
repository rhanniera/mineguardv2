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
            'INSERT INTO reports (id, user_id, hazard_type, severity, location, description, affected_people, immediate_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [report1Id, worker1Id, 'Equipment Malfunction', 'High', 'Shaft B', 'Grinding equipment making unusual noise', 3, 'Stop operation immediately', 'open']
        );
        
        await db.run(
            'INSERT INTO reports (id, user_id, hazard_type, severity, location, description, affected_people, immediate_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
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

        // Drop existing tables to ensure clean schema migration
        const dropStatements = [
            'DROP TABLE IF EXISTS report_comments CASCADE',
            'DROP TABLE IF EXISTS notifications CASCADE',
            'DROP TABLE IF EXISTS reports CASCADE',
            'DROP TABLE IF EXISTS users CASCADE'
        ];

        for (const stmt of dropStatements) {
            try {
                await db.run(stmt);
                console.log(`✓ ${stmt.split(' ')[2]} dropped`);
            } catch (err) {
                console.log(`⚠️  Could not drop table: ${err.message}`);
            }
        }

        // Execute schema (split into individual statements) - PostgreSQL naming conventions
        const statements = [
            `CREATE TABLE users (
                id VARCHAR(255) PRIMARY KEY,
                name TEXT NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                department TEXT,
                role TEXT DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE reports (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                hazard_type TEXT NOT NULL,
                severity TEXT NOT NULL,
                location TEXT NOT NULL,
                description TEXT NOT NULL,
                affected_people INTEGER DEFAULT 0,
                immediate_action TEXT,
                status TEXT DEFAULT 'pending',
                submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE report_comments (
                id VARCHAR(255) PRIMARY KEY,
                report_id VARCHAR(255) NOT NULL,
                user_id VARCHAR(255) NOT NULL,
                comment TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE TABLE notifications (
                id VARCHAR(255) PRIMARY KEY,
                user_id VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                read SMALLINT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            `CREATE INDEX idx_reports_user_id ON reports(user_id)`,
            `CREATE INDEX idx_reports_status ON reports(status)`,
            `CREATE INDEX idx_reports_severity ON reports(severity)`,
            `CREATE INDEX idx_comments_report_id ON report_comments(report_id)`,
            `CREATE INDEX idx_notifications_user_id ON notifications(user_id)`,
            `CREATE INDEX idx_users_email ON users(email)`
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

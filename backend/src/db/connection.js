const { Pool } = require('pg');

// Parse DATABASE_URL or use default connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mineguard';

console.log('🔗 Initializing database connection...');
console.log('🔗 DATABASE_URL env var:', process.env.DATABASE_URL ? '✓ Set' : '✗ Not set');
if (process.env.DATABASE_URL) {
    // Mask password for logging
    const masked = process.env.DATABASE_URL.replace(/:[^:/@]*@/, ':****@');
    console.log('🔗 Connection string (masked):', masked);
} else {
    console.log('🔗 Using default localhost connection');
}

// Create connection pool
const pool = new Pool({
    connectionString,
    // For Railway SSL
    ...(process.env.DATABASE_URL && {
        ssl: { rejectUnauthorized: false }
    })
});

// Handle pool errors
pool.on('error', (err) => {
    console.error('🔴 Connection pool error:', {
        message: err.message,
        code: err.code
    });
});

pool.on('connect', () => {
    console.log('✓ New client connected to pool');
});

class Database {
    constructor() {
        this.connected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            console.log('🔌 Attempting database connection...');
            pool.connect((err, client, release) => {
                if (err) {
                    console.error('🔴 Connection error:', {
                        message: err.message,
                        code: err.code,
                        detail: err.detail,
                        errno: err.errno
                    });
                    reject(err);
                } else {
                    console.log('✓ Got client from pool, testing query...');
                    // Test the connection
                    client.query('SELECT NOW()', (queryErr, result) => {
                        release();
                        if (queryErr) {
                            console.error('🔴 Query test failed:', queryErr.message);
                            reject(queryErr);
                        } else {
                            console.log('✓ Database connection successful');
                            this.connected = true;
                            resolve();
                        }
                    });
                }
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc)
                let pgSql = sql;
                let paramIndex = 1;
                pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

                pool.query(pgSql, params, (err, result) => {
                    if (err) {
                        console.error('🔴 Query error:', {
                            message: err.message,
                            code: err.code,
                            detail: err.detail,
                            sql: pgSql.substring(0, 80)
                        });
                        reject(err);
                    } else {
                        resolve({
                            lastID: result.rows[0]?.id,
                            changes: result.rowCount
                        });
                    }
                });
            } catch (error) {
                console.error('🔴 Run method error:', error.message);
                reject(error);
            }
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                // Convert SQLite placeholders to PostgreSQL
                let pgSql = sql;
                let paramIndex = 1;
                pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

                pool.query(pgSql, params, (err, result) => {
                    if (err) {
                        console.error('🔴 Get query error:', {
                            message: err.message,
                            code: err.code,
                            sql: pgSql.substring(0, 80)
                        });
                        reject(err);
                    } else {
                        resolve(result.rows[0]);
                    }
                });
            } catch (error) {
                console.error('🔴 Get method error:', error.message);
                reject(error);
            }
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            try {
                // Convert SQLite placeholders to PostgreSQL
                let pgSql = sql;
                let paramIndex = 1;
                pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

                pool.query(pgSql, params, (err, result) => {
                    if (err) {
                        console.error('🔴 All query error:', {
                            message: err.message,
                            code: err.code,
                            sql: pgSql.substring(0, 80)
                        });
                        reject(err);
                    } else {
                        resolve(result.rows);
                    }
                });
            } catch (error) {
                console.error('🔴 All method error:', error.message);
                reject(error);
            }
        });
    }

    close() {
        return pool.end();
    }
}

module.exports = new Database();

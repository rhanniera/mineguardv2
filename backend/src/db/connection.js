const { Pool } = require('pg');

// Parse DATABASE_URL or use default connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mineguard';

// Create connection pool
const pool = new Pool({
    connectionString,
    // For Railway SSL
    ...(process.env.DATABASE_URL && {
        ssl: { rejectUnauthorized: false }
    })
});

class Database {
    constructor() {
        this.connected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            pool.query('SELECT 1', (err) => {
                if (err) {
                    console.error('❌ Database connection error:', {
                        message: err.message,
                        code: err.code,
                        detail: err.detail
                    });
                    reject(err);
                } else {
                    console.log('✓ Connected to PostgreSQL database');
                    this.connected = true;
                    resolve();
                }
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, etc)
            let pgSql = sql;
            let paramIndex = 1;
            pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

            pool.query(pgSql, params, (err, result) => {
                if (err) {
                    console.error('❌ Database error:', {
                        message: err.message,
                        code: err.code,
                        detail: err.detail,
                        sql: sql.substring(0, 100)
                    });
                    reject(err);
                } else {
                    resolve({
                        lastID: result.rows[0]?.id,
                        changes: result.rowCount
                    });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            // Convert SQLite placeholders to PostgreSQL
            let pgSql = sql;
            let paramIndex = 1;
            pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

            pool.query(pgSql, params, (err, result) => {
                if (err) {
                    console.error('❌ Database get error:', {
                        message: err.message,
                        code: err.code,
                        sql: sql.substring(0, 100)
                    });
                    reject(err);
                } else {
                    resolve(result.rows[0]);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            // Convert SQLite placeholders to PostgreSQL
            let pgSql = sql;
            let paramIndex = 1;
            pgSql = pgSql.replace(/\?/g, () => `$${paramIndex++}`);

            pool.query(pgSql, params, (err, result) => {
                if (err) {
                    console.error('❌ Database all error:', {
                        message: err.message,
                        code: err.code,
                        sql: sql.substring(0, 100)
                    });
                    reject(err);
                } else {
                    resolve(result.rows);
                }
            });
        });
    }

    close() {
        return pool.end();
    }
}

module.exports = new Database();

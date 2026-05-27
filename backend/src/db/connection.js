const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use /tmp for Railway or fallback to data directory
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
const DB_PATH = path.join(dataDir, 'mineguard.db');

class Database {
    constructor() {
        this.db = null;
        this.connected = false;
    }

    connect() {
        return new Promise((resolve, reject) => {
            // Ensure data directory exists
            try {
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true, mode: 0o755 });
                    console.log('✓ Created data directory:', dataDir);
                }
            } catch (err) {
                console.error('Warning: Could not create data directory:', err.message);
                // Continue anyway, might still work
            }

            this.db = new sqlite3.Database(DB_PATH, (err) => {
                if (err) {
                    console.error('Database connection error:', err);
                    reject(err);
                } else {
                    console.log('✓ Connected to database:', DB_PATH);
                    this.connected = true;
                    this.db.run('PRAGMA foreign_keys = ON', (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                }
            });
        });
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Database error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve(rows || []);
                }
            });
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) reject(err);
                    else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new Database();

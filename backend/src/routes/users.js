const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../db/connection');

// Helper function to hash passwords
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to verify passwords
function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

// GET all users (admin only)
router.get('/', async (req, res) => {
    try {
        const users = await db.all('SELECT id, name, email, department, role, createdAt FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

// GET specific user
router.get('/:id', async (req, res) => {
    try {
        const user = await db.get('SELECT id, name, email, department, role, createdAt FROM users WHERE id = ?', [req.params.id]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// POST create user (signup)
router.post('/', async (req, res) => {
    try {
        const { name, email, department, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user already exists
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const userId = uuidv4();
        const hashedPassword = hashPassword(password);

        await db.run(
            'INSERT INTO users (id, name, email, password, department, role) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, name, email, hashedPassword, department || null, 'user']
        );

        // Notify all admins of new user signup
        try {
            console.log('🔍 Checking for admin users...');
            const admins = await db.all('SELECT id FROM users WHERE role = ?', ['admin']);
            console.log(`✓ Found admins:`, admins);
            
            if (admins && admins.length > 0) {
                const notificationMessage = `📝 New user registered: ${name} (${email})`;
                console.log(`📬 Creating notifications for ${admins.length} admin(s)`);
                
                for (const admin of admins) {
                    const notifId = uuidv4();
                    console.log(`  → Creating notification for admin ${admin.id}`);
                    await db.run(
                        'INSERT INTO notifications (id, userId, message, type, read) VALUES (?, ?, ?, ?, 0)',
                        [notifId, admin.id, notificationMessage, 'user-signup']
                    );
                    console.log(`  ✓ Notification created with ID: ${notifId}`);
                }
                console.log(`✅ Sent new user notification to ${admins.length} admin(s)`);
            } else {
                console.log('⚠️ No admin users found!');
            }
        } catch (notificationError) {
            console.error('❌ Error creating notification:', notificationError);
            console.error('Full error details:', notificationError.message, notificationError.stack);
        }

        const user = { id: userId, name, email, department, role: 'user' };
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

// POST login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password required' });
        }

        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!verifyPassword(password, user.password)) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const { password: _, ...userWithoutPassword } = user;
        res.json({ message: 'Login successful', user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// PUT update user profile
router.put('/:id', async (req, res) => {
    try {
        const { name, department, password } = req.body;
        const userId = req.params.id;

        // Get current user
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prepare update query
        let updateFields = [];
        let updateValues = [];

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }
        if (department) {
            updateFields.push('department = ?');
            updateValues.push(department);
        }
        if (password) {
            updateFields.push('password = ?');
            updateValues.push(hashPassword(password));
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updateFields.push('updatedAt = CURRENT_TIMESTAMP');
        updateValues.push(userId);

        await db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const updatedUser = await db.get('SELECT id, name, email, department, role FROM users WHERE id = ?', [userId]);
        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
});

// DELETE user (and their reports/comments)
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user's reports and associated comments
        const reports = await db.all('SELECT id FROM reports WHERE userId = ?', [userId]);
        
        for (const report of reports) {
            await db.run('DELETE FROM report_comments WHERE reportId = ?', [report.id]);
        }
        
        await db.run('DELETE FROM reports WHERE userId = ?', [userId]);
        
        // Delete the user
        await db.run('DELETE FROM users WHERE id = ?', [userId]);
        
        console.log(`🗑️ User deleted: ${userId}, Reports deleted: ${reports.length}`);
        res.json({ message: 'User deleted successfully', reportsDeleted: reports.length });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

// POST make user admin
router.post('/:id/make-admin', async (req, res) => {
    try {
        const userId = req.params.id;

        const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await db.run('UPDATE users SET role = ? WHERE id = ?', ['admin', userId]);
        res.json({ message: 'User promoted to admin' });
    } catch (error) {
        res.status(500).json({ message: 'Error promoting user', error: error.message });
    }
});

module.exports = router;

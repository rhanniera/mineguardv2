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

// GET all users (with role filtering support)
router.get('/', async (req, res) => {
    try {
        const { role } = req.query; // Optional: ?role=admin or ?role=user
        
        let query = 'SELECT id, name, email, department, role, created_at, updated_at FROM users';
        let params = [];

        if (role) {
            query += ' WHERE role = ?';
            params.push(role);
        }

        query += ' ORDER BY created_at DESC';

        const users = await db.all(query, params);
        
        console.log(`📋 Fetched ${users.length} users${role ? ` (role: ${role})` : ''}`);

        res.json({ 
            success: true,
            message: 'Users retrieved successfully',
            code: 'USERS_RETRIEVED',
            count: users.length,
            users 
        });
    } catch (error) {
        console.error('❌ Error fetching users:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching users',
            code: 'FETCH_ERROR',
            error: error.message 
        });
    }
});

// GET specific user
router.get('/:id', async (req, res) => {
    try {
        const user = await db.get(
            'SELECT id, name, email, department, role, created_at, updated_at FROM users WHERE id = ?', 
            [req.params.id]
        );
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND',
                userId: req.params.id
            });
        }

        res.json({ 
            success: true,
            message: 'User retrieved successfully',
            code: 'USER_RETRIEVED',
            user 
        });
    } catch (error) {
        console.error('❌ Error fetching user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error fetching user',
            code: 'FETCH_ERROR',
            error: error.message 
        });
    }
});

// POST create user (signup) - with validation
router.post('/', async (req, res) => {
    try {
        const { name, email, department, password } = req.body;

        // ========================================
        // STEP 1: Validate required fields
        // ========================================
        if (!name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required fields',
                code: 'VALIDATION_ERROR',
                details: 'Required fields: name, email, password'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format',
                code: 'INVALID_EMAIL',
                details: 'Please provide a valid email address'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password too short',
                code: 'PASSWORD_TOO_SHORT',
                details: 'Password must be at least 6 characters long'
            });
        }

        // ========================================
        // STEP 2: Check if user already exists
        // ========================================
        const existingUser = await db.get('SELECT id, email FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already registered',
                code: 'EMAIL_ALREADY_EXISTS',
                details: `The email "${email}" is already registered in the system`
            });
        }

        // ========================================
        // STEP 3: Create new user
        // ========================================
        const userId = uuidv4();
        const hashedPassword = hashPassword(password);

        await db.run(
            'INSERT INTO users (id, name, email, password, department, role, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
            [userId, name, email, hashedPassword, department || null, 'user']
        );

        console.log(`✅ New user created: ${name} (${email})`);

        // ========================================
        // STEP 4: Notify admins of new signup
        // ========================================
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
                        'INSERT INTO notifications (id, user_id, message, type, read, created_at) VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)',
                        [notifId, admin.id, notificationMessage, 'user-signup']
                    );
                    console.log(`  ✓ Notification created with ID: ${notifId}`);
                }
                console.log(`✅ Sent new user notification to ${admins.length} admin(s)`);
            } else {
                console.log('⚠️ No admin users found - skipping notifications');
            }
        } catch (notificationError) {
            console.error('❌ Error creating notification:', notificationError);
            // Don't fail the user creation if notification fails
        }

        const user = { id: userId, name, email, department, role: 'user' };
        res.status(201).json({ 
            success: true,
            message: 'User created successfully',
            code: 'USER_CREATED',
            user 
        });
    } catch (error) {
        console.error('❌ Error creating user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error creating user',
            code: 'CREATE_ERROR',
            error: error.message 
        });
    }
});

// POST login - with enhanced response
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Email and password required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // Find user
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password',
                code: 'AUTH_FAILED'
            });
        }

        // Verify password
        if (!verifyPassword(password, user.password)) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password',
                code: 'AUTH_FAILED'
            });
        }

        // Login successful - return user without password
        const { password: _, ...userWithoutPassword } = user;
        
        console.log(`✅ User logged in: ${user.name} (${user.email}) - Role: ${user.role}`);
        
        res.json({ 
            success: true,
            message: 'Login successful',
            code: 'LOGIN_SUCCESS',
            user: userWithoutPassword 
        });
    } catch (error) {
        console.error('❌ Error logging in:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error logging in',
            code: 'LOGIN_ERROR',
            error: error.message 
        });
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

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
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

// DELETE user (with Admin protection)
// VALIDATION: IF user.role == "Admin" THEN DENY deletion ELSE ALLOW deletion
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // ========================================
        // STEP 1: Find the user
        // ========================================
        const user = await db.get('SELECT id, role, name, email FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // ========================================
        // STEP 2: Administrator Protection
        // ========================================
        if (user.role === 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Error: Cannot delete Administrator account',
                code: 'ADMIN_PROTECTION_VIOLATION',
                details: `The user "${user.name}" (${user.email}) is an Administrator and cannot be deleted. System must always maintain at least one Administrator account.`
            });
        }

        // ========================================
        // STEP 3: Delete user's related data (cascading)
        // ========================================
        // Delete comments on user's reports
        const reports = await db.all('SELECT id FROM reports WHERE user_id = ?', [userId]);
        
        for (const report of reports) {
            await db.run('DELETE FROM report_comments WHERE report_id = ?', [report.id]);
        }
        
        // Delete notifications for the user
        await db.run('DELETE FROM notifications WHERE user_id = ?', [userId]);
        
        // Delete user's reports
        await db.run('DELETE FROM reports WHERE user_id = ?', [userId]);
        
        // ========================================
        // STEP 4: Delete the user account
        // ========================================
        await db.run('DELETE FROM users WHERE id = ?', [userId]);
        
        console.log(`✅ User deleted: ${user.name} (${user.email})`);
        console.log(`   - Reports deleted: ${reports.length}`);
        console.log(`   - Associated data cleaned up`);
        
        res.json({ 
            success: true,
            message: 'User deleted successfully',
            code: 'USER_DELETED',
            details: {
                userId: userId,
                userName: user.name,
                userEmail: user.email,
                reportsDeleted: reports.length
            }
        });
    } catch (error) {
        console.error('❌ Error deleting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error deleting user',
            code: 'DELETE_ERROR',
            error: error.message 
        });
    }
});

// PUT update user profile (with Admin role protection)
router.put('/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, department, password, role } = req.body;

        // ========================================
        // STEP 1: Get current user
        // ========================================
        const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // ========================================
        // STEP 2: Admin Role Protection
        // ========================================
        if (user.role === 'admin' && role && role !== 'admin') {
            return res.status(403).json({ 
                success: false,
                message: 'Error: Cannot change Administrator role',
                code: 'ADMIN_ROLE_PROTECTION_VIOLATION',
                details: 'Administrator accounts cannot be downgraded or have their role changed. The system must always maintain an Administrator account.'
            });
        }

        // ========================================
        // STEP 3: Prepare update
        // ========================================
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
        if (role && (user.role !== 'admin' || role === 'admin')) {
            // Can only change role if not admin, or if keeping admin role
            updateFields.push('role = ?');
            updateValues.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No fields to update',
                code: 'NO_UPDATES'
            });
        }

        updateFields.push('updatedAt = CURRENT_TIMESTAMP');
        updateValues.push(userId);

        // ========================================
        // STEP 4: Execute update
        // ========================================
        await db.run(
            `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        const updatedUser = await db.get(
            'SELECT id, name, email, department, role, createdAt, updatedAt FROM users WHERE id = ?', 
            [userId]
        );

        console.log(`✅ User updated: ${updatedUser.name}`);
        
        res.json({ 
            success: true,
            message: 'User updated successfully',
            code: 'USER_UPDATED',
            user: updatedUser 
        });
    } catch (error) {
        console.error('❌ Error updating user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error updating user',
            code: 'UPDATE_ERROR',
            error: error.message 
        });
    }
});

// POST make user admin (with Admin count protection)
router.post('/:id/make-admin', async (req, res) => {
    try {
        const userId = req.params.id;

        // ========================================
        // STEP 1: Find the user
        // ========================================
        const user = await db.get('SELECT id, role, name, email FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // If already admin, no change needed
        if (user.role === 'admin') {
            return res.status(400).json({ 
                success: false,
                message: 'User is already an Administrator',
                code: 'ALREADY_ADMIN'
            });
        }

        // ========================================
        // STEP 2: Promote to admin
        // ========================================
        await db.run('UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['admin', userId]);

        const updatedUser = await db.get(
            'SELECT id, name, email, department, role FROM users WHERE id = ?', 
            [userId]
        );

        console.log(`✅ User promoted to Admin: ${updatedUser.name}`);
        
        res.json({ 
            success: true,
            message: 'User promoted to Administrator',
            code: 'PROMOTED_TO_ADMIN',
            user: updatedUser 
        });
    } catch (error) {
        console.error('❌ Error promoting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error promoting user',
            code: 'PROMOTION_ERROR',
            error: error.message 
        });
    }
});

// POST demote admin to user (with Admin protection)
router.post('/:id/demote', async (req, res) => {
    try {
        const userId = req.params.id;

        // ========================================
        // STEP 1: Find the user
        // ========================================
        const user = await db.get('SELECT id, role, name, email FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found',
                code: 'USER_NOT_FOUND'
            });
        }

        // ========================================
        // STEP 2: Admin Role Protection
        // ========================================
        if (user.role === 'admin') {
            // Check if this is the last admin
            const adminCount = await db.get('SELECT COUNT(*) as admin_count FROM users WHERE role = ?', ['admin']);
            if ((adminCount?.admin_count || 0) <= 1) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Error: Cannot demote the last Administrator',
                    code: 'ADMIN_COUNT_PROTECTION_VIOLATION',
                    details: 'The system must always maintain at least one Administrator account. Cannot demote the last admin.'
                });
            }
        }

        // If already user, no change needed
        if (user.role === 'user') {
            return res.status(400).json({ 
                success: false,
                message: 'User is already a regular User',
                code: 'ALREADY_USER'
            });
        }

        // ========================================
        // STEP 3: Demote to user
        // ========================================
        await db.run('UPDATE users SET role = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', ['user', userId]);

        const updatedUser = await db.get(
            'SELECT id, name, email, department, role FROM users WHERE id = ?', 
            [userId]
        );

        console.log(`✅ User demoted to regular User: ${updatedUser.name}`);
        
        res.json({ 
            success: true,
            message: 'User demoted to regular User',
            code: 'DEMOTED_TO_USER',
            user: updatedUser 
        });
    } catch (error) {
        console.error('❌ Error demoting user:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error demoting user',
            code: 'DEMOTION_ERROR',
            error: error.message 
        });
    }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

// GET all notifications for current user
router.get('/', async (req, res) => {
    try {
        // Get userId from query params (frontend will send it)
        const { userId } = req.query;
        
        if (!userId) {
            console.log('⚠️ No userId provided in notifications request');
            return res.status(400).json({ message: 'userId is required' });
        }

        console.log(`📬 Fetching notifications for user: ${userId}`);
        const notifications = await db.all(
            `SELECT id, userId, message, type, read, createdAt FROM notifications 
             WHERE userId = ? 
             ORDER BY createdAt DESC 
             LIMIT 50`,
            [userId]
        );

        console.log(`✓ Found ${notifications ? notifications.length : 0} notifications`);
        res.json(notifications || []);
    } catch (error) {
        console.error('❌ Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// GET unread notification count for current user
router.get('/count/unread', async (req, res) => {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const result = await db.get(
            'SELECT COUNT(*) as count FROM notifications WHERE userId = ? AND read = 0',
            [userId]
        );

        res.json({ unread: result?.count || 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error getting unread count', error: error.message });
    }
});

// PUT mark notification as read
router.put('/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;

        const notification = await db.get('SELECT id FROM notifications WHERE id = ?', [notificationId]);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [notificationId]);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

// PUT mark all notifications as read
router.put('/mark/all-read', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        await db.run('UPDATE notifications SET read = 1 WHERE userId = ?', [userId]);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
});

// POST create notification (internal use - no auth required)
router.post('/', async (req, res) => {
    try {
        const { userId, message, type } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ message: 'userId and message are required' });
        }

        const notificationId = uuidv4();
        await db.run(
            'INSERT INTO notifications (id, userId, message, type, read) VALUES (?, ?, ?, ?, 0)',
            [notificationId, userId, message, type || 'info']
        );

        res.status(201).json({ message: 'Notification created', id: notificationId });
    } catch (error) {
        res.status(500).json({ message: 'Error creating notification', error: error.message });
    }
});

module.exports = router;

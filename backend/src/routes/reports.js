const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/connection');

// GET all reports with optional filters
router.get('/', async (req, res) => {
    try {
        const { status, severity, userId } = req.query;
        let query = 'SELECT * FROM reports';
        let params = [];
        let conditions = [];

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }
        if (severity) {
            conditions.push('severity = ?');
            params.push(severity);
        }
        if (userId) {
            conditions.push('user_id = ?');
            params.push(userId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY submitted_date DESC';

        const reports = await db.all(query, params);
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
    }
});

// GET specific report
router.get('/:id', async (req, res) => {
    try {
        const report = await db.get('SELECT * FROM reports WHERE id = ?', [req.params.id]);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Get associated comments
        const comments = await db.all(
            'SELECT rc.id, rc.user_id, rc.comment, rc.created_at, u.name FROM report_comments rc JOIN users u ON rc.user_id = u.id WHERE rc.report_id = ? ORDER BY rc.created_at DESC',
            [req.params.id]
        );

        res.json({ ...report, comments });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
});

// POST create new report
router.post('/', async (req, res) => {
    try {
        const {
            userId,
            hazardType,
            severity,
            location,
            description,
            affectedPeople,
            immediateAction,
            status
        } = req.body;

        if (!userId || !hazardType || !severity || !location || !description) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const reportId = uuidv4();
        await db.run(
            'INSERT INTO reports (id, user_id, hazard_type, severity, location, description, affected_people, immediate_action, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [reportId, userId, hazardType, severity, location, description, affectedPeople || 0, immediateAction || null, status || 'pending']
        );

        // Notify all admins of new hazard report
        try {
            const admins = await db.all('SELECT id FROM users WHERE role = ?', ['admin']);
            if (admins && admins.length > 0) {
                const notificationMessage = `🚨 New hazard reported: ${hazardType} (${severity.toUpperCase()}) at ${location}`;
                for (const admin of admins) {
                    await db.run(
                        'INSERT INTO notifications (id, user_id, message, type, read) VALUES (?, ?, ?, ?, 0)',
                        [uuidv4(), admin.id, notificationMessage, 'hazard-report']
                    );
                }
                console.log(`📬 Sent hazard notification to ${admins.length} admin(s)`);
            }
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Don't fail the report if notification fails
        }

        const report = await db.get('SELECT * FROM reports WHERE id = ?', [reportId]);
        res.status(201).json({ message: 'Report created successfully', report });
    } catch (error) {
        res.status(500).json({ message: 'Error creating report', error: error.message });
    }
});

// PUT update report
router.put('/:id', async (req, res) => {
    try {
        const { status, severity, immediateAction } = req.body;
        const reportId = req.params.id;

        const report = await db.get('SELECT id, user_id FROM reports WHERE id = ?', [reportId]);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        let updateFields = [];
        let updateValues = [];

        if (status !== undefined) {
            updateFields.push('status = ?');
            updateValues.push(status);
        }
        if (severity !== undefined) {
            updateFields.push('severity = ?');
            updateValues.push(severity);
        }
        if (immediateAction !== undefined) {
            updateFields.push('immediate_action = ?');
            updateValues.push(immediateAction);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(reportId);

        await db.run(
            `UPDATE reports SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );

        // Notify user if status changed
        if (status !== undefined) {
            try {
                const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
                const notificationMessage = `📋 Your hazard report (#${reportId.substring(0, 8)}) status has been changed to: ${statusLabel}`;
                await db.run(
                    'INSERT INTO notifications (id, user_id, message, type, read) VALUES (?, ?, ?, ?, 0)',
                    [uuidv4(), report.user_id, notificationMessage, 'status-change']
                );
                console.log(`📬 Sent status change notification to user: ${report.user_id}`);
            } catch (notificationError) {
                console.error('Error creating status change notification:', notificationError);
                // Don't fail the update if notification fails
            }
        }

        const updatedReport = await db.get('SELECT * FROM reports WHERE id = ?', [reportId]);
        res.json({ message: 'Report updated successfully', report: updatedReport });
    } catch (error) {
        res.status(500).json({ message: 'Error updating report', error: error.message });
    }
});

// DELETE report
router.delete('/:id', async (req, res) => {
    try {
        const reportId = req.params.id;

        const report = await db.get('SELECT id FROM reports WHERE id = ?', [reportId]);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Delete associated comments first
        await db.run('DELETE FROM report_comments WHERE report_id = ?', [reportId]);

        // Delete report
        await db.run('DELETE FROM reports WHERE id = ?', [reportId]);

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting report', error: error.message });
    }
});

// POST add comment to report
router.post('/:id/comments', async (req, res) => {
    try {
        const { userId, comment } = req.body;
        const reportId = req.params.id;

        if (!userId || !comment) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const report = await db.get('SELECT id FROM reports WHERE id = ?', [reportId]);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const commentId = uuidv4();
        await db.run(
            'INSERT INTO report_comments (id, report_id, user_id, comment) VALUES (?, ?, ?, ?)',
            [commentId, reportId, userId, comment]
        );

        const newComment = await db.get(
            'SELECT rc.id, rc.user_id, rc.comment, rc.created_at, u.name FROM report_comments rc JOIN users u ON rc.user_id = u.id WHERE rc.id = ?',
            [commentId]
        );

        res.status(201).json({ message: 'Comment added successfully', comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
});

// GET report comments
router.get('/:id/comments', async (req, res) => {
    try {
        const reportId = req.params.id;

        const report = await db.get('SELECT id FROM reports WHERE id = ?', [reportId]);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const comments = await db.all(
            'SELECT rc.id, rc.user_id, rc.comment, rc.created_at, u.name FROM report_comments rc JOIN users u ON rc.user_id = u.id WHERE rc.report_id = ? ORDER BY rc.created_at DESC',
            [reportId]
        );

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching comments', error: error.message });
    }
});

// GET dashboard stats
router.get('/stats/summary', async (req, res) => {
    try {
        const total = await db.get('SELECT COUNT(*) as count FROM reports');
        const pending = await db.get('SELECT COUNT(*) as count FROM reports WHERE status = ?', ['pending']);
        const resolved = await db.get('SELECT COUNT(*) as count FROM reports WHERE status = ?', ['resolved']);
        const critical = await db.get('SELECT COUNT(*) as count FROM reports WHERE severity = ?', ['critical']);

        res.json({
            totalReports: total.count,
            pendingReports: pending.count,
            resolvedReports: resolved.count,
            criticalReports: critical.count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
});

module.exports = router;

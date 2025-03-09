const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all notifications
router.get('/', (req, res) => {
    db.query('SELECT * FROM notifications', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get notifications by user ID
router.get('/user/:userId', (req, res) => {
    const { userId } = req.params;
    db.query('SELECT * FROM notifications WHERE user_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Create new notification
router.post('/', (req, res) => {
    const { user_id, message, is_read } = req.body;
    if (!user_id || !message) {
        return res.status(400).json({ error: 'User ID and message are required' });
    }
    
    db.query('INSERT INTO notifications (user_id, message, is_read) VALUES (?, ?, ?)',
        [user_id, message, is_read || false],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
            res.json({ message: 'Notification created successfully', notificationId: result.insertId });
        });
});

// Update notification (mark as read and/or update message)
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { is_read, message } = req.body;

    // Cek apakah notifikasi ada sebelum diperbarui
    db.query('SELECT * FROM notifications WHERE notification_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const oldData = result[0];

        console.log("Request Body:", req.body);
        console.log("Old Data:", oldData);

        // Jika data tidak dikirim dalam request, gunakan data lama
        const updatedIsRead = is_read !== undefined ? is_read : oldData.is_read;
        const updatedMessage = message !== undefined ? message : oldData.message;

        console.log("Updated Data:", {
            is_read: updatedIsRead,
            message: updatedMessage
        });

        db.query(
            'UPDATE notifications SET is_read=?, message=? WHERE notification_id=?',
            [updatedIsRead, updatedMessage, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });

                if (result.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes made to the notification' });
                }

                res.json({ message: 'Notification updated successfully' });
            }
        );
    });
});


// Delete notification
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    db.query('SELECT * FROM notifications WHERE notification_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        
        db.query('DELETE FROM notifications WHERE notification_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
            res.json({ message: 'Notification deleted successfully' });
        });
    });
});

module.exports = router;

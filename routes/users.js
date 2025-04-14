const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

router.get('/me', verifyToken, (req, res) => {
  res.json({
    message: 'Welcome!',
    user: req.user
  });
});


// Get all users
router.get('/', (req, res) => {
    db.query('SELECT * FROM users', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get user by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM users WHERE user_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(result[0]);
    });
});

// Create new user
router.post('/', (req, res) => {
    const { name, email, password, phone_number, role } = req.body;
    if (!name || !email || !password || !phone_number || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    db.query('INSERT INTO users (name, email, password, phone_number, role) VALUES (?, ?, ?, ?, ?)',
        [name, email, password, phone_number, role],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
            res.json({ message: 'User created successfully', userId: result.insertId });
        });
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, email, password, phone_number, role } = req.body;

    db.query('SELECT * FROM users WHERE user_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const oldData = result[0];

        console.log("Request Body:", req.body);
        console.log("Old Data:", oldData);

        const updatedName = name !== undefined ? name : oldData.name;
        const updatedEmail = email !== undefined ? email : oldData.email;
        const updatedPassword = password !== undefined ? password : oldData.password;
        const updatedPhoneNumber = phone_number !== undefined ? phone_number : oldData.phone_number;
        const updatedRole = role !== undefined ? role : oldData.role;

        console.log("Updated Data:", {
            name: updatedName,
            email: updatedEmail,
            password: updatedPassword,
            phone_number: updatedPhoneNumber,
            role: updatedRole
        });

        db.query(
            'UPDATE users SET name=?, email=?, password=?, phone_number=?, role=? WHERE user_id=?',
            [updatedName, updatedEmail, updatedPassword, updatedPhoneNumber, updatedRole, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });

                if (result.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes made to the user' });
                }

                res.json({ message: 'User updated successfully' });
            }
        );
    });
});


// Delete user
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Cek apakah user ada sebelum menghapus
    db.query('SELECT * FROM users WHERE user_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        db.query('DELETE FROM users WHERE user_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
            res.json({ message: 'User deleted successfully' });
        });
    });
});

module.exports = router;

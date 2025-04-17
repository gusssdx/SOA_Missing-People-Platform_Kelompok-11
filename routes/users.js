const express = require('express');
const router = express.Router();
const db = require('../db');
const verifyToken = require('../middleware/verifyToken');

router.get('/me', verifyToken, (req, res) => {
    console.log('User ID:', req.user.user_id);


    const userId = req.user.user_id;

    db.query('SELECT name, email, phone_number FROM users WHERE user_id = ?', [userId], (err, result) => {
        if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({ error: 'Database query error', details: err });
        }

        if (result.length === 0) {
            console.log('User not found');
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('User data back:', result[0]);
        res.json({
            message: 'User data retrieved successfully',
            user: result[0]
        });
    });
});
  
  // Update current logged-in user
  router.put('/me', verifyToken, (req, res) => {
    console.log('verifyToken success:', req.user); // Cek di console apakah token valid dan berhasil ter-decode
      const userId = req.user.user_id;
      const { name, email, phone_number } = req.body;
    
      db.query('SELECT * FROM users WHERE user_id = ?', [userId], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) return res.status(404).json({ error: 'User not found' });
    
        const oldData = result[0];
    
        const updatedName = name !== undefined ? name : oldData.name;
        const updatedEmail = email !== undefined ? email : oldData.email;
        const updatedPhoneNumber = phone_number !== undefined ? phone_number : oldData.phone_number;
    
        db.query(
          'UPDATE users SET name=?, email=?, phone_number=? WHERE user_id=?',
          [updatedName, updatedEmail, updatedPhoneNumber, userId],
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

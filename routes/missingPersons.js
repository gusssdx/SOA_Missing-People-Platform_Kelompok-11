const express = require('express');
const router = express.Router();
const { uploadMissing } = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const multer = require('multer');
const db = require('../db');


// Get all missing persons
router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM missing_persons');
      res.json(rows);
    } catch (error) {
      console.error('Error fetching missing persons:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Get missing person by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM missing_persons WHERE missing_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Missing person not found" });
        }
        res.json(result[0]);
    });
});

// Create new missing person in reports page
router.post('/', verifyToken, uploadMissing.single('photo_url'), async (req, res) => {
  console.log("Isi req.user =>", req.user); // DEBUG

  const {
    full_name, age, gender, height, weight,
    last_seen_location, last_seen_date
  } = req.body;

  const photoPath = req.file ? req.file.path : null;
  const userId = req.user.user_id; // ← PERBAIKAN DI SINI

  try {
    await db.query(`
      INSERT INTO missing_persons 
      (user_id, full_name, age, gender, height, weight, last_seen_location, last_seen_date, photo_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, full_name, age, gender, height, weight, last_seen_location, last_seen_date, photoPath]);

    res.status(201).json({ message: 'Missing person report submitted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error while creating report.' });
  }
});

// Update missing person details
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { full_name, age, gender, height, weight, last_seen_location, last_seen_date, photo_url, status } = req.body;

    db.query('SELECT * FROM missing_persons WHERE missing_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Missing person not found' });
        }

        const oldData = result[0];

        console.log("Request Body:", req.body);
        console.log("Old Data:", oldData);

        // Jika field tidak dikirim, gunakan nilai lama
        const updatedFullName = full_name !== undefined ? full_name : oldData.full_name;
        const updatedAge = age !== undefined ? age : oldData.age;
        const updatedGender = gender !== undefined ? gender : oldData.gender;
        const updateHeight = height !== undefined ? height : oldData.height;
        const updateWeight = weight !== undefined ? weight : oldData.weight;
        const updatedLastSeenLocation = last_seen_location !== undefined ? last_seen_location : oldData.last_seen_location;
        const updatedLastSeenDate = last_seen_date !== undefined ? last_seen_date : oldData.last_seen_date;
        const updatedPhotoUrl = photo_url !== undefined ? photo_url : oldData.photo_url;
        const updatedStatus = status !== undefined ? status : oldData.status;

        console.log("Updated Data:", {
            full_name: updatedFullName,
            age: updatedAge,
            gender: updatedGender,
            height: updateHeight,
            weight: updateWeight,
            last_seen_location: updatedLastSeenLocation,
            last_seen_date: updatedLastSeenDate,
            photo_url: updatedPhotoUrl,
            status: updatedStatus
        });

        db.query(
            'UPDATE missing_persons SET full_name=?, age=?, gender=?, height=?, weight=?, last_seen_location=?, last_seen_date=?, photo_url=?, status=? WHERE missing_id=?',
            [updatedFullName, updatedAge, updatedGender, updateHeight, updateWeight, updatedLastSeenLocation, updatedLastSeenDate, updatedPhotoUrl, updatedStatus, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });

                if (result.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes made to the missing person' });
                }

                res.json({ message: 'Missing person updated successfully' });
            }
        );
    });
});

// Delete missing person
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Cek apakah data ada sebelum menghapus
    db.query('SELECT * FROM missing_persons WHERE missing_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Missing person not found' });
        }

        db.query('DELETE FROM missing_persons WHERE missing_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
            res.json({ message: 'Missing person deleted successfully' });
        });
    });
});

module.exports = router;

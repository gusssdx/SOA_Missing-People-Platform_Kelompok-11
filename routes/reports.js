const express = require('express');
const router = express.Router();
const { reportMissing } = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const db = require('../db');

// Get all reports
router.get('/', (req, res) => {
    db.query('SELECT * FROM reports', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get report by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM reports WHERE report_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Report not found" });
        }
        res.json(result[0]);
    });
});

// POST /reports
router.post('/', verifyToken, reportMissing.single('photo'), async (req, res) => {
    const { user_id, missing_id, description } = req.body;
    const photo = req.file;
  
    if (!user_id || !missing_id || !description || !photo) {
      return res.status(400).json({ message: 'Semua field wajib diisi.' });
    }
  
    try {
      const photoUrl = `uploads/report-missing-photos/${photo.filename}`;
  
      await db.query(
        `INSERT INTO reports (user_id, missing_id, description, photo_url, status) VALUES (?, ?, ?, ?, ?)`,
        [user_id, missing_id, description, photoUrl, 'pending']
      );
  
      res.status(201).json({ message: 'Laporan berhasil disimpan.' });
    } catch (error) {
      console.error('Error menyimpan laporan:', error);
      res.status(500).json({ message: 'Gagal menyimpan laporan.' });
    }
  });
  

// Update report
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { description, status } = req.body;

    // Cek apakah report ada sebelum melakukan update
    db.query('SELECT * FROM reports WHERE report_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        const oldData = result[0];

        console.log("Request Body:", req.body);
        console.log("Old Data:", oldData);

        // Jika data tidak dikirim dalam request, gunakan data lama
        const updatedDescription = description !== undefined ? description : oldData.description;
        const updatedStatus = status !== undefined ? status : oldData.status;

        console.log("Updated Data:", {
            description: updatedDescription,
            status: updatedStatus
        });

        db.query(
            'UPDATE reports SET description=?, status=? WHERE report_id=?',
            [updatedDescription, updatedStatus, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });

                if (result.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes made to the report' });
                }

                res.json({ message: 'Report updated successfully' });
            }
        );
    });
});

// Delete report
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Cek apakah report ada sebelum menghapus
    db.query('SELECT * FROM reports WHERE report_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Report not found' });
        }

        db.query('DELETE FROM reports WHERE report_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
            res.json({ message: 'Report deleted successfully' });
        });
    });
});

module.exports = router;

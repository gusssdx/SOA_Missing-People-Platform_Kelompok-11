const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all claims
router.get('/', (req, res) => {
    db.query('SELECT * FROM claims', (err, results) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        res.json(results);
    });
});

// Get claim by ID
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM claims WHERE claim_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: "Claim not found" });
        }
        res.json(result[0]);
    });
});

// Create new claim
router.post('/', (req, res) => {
    const { user_id, found_id, relationship, evidence_url, found_location, status } = req.body;

    if (!user_id || !found_id || !relationship || !evidence_url || !found_location || !status) {
        return res.status(400).json({ error: "All fields are required" });
    }

    db.query(
        'INSERT INTO claims (user_id, found_id, relationship, evidence_url, found_location, status) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, found_id, relationship, evidence_url, found_location, status],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database insertion error', details: err });
            res.json({ message: 'Claim created successfully', claimId: result.insertId });
        }
    );
});

// Update claim
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { relationship, evidence_url, found_location, status } = req.body;

    // Cek apakah klaim ada sebelum diperbarui
    db.query('SELECT * FROM claims WHERE claim_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        const oldData = result[0];

        console.log("Request Body:", req.body);
        console.log("Old Data:", oldData);

        // Jika data tidak dikirim dalam request, gunakan data lama
        const updatedRelationship = relationship !== undefined ? relationship : oldData.relationship;
        const updatedEvidenceUrl = evidence_url !== undefined ? evidence_url : oldData.evidence_url;
        const updatedFoundLocation = found_location !== undefined ? found_location : oldData.found_location;
        const updatedStatus = status !== undefined ? status : oldData.status;

        console.log("Updated Data:", {
            relationship: updatedRelationship,
            evidence_url: updatedEvidenceUrl,
            found_location: updatedFoundLocation,
            status: updatedStatus
        });

        db.query(
            'UPDATE claims SET relationship=?, evidence_url=?, found_location=?, status=? WHERE claim_id=?',
            [updatedRelationship, updatedEvidenceUrl, updatedFoundLocation, updatedStatus, id],
            (err, result) => {
                if (err) return res.status(500).json({ error: 'Database update error', details: err });

                if (result.affectedRows === 0) {
                    return res.status(400).json({ error: 'No changes made to the claim' });
                }

                res.json({ message: 'Claim updated successfully' });
            }
        );
    });
});

// Delete claim
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // Cek apakah klaim ada sebelum menghapus
    db.query('SELECT * FROM claims WHERE claim_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Claim not found' });
        }

        db.query('DELETE FROM claims WHERE claim_id = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
            res.json({ message: 'Claim deleted successfully' });
        });
    });
});

module.exports = router;

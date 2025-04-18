const express = require('express');
const { uploadFound } = require('../middleware/upload');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const db = require('../db');

// Get all found persons
router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM found_persons')
      res.json(rows);
    } catch (error) {
      console.error('Error fetching found persons:', error.message);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

// Get found person by ID (with async/await)
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM found_persons WHERE found_id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database query error', details: err });
  }
});

// Create new found person in reports page
router.post('/', verifyToken, uploadFound.single('photo_url'), async (req, res) => {
  console.log("Isi req.user =>", req.user); // DEBUG
    const { 
      found_location, found_date, description 
    } = req.body;

    const photoPath = req.file ? req.file.path : null;
    const userId = req.user.user_id; 
  
    try {
      await db.query(`
        INSERT INTO found_persons 
        (user_id, found_location, found_date, description, photo_url)
        VALUES (?, ?, ?, ?, ?)
      `, [userId, found_location, found_date, description, photoPath]);
  
      res.status(201).json({ message: 'Found person report submitted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error while creating report.' });
    }
  });


// Update found person status
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { found_location, found_date, photo_url, description, status } = req.body;

    db.query('select * FROM found_persons  WHERE found_id=?', [id], (err,result) => {
        if (err) return res.status(505).json({error: 'Database query error', details: err});
        if (result.length === 0) {
            return res.status(404).json({ err: 'Found person not found' });
        }

        const oldData = result[0];

        console.log("Request body: ", req.body);
        console.log("Old Data: ", oldData);

        const updateFoundLocation = found_location !== undefined ? found_location : oldData.found_location;
        const updateFoundDate = found_date !== undefined ? found_date : oldData.found_date;
        const updatePhotoUrl = photo_url !== undefined ? photo_url : oldData.photo_url;
        const updateDescription = description !== undefined ? description : oldData.description;
        const updateStatus = status !== undefined ? status : oldData.status;

        console.log("Update Data: ", {
            found_location: updateFoundLocation,
            found_date: updateFoundDate,
            photo_url: updatePhotoUrl,
            description: updateDescription,
            status: updateStatus
        });

        db.query(
            'UPDATE found_persons SET found_location=?, found_date=?, photo_url=?, description=?, status=? WHERE found_id=?',
            [updateFoundLocation, updateFoundDate, updatePhotoUrl, updateDescription, updateStatus, id],
            (err, result) => {
                if (err) return res.status(500).json({error: 'Database update error', details: err});
                if(result.affectedRows === 0){
                    return res.status(404).json({error: 'No change made to the found persons'});
                }
                res.json({message: ' Found person update successfully'});
            }
        );


        });
});


// Delete found person
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM found_persons WHERE found_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database query error', details: err });
        if (result.length === 0) {
            return res.status(404).json({ error: 'Found person not found' });
        }

    db.query('DELETE FROM found_persons WHERE found_id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database deletion error', details: err });
        res.json({ message: 'Found person record deleted successfully' });
         });
    });
});


module.exports = router;

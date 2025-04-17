const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function verifyToken(req, res, next) {
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) {
      return res.status(403).json({ error: 'Token not provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
          return res.status(401).json({ error: 'Invalid or expired token' });
      }

      req.user = decoded; // Simpan decoded token ke dalam request
      next();
      
      console.log('Token:', token);
      console.log('Decoded:', decoded);
  });
};

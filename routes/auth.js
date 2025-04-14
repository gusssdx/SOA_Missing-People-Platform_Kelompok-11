const express = require('express');
const router = express.Router();
const db = require('../db'); // pastikan path ini sesuai struktur folder kamu
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [results] = await db.promise().query('SELECT * FROM users WHERE email = ?', [email]);

    if (results.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = results[0];

    // Gunakan bcrypt.compare untuk validasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Buat token
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({ token, user: { name: user.name, role: user.role } });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

  
// registrasi
router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  try {
    // Cek apakah email sudah digunakan
    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user ke database
    await db.promise().query(
      "INSERT INTO users (name, email, phone_number, password, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, phone, hashedPassword, "reporter"]
    );

    res.status(201).json({ message: "User berhasil didaftarkan" });
  } catch (err) {
    console.error("Error during register:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ============ GOOGLE OAUTH STRATEGY ============
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const name = profile.displayName;

    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);

    let user;
    if (existingUser.length > 0) {
      user = existingUser[0];
    } else {
      await db.promise().query(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, 'oauth', "reporter"]
      );
      const [newUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
      user = newUser[0];
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// ============ GOOGLE OAUTH ROUTES ============
router.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

router.get('/auth/google/callback', passport.authenticate('google', {
  session: false,
  failureRedirect: '/login' // Ganti dengan route login kamu
}), (req, res) => {
  const user = req.user;

  // Buat JWT token untuk user yang berhasil login via Google
  const token = jwt.sign(
    { user_id: user.user_id, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );

  // Kirim token ke frontend (misalnya redirect dengan token di query param)
  res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${token}`);
});

module.exports = router;

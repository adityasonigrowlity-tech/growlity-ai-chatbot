const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Login Route
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  const adminUser = process.env.ADMIN_USERNAME || 'admin';
  const adminPass = process.env.ADMIN_PASSWORD || 'growlity_admin_2026';

  if (username === adminUser && password === adminPass) {
    const token = jwt.sign(
      { username: adminUser },
      process.env.JWT_SECRET || 'growlity_secret_key_change_me',
      { expiresIn: '24h' }
    );
    return res.json({ success: true, token });
  }

  res.status(401).json({ success: false, error: 'Invalid username or password' });
});

// Verify Token Route
router.get('/verify', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ success: false });

  try {
    jwt.verify(token, process.env.JWT_SECRET || 'growlity_secret_key_change_me');
    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ success: false });
  }
});

module.exports = router;

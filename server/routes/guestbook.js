const express = require('express');
const db = require('../database');

const router = express.Router();

router.get('/guestbook', (req, res) => {
  const entries = db.prepare('SELECT * FROM guestbook ORDER BY id DESC').all();
  res.json(entries);
});

router.post('/guestbook', (req, res) => {
  const { nick, city, message, rating, metDziad } = req.body || {};
  if (!nick || !message) {
    return res.status(400).json({ error: 'Pola "nick" i "message" są wymagane.' });
  }
  const ratingNum = Math.min(5, Math.max(1, parseInt(rating, 10) || 5));
  const createdAt = new Date().toISOString().slice(0, 10);

  const info = db.prepare(`
    INSERT INTO guestbook (nick, city, message, rating, metDziad, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(String(nick).slice(0, 60), String(city || '').slice(0, 60), String(message).slice(0, 1000), ratingNum, String(metDziad || 'nie wiem').slice(0, 20), createdAt);

  const entry = db.prepare('SELECT * FROM guestbook WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(entry);
});

module.exports = router;

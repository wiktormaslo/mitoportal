const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../database');

const router = express.Router();

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const quotes = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'quotes.json'), 'utf-8'));
const warnings = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'warnings.json'), 'utf-8'));
const messages = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'system-messages.json'), 'utf-8'));
const expeditions = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'expeditions.json'), 'utf-8'));
const routesConfig = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'routes-config.json'), 'utf-8'));
const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf-8'));
const cryptids = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cryptids.json'), 'utf-8'));

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

router.get('/quotes/random', (req, res) => res.json({ text: pick(quotes) }));
router.get('/warnings/random', (req, res) => res.json({ text: pick(warnings) }));
router.get('/messages/random', (req, res) => res.json({ text: pick(messages) }));
router.get('/expeditions', (req, res) => res.json(expeditions));
router.get('/transport-modes', (req, res) => res.json(routesConfig.transportModes));
router.get('/cities', (req, res) => res.json(cities));
router.get('/cryptids', (req, res) => res.json(cryptids));

router.get('/counter', (req, res) => {
  const row = db.prepare("SELECT value FROM site_state WHERE key = 'visit_counter'").get();
  let value = parseInt(row.value, 10);

  // Licznik z zasady 16: czasem maleje.
  const delta = Math.random() < 0.12 ? -Math.floor(Math.random() * 4) : Math.floor(Math.random() * 3) + 1;
  value = Math.max(0, value + delta);

  db.prepare("UPDATE site_state SET value = ? WHERE key = 'visit_counter'").run(String(value));
  res.json({ count: value });
});

router.get('/status', (req, res) => {
  const prohibition = db.prepare("SELECT value FROM site_state WHERE key = 'prohibition_active'").get();

  let trainRow = db.prepare("SELECT value FROM site_state WHERE key = 'train_status'").get();
  if (Math.random() < 0.3) {
    const next = pick(['nie istnieje', 'istnieje tylko na papierze', 'status nieznany']);
    db.prepare("UPDATE site_state SET value = ? WHERE key = 'train_status'").run(next);
    trainRow = { value: next };
  }

  res.json({
    prohibitionActive: prohibition.value === 'true',
    prohibitionNote: prohibition.value === 'true' ? 'obowiązuje, chyba że Rawski już wypił' : 'zawieszona do odwołania',
    trainStatus: trainRow.value
  });
});

module.exports = router;

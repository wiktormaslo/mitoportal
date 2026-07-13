const express = require('express');
const db = require('../database');

const router = express.Router();

// Hasło wymagane do usuwania artykułów. Domyślnie "dziadmitoman", ale można je
// nadpisać zmienną środowiskową WIKI_ADMIN_PASSWORD na hostingu (zalecane, jeśli
// repozytorium jest publiczne).
const WIKI_ADMIN_PASSWORD = process.env.WIKI_ADMIN_PASSWORD || 'dziadmitoman';

function rowToArticle(row) {
  if (!row) return null;
  return {
    ...row,
    category: JSON.parse(row.category || '[]'),
    coordinates: row.coordinates ? JSON.parse(row.coordinates) : null,
    characters: JSON.parse(row.characters || '[]')
  };
}

function slugify(title) {
  return String(title)
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || `artykul-${Date.now()}`;
}

router.get('/wiki', (req, res) => {
  const rows = db.prepare('SELECT id, title, slug, summary, category, canonLevel, updatedAt FROM wiki_articles ORDER BY title ASC').all();
  res.json(rows.map((r) => ({ ...r, category: JSON.parse(r.category || '[]') })));
});

router.get('/wiki/search', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (!q) return res.json({ results: [] });

  const rows = db.prepare('SELECT id, title, slug, summary, category FROM wiki_articles').all();
  const results = rows
    .filter((r) => r.title.toLowerCase().includes(q) || (r.summary || '').toLowerCase().includes(q))
    .map((r) => ({ ...r, category: JSON.parse(r.category || '[]') }));

  if (results.length === 0) {
    const dziadArticle = db.prepare("SELECT slug, title FROM wiki_articles WHERE slug = 'dziad'").get();
    return res.json({ results: [], suggestion: 'Czy chodziło ci o dziada?', suggestedArticle: dziadArticle });
  }
  res.json({ results });
});

router.get('/wiki/recent-changes', (req, res) => {
  const rows = db.prepare(`
    SELECT article_slug, title, editedAt, editSummary FROM wiki_revisions
    ORDER BY id DESC LIMIT 20
  `).all();
  res.json(rows);
});

// Eksport wszystkich artykułów w formacie zgodnym z data/wiki.json.
// Pobrany plik można podmienić jako seed — po następnym deployu baza wystartuje
// z tą treścią (dosiewa się z wiki.json, gdy tabela jest pusta).
router.get('/wiki/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM wiki_articles ORDER BY title ASC').all();
  const articles = rows.map(rowToArticle);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="wiki.json"');
  res.send(JSON.stringify(articles, null, 2));
});

router.get('/wiki/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM wiki_articles WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'Artykuł nie istnieje. Może nigdy nie istniał.' });
  const history = db.prepare('SELECT id, editedAt, editSummary FROM wiki_revisions WHERE article_slug = ? ORDER BY id DESC').all(req.params.slug);
  res.json({ ...rowToArticle(row), history });
});

router.post('/wiki', (req, res) => {
  const b = req.body || {};
  if (!b.title || !b.content) {
    return res.status(400).json({ error: 'Pola "title" i "content" są wymagane.' });
  }
  const slug = slugify(b.slug || b.title);
  const exists = db.prepare('SELECT slug FROM wiki_articles WHERE slug = ?').get(slug);
  if (exists) return res.status(409).json({ error: 'Artykuł o takim adresie już istnieje.' });

  const now = new Date().toISOString().slice(0, 10);
  const id = slug;

  db.prepare(`
    INSERT INTO wiki_articles
      (id, title, slug, summary, content, category, canonLevel, location, coordinates, characters, eventDate, source, createdAt, updatedAt)
    VALUES (@id, @title, @slug, @summary, @content, @category, @canonLevel, @location, @coordinates, @characters, @eventDate, @source, @createdAt, @updatedAt)
  `).run({
    id,
    title: b.title,
    slug,
    summary: b.summary || '',
    content: b.content,
    category: JSON.stringify(b.category || []),
    canonLevel: b.canonLevel || 'niepotwierdzone',
    location: b.location || null,
    coordinates: b.coordinates ? JSON.stringify(b.coordinates) : null,
    characters: JSON.stringify(b.characters || []),
    eventDate: b.eventDate || null,
    source: b.source || 'wpis użytkownika',
    createdAt: now,
    updatedAt: now
  });

  res.status(201).json(rowToArticle(db.prepare('SELECT * FROM wiki_articles WHERE slug = ?').get(slug)));
});

router.put('/wiki/:slug', (req, res) => {
  const existing = db.prepare('SELECT * FROM wiki_articles WHERE slug = ?').get(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Artykuł nie istnieje.' });

  db.prepare(`
    INSERT INTO wiki_revisions (article_slug, title, summary, content, editedAt, editSummary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(existing.slug, existing.title, existing.summary, existing.content, new Date().toISOString(), req.body.editSummary || 'edycja');

  const b = req.body || {};
  const now = new Date().toISOString().slice(0, 10);

  db.prepare(`
    UPDATE wiki_articles SET
      title = @title, summary = @summary, content = @content, category = @category,
      canonLevel = @canonLevel, location = @location, coordinates = @coordinates,
      characters = @characters, eventDate = @eventDate, source = @source, updatedAt = @updatedAt
    WHERE slug = @slug
  `).run({
    slug: existing.slug,
    title: b.title || existing.title,
    summary: b.summary ?? existing.summary,
    content: b.content || existing.content,
    category: JSON.stringify(b.category || JSON.parse(existing.category || '[]')),
    canonLevel: b.canonLevel || existing.canonLevel,
    location: b.location ?? existing.location,
    coordinates: b.coordinates ? JSON.stringify(b.coordinates) : existing.coordinates,
    characters: JSON.stringify(b.characters || JSON.parse(existing.characters || '[]')),
    eventDate: b.eventDate ?? existing.eventDate,
    source: b.source || existing.source,
    updatedAt: now
  });

  res.json(rowToArticle(db.prepare('SELECT * FROM wiki_articles WHERE slug = ?').get(existing.slug)));
});

router.delete('/wiki/:slug', (req, res) => {
  const provided = req.get('x-wiki-password') || (req.body && req.body.password);
  if (provided !== WIKI_ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Nieprawidłowe hasło. Usuwać mogą tylko wtajemniczone dziady.' });
  }
  const existing = db.prepare('SELECT slug FROM wiki_articles WHERE slug = ?').get(req.params.slug);
  if (!existing) return res.status(404).json({ error: 'Artykuł nie istnieje.' });
  db.prepare('DELETE FROM wiki_articles WHERE slug = ?').run(req.params.slug);
  db.prepare('DELETE FROM wiki_revisions WHERE article_slug = ?').run(req.params.slug);
  res.status(204).send();
});

module.exports = router;

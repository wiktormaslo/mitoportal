const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// Ścieżkę bazy można nadpisać zmienną DATABASE_PATH (np. gdy na hostingu
// podpięty jest trwały dysk). Domyślnie baza leży w katalogu data/.
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'mitoportal.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS wiki_articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    summary TEXT,
    content TEXT,
    category TEXT,
    canonLevel TEXT,
    location TEXT,
    coordinates TEXT,
    characters TEXT,
    eventDate TEXT,
    source TEXT,
    createdAt TEXT,
    updatedAt TEXT
  );

  CREATE TABLE IF NOT EXISTS wiki_revisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_slug TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    content TEXT,
    editedAt TEXT,
    editSummary TEXT
  );

  CREATE TABLE IF NOT EXISTS guestbook (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nick TEXT,
    city TEXT,
    message TEXT,
    rating INTEGER,
    metDziad TEXT,
    createdAt TEXT
  );

  CREATE TABLE IF NOT EXISTS site_state (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

function seedIfEmpty() {
  const articleCount = db.prepare('SELECT COUNT(*) AS c FROM wiki_articles').get().c;
  if (articleCount === 0) {
    const seedPath = path.join(__dirname, '..', 'data', 'wiki.json');
    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
    const insert = db.prepare(`
      INSERT INTO wiki_articles
        (id, title, slug, summary, content, category, canonLevel, location, coordinates, characters, eventDate, source, createdAt, updatedAt)
      VALUES
        (@id, @title, @slug, @summary, @content, @category, @canonLevel, @location, @coordinates, @characters, @eventDate, @source, @createdAt, @updatedAt)
    `);
    const insertMany = db.transaction((articles) => {
      for (const a of articles) {
        insert.run({
          id: a.id,
          title: a.title,
          slug: a.slug,
          summary: a.summary || '',
          content: a.content || '',
          category: JSON.stringify(a.category || []),
          canonLevel: a.canonLevel || 'niepotwierdzone',
          location: a.location || null,
          coordinates: a.coordinates ? JSON.stringify(a.coordinates) : null,
          characters: JSON.stringify(a.characters || []),
          eventDate: a.eventDate || null,
          source: a.source || '',
          createdAt: a.createdAt,
          updatedAt: a.updatedAt
        });
      }
    });
    insertMany(seed);
    console.log(`[baza] Zaimportowano ${seed.length} artykułów wiki z lore.`);
  }

  const guestbookCount = db.prepare('SELECT COUNT(*) AS c FROM guestbook').get().c;
  if (guestbookCount === 0) {
    const guestbookSeedPath = path.join(__dirname, '..', 'data', 'guestbook.json');
    let starterEntries = [];
    if (fs.existsSync(guestbookSeedPath)) {
      starterEntries = JSON.parse(fs.readFileSync(guestbookSeedPath, 'utf-8'));
    }
    const insert = db.prepare(`
      INSERT INTO guestbook (nick, city, message, rating, metDziad, createdAt)
      VALUES (@nick, @city, @message, @rating, @metDziad, @createdAt)
    `);
    const insertMany = db.transaction((entries) => {
      for (const e of entries) {
        insert.run({
          nick: e.nick,
          city: e.city || '',
          message: e.message,
          rating: e.rating || 5,
          metDziad: e.metDziad || 'nie wiem',
          createdAt: e.createdAt || new Date().toISOString().slice(0, 10)
        });
      }
    });
    insertMany(starterEntries);
    if (starterEntries.length) console.log(`[baza] Zaimportowano ${starterEntries.length} wpisów księgi gości.`);
  }

  const counterState = db.prepare('SELECT value FROM site_state WHERE key = ?').get('visit_counter');
  if (!counterState) {
    db.prepare('INSERT INTO site_state (key, value) VALUES (?, ?)').run('visit_counter', '133742');
  }
  const prohibitionState = db.prepare('SELECT value FROM site_state WHERE key = ?').get('prohibition_active');
  if (!prohibitionState) {
    db.prepare('INSERT INTO site_state (key, value) VALUES (?, ?)').run('prohibition_active', 'true');
  }
  const trainState = db.prepare('SELECT value FROM site_state WHERE key = ?').get('train_status');
  if (!trainState) {
    db.prepare('INSERT INTO site_state (key, value) VALUES (?, ?)').run('train_status', 'nie istnieje');
  }
}

seedIfEmpty();

module.exports = db;

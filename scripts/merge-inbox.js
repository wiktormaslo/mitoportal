#!/usr/bin/env node
// merge-inbox.js — scala zgłoszenia JSON z data/inbox/ do seedów:
//   - artykuły wiki  -> data/wiki.json
//   - wpisy księgi   -> data/guestbook.json
// Po scaleniu przenosi przetworzone pliki do data/inbox/processed/.
//
// Użycie:  npm run merge-inbox
// Wrzuć plik .json (jeden obiekt albo tablica) do data/inbox/ i uruchom skrypt.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA = path.join(ROOT, 'data');
const INBOX = path.join(DATA, 'inbox');
const PROCESSED = path.join(INBOX, 'processed');
const WIKI = path.join(DATA, 'wiki.json');
const GUESTBOOK = path.join(DATA, 'guestbook.json');

function readJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch (e) { return fallback; }
}
function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function slugify(str) {
  const map = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };
  return String(str || '')
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => map[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function today() { return new Date().toISOString().slice(0, 10); }

function isArticle(o) { return o && (o.content || o.summary) && (o.title || o.slug); }
function isGuestEntry(o) { return o && o.nick && o.message; }

function normalizeArticle(a) {
  const title = a.title || a.slug;
  const slug = a.slug || slugify(title);
  return {
    id: a.id || slug,
    title,
    slug,
    summary: a.summary || '',
    content: a.content || '',
    category: Array.isArray(a.category) ? a.category : (a.category ? [a.category] : []),
    canonLevel: a.canonLevel || 'niepotwierdzone',
    location: a.location ?? null,
    coordinates: a.coordinates ?? null,
    characters: Array.isArray(a.characters) ? a.characters : [],
    eventDate: a.eventDate ?? null,
    source: a.source || 'zgłoszenie użytkownika',
    createdAt: a.createdAt || today(),
    updatedAt: a.updatedAt || today()
  };
}

function normalizeEntry(e) {
  return {
    nick: e.nick,
    city: e.city || '',
    message: e.message,
    rating: Number(e.rating) || 5,
    metDziad: e.metDziad || 'nie wiem',
    createdAt: e.createdAt || today()
  };
}

function main() {
  if (!fs.existsSync(INBOX)) {
    console.log('Brak katalogu data/inbox/. Tworzę.');
    fs.mkdirSync(INBOX, { recursive: true });
  }
  fs.mkdirSync(PROCESSED, { recursive: true });

  const files = fs.readdirSync(INBOX).filter((f) => f.toLowerCase().endsWith('.json'));
  if (!files.length) {
    console.log('Inbox pusty — nic do scalenia. Wrzuć plik .json do data/inbox/ i uruchom ponownie.');
    return;
  }

  const wiki = readJSON(WIKI, []);
  const guest = readJSON(GUESTBOOK, []);
  const wikiBySlug = new Map(wiki.map((a, i) => [a.slug, i]));
  const guestKey = (e) => `${e.nick}|${e.message}|${e.createdAt}`;
  const guestSeen = new Set(guest.map(guestKey));

  let addedArticles = 0, updatedArticles = 0, addedEntries = 0, skipped = 0;

  for (const file of files) {
    const full = path.join(INBOX, file);
    const parsed = readJSON(full, null);
    if (parsed == null) { console.log(`⚠ pomijam nieczytelny JSON: ${file}`); continue; }
    const items = Array.isArray(parsed) ? parsed : [parsed];

    for (const item of items) {
      if (isArticle(item)) {
        const a = normalizeArticle(item);
        if (wikiBySlug.has(a.slug)) {
          wiki[wikiBySlug.get(a.slug)] = a;
          updatedArticles++;
        } else {
          wiki.push(a);
          wikiBySlug.set(a.slug, wiki.length - 1);
          addedArticles++;
        }
      } else if (isGuestEntry(item)) {
        const e = normalizeEntry(item);
        if (!guestSeen.has(guestKey(e))) {
          guest.push(e);
          guestSeen.add(guestKey(e));
          addedEntries++;
        } else { skipped++; }
      } else {
        console.log(`⚠ nierozpoznany obiekt w ${file} — pomijam`);
        skipped++;
      }
    }

    // przenieś przetworzony plik
    fs.renameSync(full, path.join(PROCESSED, `${Date.now()}-${file}`));
  }

  writeJSON(WIKI, wiki);
  writeJSON(GUESTBOOK, guest);

  console.log('=== Scalanie zakończone ===');
  console.log(`Artykuły: +${addedArticles} nowych, ${updatedArticles} zaktualizowanych (łącznie ${wiki.length})`);
  console.log(`Księga gości: +${addedEntries} nowych (łącznie ${guest.length})`);
  if (skipped) console.log(`Pominięto: ${skipped}`);
  console.log('Przetworzone pliki przeniesiono do data/inbox/processed/.');
  console.log('Pamiętaj o commicie i pushu — Render wczyta nowe dane przy następnym deployu.');
}

main();

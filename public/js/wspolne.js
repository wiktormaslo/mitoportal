// wspolne.js - moduł współny dla wszystkich podstron MITOPORTALU

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd serwera.' }));
    throw new Error(err.error || 'Błąd serwera.');
  }
  if (res.status === 204) return null;
  return res.json();
}

function highlightCurrentNav() {
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-btn').forEach((a) => {
    const href = a.getAttribute('href');
    if (href === here) a.classList.add('current');
  });
}

async function initCounter() {
  const el = document.getElementById('licznik-odwiedzin');
  if (!el) return;
  try {
    const data = await fetchJSON('/api/counter');
    el.textContent = String(data.count).padStart(7, '0');
  } catch (e) {
    el.textContent = 'BŁĄD';
  }
}

async function initRandomQuote() {
  const el = document.getElementById('losowy-cytat');
  if (!el) return;
  try {
    const data = await fetchJSON('/api/quotes/random');
    el.textContent = `„${data.text}”`;
  } catch (e) {
    el.textContent = 'cytat chwilowo niedostępny (dział geodezji pracuje)';
  }
}

async function initRandomWarning() {
  const el = document.getElementById('losowe-ostrzezenie');
  if (!el) return;
  try {
    const data = await fetchJSON('/api/warnings/random');
    el.textContent = data.text;
  } catch (e) {
    el.textContent = 'Brak ostrzeżeń. To samo w sobie jest podejrzane.';
  }
}

async function initSystemMessage() {
  const el = document.getElementById('komunikat-systemowy');
  if (!el) return;
  try {
    const data = await fetchJSON('/api/messages/random');
    el.textContent = data.text;
  } catch (e) {
    el.textContent = 'Komunikat systemowy zaginął w drodze.';
  }
}

async function initStatus() {
  const prohibitionEl = document.getElementById('status-prohibicja');
  const trainEl = document.getElementById('status-pociag');
  if (!prohibitionEl && !trainEl) return;
  try {
    const data = await fetchJSON('/api/status');
    if (prohibitionEl) {
      prohibitionEl.textContent = data.prohibitionActive
        ? `PROHIBICJA: AKTYWNA (${data.prohibitionNote})`
        : `PROHIBICJA: ${data.prohibitionNote.toUpperCase()}`;
    }
    if (trainEl) {
      trainEl.textContent = `POCIĄG W SANOKU: ${data.trainStatus.toUpperCase()}`;
    }
  } catch (e) {
    if (prohibitionEl) prohibitionEl.textContent = 'PROHIBICJA: STATUS NIEZNANY';
    if (trainEl) trainEl.textContent = 'POCIĄG: STATUS NIEZNANY';
  }
}

async function initRandomWikiLink() {
  const els = document.querySelectorAll('.link-losowy-wiki');
  if (!els.length) return;
  try {
    const articles = await fetchJSON('/api/wiki');
    const pick = articles[Math.floor(Math.random() * articles.length)];
    els.forEach((el) => {
      el.href = `wiki.html?slug=${encodeURIComponent(pick.slug)}`;
      if (el.dataset.fillTitle) el.textContent = pick.title;
    });
  } catch (e) {
    els.forEach((el) => { el.href = 'wiki.html'; });
  }
}

function initFooterDate() {
  const el = document.getElementById('data-aktualizacji');
  if (!el) return;
  const dzis = new Date();
  el.textContent = dzis.toLocaleDateString('pl-PL');
}

function initWspolne() {
  highlightCurrentNav();
  initCounter();
  initRandomQuote();
  initRandomWarning();
  initSystemMessage();
  initStatus();
  initRandomWikiLink();
  initFooterDate();
}

document.addEventListener('DOMContentLoaded', initWspolne);

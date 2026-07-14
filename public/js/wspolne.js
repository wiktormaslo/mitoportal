// wspolne.js - moduł współny dla wszystkich podstron MITOPORTALU

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Błąd serwera.' }));
    throw new Error(err.error || 'Błąd serwera.');
  }
  if (res.status === 204) return null;
  return res.json();
}

// ===== Zgłaszanie wpisów do redakcji (JSON + mailto) =====
const REDAKCJA_EMAIL = 'mitoportal.orlen@gmail.com';

function zaproponujDoRedakcji(kind, obj) {
  const json = JSON.stringify(obj, null, 2);
  const tytul = kind === 'wiki'
    ? `Nowy artykul Wiki PMC ORLEN: ${obj.title || ''}`
    : 'Nowy wpis do Ksiegi Gosci PMC ORLEN';
  const wstep = kind === 'wiki'
    ? 'Czesc! Zglaszam artykul do Wiki PMC ORLEN. Ponizej JSON do dodania do kanonu:'
    : 'Czesc! Zglaszam wpis do Ksiegi Gosci PMC ORLEN. Ponizej JSON do dodania:';
  const body = `${wstep}\n\n${json}\n\n(wyslane z portalu PMC ORLEN)`;
  const mailto = `mailto:${REDAKCJA_EMAIL}?subject=${encodeURIComponent(tytul)}&body=${encodeURIComponent(body)}`;

  let ov = document.getElementById('redakcja-overlay');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = 'redakcja-overlay';
    ov.className = 'redakcja-overlay';
    ov.innerHTML = `
      <div class="redakcja-box">
        <h2>📨 Wyślij wpis do redakcji</h2>
        <p>Żeby Twój wpis trafił <strong>na stałe</strong> do portalu, wyślij ten JSON na adres
        <strong>${REDAKCJA_EMAIL}</strong>. Skrzynka pocztowa powinna otworzyć się sama —
        jeśli nie, skopiuj JSON i wyślij ręcznie.</p>
        <textarea id="redakcja-json" readonly rows="12" style="width:100%; font-family:'Courier New',monospace; font-size:11px;"></textarea>
        <div style="margin-top:8px;">
          <a class="win98-btn" id="redakcja-mail" href="#">📧 Otwórz pocztę</a>
          <button class="win98-btn" id="redakcja-kopiuj" type="button">📋 Kopiuj JSON</button>
          <button class="win98-btn" id="redakcja-zamknij" type="button">Zamknij</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.querySelector('#redakcja-zamknij').addEventListener('click', () => { ov.style.display = 'none'; });
    ov.querySelector('#redakcja-kopiuj').addEventListener('click', () => {
      const ta = document.getElementById('redakcja-json');
      ta.select();
      if (navigator.clipboard) navigator.clipboard.writeText(ta.value).catch(() => {});
      try { document.execCommand('copy'); } catch (e) {}
      ov.querySelector('#redakcja-kopiuj').textContent = '✓ Skopiowano';
    });
  }
  document.getElementById('redakcja-json').value = json;
  ov.querySelector('#redakcja-mail').href = mailto;
  ov.querySelector('#redakcja-kopiuj').textContent = '📋 Kopiuj JSON';
  ov.style.display = 'flex';
  // automatyczne otwarcie skrzynki pocztowej
  window.location.href = mailto;
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

const MINI_POGODA_MIEJSCA = ['Twoją okolicę', 'Sanok', 'Wisłę', 'Kotlarnię', 'Cisną', 'Pionowe Jezioro', 'Kędzierzyn-Koźle'];

async function initMiniWeather() {
  const el = document.getElementById('mini-pogoda');
  if (!el) return;
  try {
    const miejsce = MINI_POGODA_MIEJSCA[Math.floor(Math.random() * MINI_POGODA_MIEJSCA.length)];
    const data = await fetchJSON(`/api/weather?place=${encodeURIComponent(miejsce)}`);
    el.textContent = `Pogoda (${data.place}): ${data.temperature}, ${data.condition}. ${data.komunikat}`;
  } catch (e) {
    el.textContent = 'Pogoda chwilowo nieznana. Zakładaj, że będzie źle.';
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
  initMiniWeather();
  initStatus();
  initRandomWikiLink();
  initFooterDate();
}

document.addEventListener('DOMContentLoaded', initWspolne);

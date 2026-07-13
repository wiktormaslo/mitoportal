// ksiega-gosci.js — Księga Gości

function renderWpis(w) {
  const div = document.createElement('div');
  div.className = 'guestbook-entry';

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${w.nick} (${w.city || 'lokalizacja nieznana'}) — ${w.createdAt} — ocena: ${'★'.repeat(w.rating)}${'☆'.repeat(5 - w.rating)} — spotkał dziada: ${w.metDziad}`;
  div.appendChild(meta);

  const msg = document.createElement('div');
  msg.textContent = w.message;
  div.appendChild(msg);

  return div;
}

async function zaladujKsiege() {
  const kontener = document.getElementById('lista-wpisow');
  try {
    const wpisy = await fetchJSON('/api/guestbook');
    kontener.innerHTML = '';
    if (!wpisy.length) {
      kontener.innerHTML = '<p>Brak wpisów. Bądź pierwszym dziadem.</p>';
      return;
    }
    wpisy.forEach((w) => kontener.appendChild(renderWpis(w)));
  } catch (e) {
    kontener.innerHTML = '<p>Księga chwilowo niedostępna.</p>';
  }
}

async function wyslijWpis(e) {
  e.preventDefault();
  const dane = {
    nick: document.getElementById('g-nick').value.trim(),
    city: document.getElementById('g-miasto').value.trim(),
    message: document.getElementById('g-wiadomosc').value.trim(),
    rating: document.getElementById('g-ocena').value,
    metDziad: document.getElementById('g-dziad').value
  };
  if (!dane.nick || !dane.message) return;

  try {
    await fetchJSON('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dane)
    });
    document.getElementById('form-gosc').reset();
    await zaladujKsiege();
  } catch (err) {
    alert('Nie udało się zapisać wpisu: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  zaladujKsiege();
  document.getElementById('form-gosc').addEventListener('submit', wyslijWpis);
});

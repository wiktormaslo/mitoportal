// krypniaki.js — zakładka dziwnych zjawisk i stworzeń

// 5 wersji śmiesznie-strasznego ostrzeżenia, losowane po wejściu.
const OSTRZEZENIA = [
  'Treść tej zakładki jest tak straszna, że dwóch stażystów działu geodezji zwolniło się jeszcze przed jej opublikowaniem. Trzeci do dziś patrzy w jeden punkt.',
  'UWAGA: poniższe materiały oglądał kiedyś Rawski. Musiał wypić tyle Jägermeistera, że ustanowiono z tego powodu osobną prohibicję.',
  'Prostata Pana Piłeczki zaczyna rezonować już na widok tej strony. Zaleca się mieć w pobliżu suche skarpety i mocne nerwy.',
  'To, co zobaczysz poniżej, jest gorsze niż fikcyjny pociąg w Sanoku. A fikcyjny pociąg nie istnieje, więc pomyśl, jak bardzo musi być źle.',
  'Bracia Akwalung wynurzyli się z Pionowego Jeziora specjalnie po to, żeby odradzić Ci przewijanie dalej. Potem wrócili. Nie pytaj.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function odsloniTresc() {
  document.getElementById('ostrzezenie').style.display = 'none';
  document.getElementById('tresc-krypniakow').style.display = 'block';
  zaladujKrypniaki();
}

async function zaladujKrypniaki() {
  const kontener = document.getElementById('lista-krypniakow');
  try {
    const krypniaki = await fetchJSON('/api/cryptids');
    if (!krypniaki.length) {
      kontener.innerHTML = '<div class="panel">Rejestr chwilowo pusty. Dziady się ukrywają.</div>';
      return;
    }
    kontener.innerHTML = krypniaki.map((k) => `
      <div class="panel kryptid-card">
        <h2>${escapeHtml(k.name)} <span class="kryptid-tag kryptid-${k.category}">${escapeHtml(k.category)}</span></h2>
        <img src="${k.photo}" alt="Krypniak: ${escapeHtml(k.name)}" class="kryptid-photo" loading="lazy">
        <table class="content-table">
          <tr><th>Zaobserwowano</th><td>${escapeHtml(k.sighted || '—')}</td></tr>
          <tr><th>Pierwszy raz</th><td>${escapeHtml(k.firstSeen || '—')}</td></tr>
          <tr><th>Świadek</th><td>${escapeHtml(k.witness || '—')}</td></tr>
          <tr><th>Poziom zagrożenia</th><td>${escapeHtml(k.threatLevel || '—')}</td></tr>
          <tr><th>Poziom kanoniczności</th><td>${escapeHtml(k.canonLevel || '—')}</td></tr>
        </table>
        <p>${escapeHtml(k.description || '')}</p>
        ${k.document ? `<p><a class="win98-btn" href="${escapeHtml(k.document)}" target="_blank" rel="noopener">📄 Pobierz odtajniony dokument (POUFNE)</a></p>` : ''}
        ${k.warning ? `<div class="warning-box">⚠ ${escapeHtml(k.warning)}</div>` : ''}
      </div>
    `).join('');
  } catch (e) {
    kontener.innerHTML = '<div class="panel">Nie udało się wczytać rejestru krypniaków. Może tak jest bezpieczniej.</div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tekst-ostrzezenia').textContent = pick(OSTRZEZENIA);
  document.getElementById('btn-wchodze').addEventListener('click', odsloniTresc);
});

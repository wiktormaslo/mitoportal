// rozklad.js — wyszukiwarka połączeń PKP/PKS w stylu Koleo

function klasaProc(p) {
  if (p >= 70) return 'proc-wysoki';
  if (p >= 45) return 'proc-sredni';
  return 'proc-niski';
}

function kartaKursu(k) {
  const mins = k.durationMin;
  const czas = mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`;
  const przesiadki = k.transfers === 0 ? 'bezpośredni' : `${k.transfers} przes.`;
  return `
    <div class="kurs-card">
      <div class="kurs-times">
        <span class="kurs-dep">${escapeHtml(k.departureTime)}</span>
        <span class="kurs-arrow">→</span>
        <span class="kurs-arr">${escapeHtml(k.arrivalTime)}</span>
      </div>
      <div class="kurs-info">
        <strong>${escapeHtml(k.line)}</strong> · ${escapeHtml(k.operator)}<br>
        <span style="font-size:11px;">${escapeHtml(k.from)} → ${escapeHtml(k.to)} · ${czas} · ${przesiadki}</span><br>
        <em style="font-size:11px;">${escapeHtml(k.note || '')}</em>
      </div>
      <div class="kurs-proc ${klasaProc(k.arrivalProbability)}">
        <div class="kurs-proc-val">${k.arrivalProbability}%</div>
        <div class="kurs-proc-lbl">szansa przyjazdu</div>
      </div>
    </div>`;
}

function sekcja(tytul, opis, kursy) {
  if (!kursy.length) {
    return `<div class="panel"><h2>${tytul}</h2><p>${opis}</p><div class="warning-box">Brak kursów. Dziady twierdzą, że i tak nic nie jechało.</div></div>`;
  }
  return `<div class="panel"><h2>${tytul}</h2><p style="font-size:12px;">${opis}</p>${kursy.map(kartaKursu).join('')}</div>`;
}

async function szukaj(e) {
  if (e) e.preventDefault();
  const from = document.getElementById('r-from').value.trim();
  const to = document.getElementById('r-to').value.trim();
  const date = document.getElementById('r-date').value;
  const wyniki = document.getElementById('wyniki-rozkladu');

  if (!from || !to) { alert('Podaj stację początkową i docelową.'); return; }

  wyniki.innerHTML = '<div class="panel">Dział połączeń przeszukuje rozkład (i wyobraźnię)...</div>';

  try {
    const params = new URLSearchParams({ from, to, date });
    const dane = await fetchJSON('/api/rozklad?' + params.toString());
    const naglowek = `<div class="panel"><h2>${escapeHtml(dane.from)} → ${escapeHtml(dane.to)}</h2>` +
      `<p style="font-size:12px;">Data: ${escapeHtml(dane.date)} · znaleziono realnych kursów PKP: ${dane.realneZnalezione}</p></div>`;
    wyniki.innerHTML = naglowek +
      sekcja('🚆 Pociągi PKP', 'Część kursów pochodzi z prawdziwego rozkładu, część z działu mitomanii. Wysoki procent = raczej prawdziwy.', dane.pkp) +
      sekcja('🚌 Autobusy PKS', 'Kursy całkowicie orientacyjne. Odjazdy przybliżone, przyjazdy hipotetyczne.', dane.pks);
  } catch (err) {
    wyniki.innerHTML = `<div class="panel"><div class="warning-box">Nie udało się pobrać rozkładu: ${escapeHtml(err.message)}</div></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Prefill z parametrów przekazanych z mapy.
  const p = new URLSearchParams(location.search);
  if (p.get('from')) document.getElementById('r-from').value = p.get('from');
  if (p.get('to')) document.getElementById('r-to').value = p.get('to');
  const dateInput = document.getElementById('r-date');
  dateInput.value = p.get('date') || new Date().toISOString().slice(0, 10);

  document.getElementById('form-rozklad').addEventListener('submit', szukaj);

  // Jeśli przyszliśmy z mapy z gotowymi stacjami — od razu szukaj.
  if (p.get('to')) szukaj();
});

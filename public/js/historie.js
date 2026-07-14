// historie.js — Losowy Artykuł (prezentowany jako udokumentowany wpis archiwalny)

function losowaDataArchiwum() {
  const rok = 2019 + Math.floor(Math.random() * 7); // 2019-2025
  const mies = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
  const dzien = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
  return `${rok}-${mies}-${dzien}`;
}

function naglowekZElementow(el) {
  if (!el) return '📁 Wpis archiwalny PMC ORLEN';
  return `📁 Akta: wydarzenia w drodze do ${el.miejsceStart}`;
}

async function generujHistorie() {
  try {
    const dane = await fetchJSON('/api/story');
    document.getElementById('naglowek-artykulu').textContent = naglowekZElementow(dane.elements);
    const nr = 1000 + Math.floor(Math.random() * 9000);
    document.getElementById('byline-artykulu').textContent =
      `Wpis archiwalny nr ${nr} · zarejestrowano ${losowaDataArchiwum()} · dział archiwum PMC ORLEN`;
    document.getElementById('tekst-historii').textContent = dane.text;
    document.getElementById('panel-historia').style.display = 'block';
  } catch (err) {
    alert('Archiwum chwilowo niedostępne: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-generuj').addEventListener('click', generujHistorie);
  generujHistorie();
});

// reklamy.js — banery reklamowe PMC ORLEN (cykl, będzie ich więcej)

let REKLAMY = [];
let idxReklamy = 0;

function renderujReklame(slot, r) {
  slot.innerHTML = `
    <div class="reklama-etykieta">R E K L A M A</div>
    <a class="reklama-link" href="${escapeHtml(r.href || '#')}" title="${escapeHtml(r.alt || '')}">
      <img src="${escapeHtml(r.image)}" alt="${escapeHtml(r.alt || 'reklama')}" class="reklama-baner">
    </a>
    ${r.sponsor ? `<div class="reklama-sponsor">Sponsor: ${escapeHtml(r.sponsor)}</div>` : ''}
  `;
}

async function zaladujReklamy() {
  const slot = document.getElementById('reklama-slot');
  if (!slot) return;
  try {
    REKLAMY = await fetchJSON('/api/ads');
    if (!REKLAMY.length) { slot.style.display = 'none'; return; }
    idxReklamy = Math.floor(Math.random() * REKLAMY.length);   // losowa na wejściu
    renderujReklame(slot, REKLAMY[idxReklamy]);
    // gdy reklam przybędzie — zmieniają się co 12 s
    if (REKLAMY.length > 1) {
      setInterval(() => {
        idxReklamy = (idxReklamy + 1) % REKLAMY.length;
        renderujReklame(slot, REKLAMY[idxReklamy]);
      }, 12000);
    }
  } catch (e) {
    slot.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', zaladujReklamy);

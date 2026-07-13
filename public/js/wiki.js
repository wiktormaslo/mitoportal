// wiki.js — logika podstrony Wiki PMC ORLEN

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

const KANON_KLASA = {
  'kanon': 'canon-kanon',
  'prawdopodobnie kanon': 'canon-prawdopodobnie',
  'relacja dziada': 'canon-relacja',
  'niepotwierdzone': 'canon-niepotwierdzone',
  'totalna mitomania': 'canon-mitomania'
};

function pokazWidok(nazwa) {
  document.getElementById('widok-artykul').style.display = nazwa === 'artykul' ? 'block' : 'none';
  document.getElementById('widok-formularz').style.display = nazwa === 'formularz' ? 'block' : 'none';
  document.getElementById('widok-lista').style.display = nazwa === 'lista' ? 'block' : 'none';
}

async function zaladujListe() {
  const ul = document.getElementById('lista-artykulow');
  try {
    const articles = await fetchJSON('/api/wiki');
    ul.innerHTML = '';
    articles.forEach((a) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `wiki.html?slug=${encodeURIComponent(a.slug)}`;
      link.textContent = a.title;
      link.onclick = (e) => { e.preventDefault(); otworzArtykul(a.slug); };
      li.appendChild(link);
      ul.appendChild(li);
    });

    const haslo = articles[Math.floor(Math.random() * articles.length)];
    const hasloEl = document.getElementById('haslo-dnia');
    if (hasloEl && haslo) {
      hasloEl.innerHTML = '';
      const a = document.createElement('a');
      a.href = `wiki.html?slug=${encodeURIComponent(haslo.slug)}`;
      a.textContent = haslo.title;
      a.onclick = (e) => { e.preventDefault(); otworzArtykul(haslo.slug); };
      hasloEl.appendChild(a);
      hasloEl.append(` — ${haslo.summary || ''}`);
    }
  } catch (e) {
    ul.innerHTML = '<li>Błąd wczytywania listy.</li>';
  }
}

async function zaladujOstatnieZmiany() {
  const ul = document.getElementById('ostatnie-zmiany');
  try {
    const zmiany = await fetchJSON('/api/wiki/recent-changes');
    if (!zmiany.length) {
      ul.innerHTML = '<li>brak edycji</li>';
      return;
    }
    ul.innerHTML = '';
    zmiany.forEach((z) => {
      const li = document.createElement('li');
      li.textContent = `${z.title} — ${new Date(z.editedAt).toLocaleDateString('pl-PL')} (${z.editSummary || 'edycja'})`;
      ul.appendChild(li);
    });
  } catch (e) {
    ul.innerHTML = '<li>błąd</li>';
  }
}

function renderInfobox(a) {
  const box = document.getElementById('artykul-infobox');
  const wsp = a.coordinates ? `${a.coordinates.lat}, ${a.coordinates.lng}` : '—';
  box.innerHTML = `
    <tr><th colspan="2" style="text-align:center; font-size:14px;">${escapeHtml(a.title)}</th></tr>
    <tr><th>Kanoniczność</th><td class="${KANON_KLASA[a.canonLevel] || ''}">${escapeHtml(a.canonLevel)}</td></tr>
    <tr><th>Kategorie</th><td>${escapeHtml((a.category || []).join(', ')) || '—'}</td></tr>
    <tr><th>Lokalizacja</th><td>${escapeHtml(a.location) || '—'}</td></tr>
    <tr><th>Współrzędne</th><td>${escapeHtml(wsp)}</td></tr>
    <tr><th>Data wydarzenia</th><td>${escapeHtml(a.eventDate) || '—'}</td></tr>
    <tr><th>Bohaterowie</th><td>${escapeHtml((a.characters || []).join(', ')) || '—'}</td></tr>
    <tr><th>Źródło</th><td style="font-size:10px;">${escapeHtml(a.source) || '—'}</td></tr>
  `;
}

let biezacyArtykul = null;

async function otworzArtykul(slug) {
  try {
    const a = await fetchJSON(`/api/wiki/${encodeURIComponent(slug)}`);
    biezacyArtykul = a;
    document.getElementById('artykul-tytul').textContent = a.title;
    document.getElementById('artykul-streszczenie').textContent = a.summary || '';
    document.getElementById('artykul-tresc').textContent = a.content;
    renderInfobox(a);

    const toc = document.getElementById('artykul-toc');
    toc.innerHTML = `<strong>Spis treści:</strong> Streszczenie · Treść · Infobox · Historia edycji`;

    const hist = document.getElementById('artykul-historia');
    if (a.history && a.history.length) {
      hist.innerHTML = '<h3>Historia edycji</h3><ul>' +
        a.history.map((h) => `<li>${new Date(h.editedAt).toLocaleString('pl-PL')} — ${escapeHtml(h.editSummary || 'edycja')}</li>`).join('') +
        '</ul>';
    } else {
      hist.innerHTML = '<h3>Historia edycji</h3><p><em>Brak wcześniejszych edycji.</em></p>';
    }

    history.replaceState(null, '', `wiki.html?slug=${encodeURIComponent(slug)}`);
    pokazWidok('artykul');
  } catch (e) {
    pokazWidok('lista');
    alert('Nie udało się wczytać artykułu: ' + e.message);
  }
}

function wypelnijFormularz(a) {
  document.getElementById('f-tytul').value = a ? a.title : '';
  document.getElementById('f-streszczenie').value = a ? (a.summary || '') : '';
  document.getElementById('f-tresc').value = a ? a.content : '';
  document.getElementById('f-kategorie').value = a ? (a.category || []).join(', ') : '';
  document.getElementById('f-kanon').value = a ? a.canonLevel : 'niepotwierdzone';
  document.getElementById('f-data').value = a ? (a.eventDate || '') : '';
  document.getElementById('f-lokalizacja').value = a ? (a.location || '') : '';
  document.getElementById('f-wspolrzedne').value = a && a.coordinates ? `${a.coordinates.lat}, ${a.coordinates.lng}` : '';
  document.getElementById('f-bohaterowie').value = a ? (a.characters || []).join(', ') : '';
  document.getElementById('f-zrodlo').value = a ? (a.source || '') : '';
  document.getElementById('f-opis-edycji').value = '';
}

function otworzFormularzNowy() {
  biezacyArtykul = null;
  document.getElementById('formularz-naglowek').textContent = 'Nowy artykuł';
  wypelnijFormularz(null);
  pokazWidok('formularz');
}

function otworzFormularzEdycji() {
  if (!biezacyArtykul) return;
  document.getElementById('formularz-naglowek').textContent = `Edytuj: ${biezacyArtykul.title}`;
  wypelnijFormularz(biezacyArtykul);
  pokazWidok('formularz');
}

function parsujListe(str) {
  return String(str || '').split(',').map((s) => s.trim()).filter(Boolean);
}

function parsujWspolrzedne(str) {
  const parts = String(str || '').split(',').map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

async function zapiszFormularz(e) {
  e.preventDefault();
  const dane = {
    title: document.getElementById('f-tytul').value.trim(),
    summary: document.getElementById('f-streszczenie').value.trim(),
    content: document.getElementById('f-tresc').value,
    category: parsujListe(document.getElementById('f-kategorie').value),
    canonLevel: document.getElementById('f-kanon').value,
    eventDate: document.getElementById('f-data').value.trim() || null,
    location: document.getElementById('f-lokalizacja').value.trim() || null,
    coordinates: parsujWspolrzedne(document.getElementById('f-wspolrzedne').value),
    characters: parsujListe(document.getElementById('f-bohaterowie').value),
    source: document.getElementById('f-zrodlo').value.trim() || 'wpis użytkownika',
    editSummary: document.getElementById('f-opis-edycji').value.trim() || 'edycja'
  };

  try {
    let saved;
    if (biezacyArtykul) {
      saved = await fetchJSON(`/api/wiki/${encodeURIComponent(biezacyArtykul.slug)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dane)
      });
    } else {
      saved = await fetchJSON('/api/wiki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dane)
      });
    }
    await zaladujListe();
    await zaladujOstatnieZmiany();
    await otworzArtykul(saved.slug);
  } catch (err) {
    alert('Nie udało się zapisać artykułu: ' + err.message);
  }
}

async function usunArtykul() {
  if (!biezacyArtykul) return;
  if (!confirm(`Na pewno usunąć artykuł „${biezacyArtykul.title}”? Kanon tego nie wybaczy.`)) return;
  try {
    await fetchJSON(`/api/wiki/${encodeURIComponent(biezacyArtykul.slug)}`, { method: 'DELETE' });
    biezacyArtykul = null;
    await zaladujListe();
    history.replaceState(null, '', 'wiki.html');
    pokazWidok('lista');
  } catch (err) {
    alert('Nie udało się usunąć artykułu: ' + err.message);
  }
}

async function wykonajWyszukiwanie(e) {
  e.preventDefault();
  const q = document.getElementById('pole-szukaj').value.trim();
  const wynikEl = document.getElementById('wynik-szukania');
  if (!q) { wynikEl.innerHTML = ''; return; }
  try {
    const data = await fetchJSON(`/api/wiki/search?q=${encodeURIComponent(q)}`);
    if (data.results.length === 0) {
      wynikEl.innerHTML = `<div class="warning-box">Brak wyników dla „${escapeHtml(q)}”. ${escapeHtml(data.suggestion || '')} ` +
        (data.suggestedArticle ? `<a href="wiki.html?slug=${encodeURIComponent(data.suggestedArticle.slug)}">${escapeHtml(data.suggestedArticle.title)}</a>` : '') +
        `</div>`;
    } else {
      wynikEl.innerHTML = '<div class="panel"><strong>Wyniki wyszukiwania:</strong><ul>' +
        data.results.map((r) => `<li><a href="wiki.html?slug=${encodeURIComponent(r.slug)}">${escapeHtml(r.title)}</a> — ${escapeHtml(r.summary || '')}</li>`).join('') +
        '</ul></div>';
      wynikEl.querySelectorAll('a').forEach((a) => {
        a.onclick = (ev) => {
          ev.preventDefault();
          const slug = new URL(a.href).searchParams.get('slug');
          otworzArtykul(slug);
        };
      });
    }
  } catch (err) {
    wynikEl.innerHTML = `<div class="warning-box">Błąd wyszukiwania: ${err.message}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await zaladujListe();
  zaladujOstatnieZmiany();

  document.getElementById('form-szukaj').addEventListener('submit', wykonajWyszukiwanie);
  document.getElementById('btn-nowy-artykul').addEventListener('click', otworzFormularzNowy);
  document.getElementById('btn-edytuj').addEventListener('click', otworzFormularzEdycji);
  document.getElementById('btn-usun').addEventListener('click', usunArtykul);
  document.getElementById('form-artykul').addEventListener('submit', zapiszFormularz);
  document.getElementById('btn-anuluj-formularz').addEventListener('click', () => {
    pokazWidok(biezacyArtykul ? 'artykul' : 'lista');
  });

  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  if (slug) {
    otworzArtykul(slug);
  } else {
    pokazWidok('lista');
  }
});

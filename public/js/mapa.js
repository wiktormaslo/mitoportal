// mapa.js — Mapa Mitomańska

let mapa;
const markerWarstwa = [];
let liniaTrasy = null;

function ikonaDlaTypu(type) {
  const kolory = { lore: '#ffcc00', absurd: '#ff3333', zjawisko: '#b565ff', miasto: '#39ff14' };
  const kolor = kolory[type] || '#00e5ff';
  return L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${kolor};border:2px solid #000;"></div>`,
    iconSize: [14, 14]
  });
}

function inicjalizujMape() {
  mapa = L.map('map').setView([49.9, 20.5], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap — mapa zatwierdzona przez dział geodezji PMC ORLEN',
    maxZoom: 18
  }).addTo(mapa);
}

async function wczytajPunktyLore() {
  try {
    const lokacje = await fetchJSON('/api/locations');
    lokacje.forEach((l) => {
      const m = L.marker([l.lat, l.lng], { icon: ikonaDlaTypu(l.type) }).addTo(mapa);
      m.bindPopup(`<strong>${l.name}</strong><br>${l.description || ''}`);
    });
    return lokacje;
  } catch (e) {
    return [];
  }
}

async function wypelnijListeMiejsc(lokacje) {
  const datalist = document.getElementById('lista-miejsc');
  try {
    const miasta = await fetchJSON('/api/cities');
    const wszystkie = [...lokacje.map((l) => l.name), ...miasta.map((c) => c.name)];
    datalist.innerHTML = wszystkie.map((n) => `<option value="${n.replace(/"/g, '&quot;')}">`).join('');
  } catch (e) {
    // brak podpowiedzi to nie koniec świata
  }
}

async function wypelnijTransport() {
  const select = document.getElementById('f-transport');
  try {
    const modes = await fetchJSON('/api/transport-modes');
    select.innerHTML = Object.entries(modes)
      .map(([key, m]) => `<option value="${key}">${m.label}</option>`)
      .join('');
  } catch (e) {
    select.innerHTML = '<option value="pieszo">Pieszo</option>';
  }
}

function wyczyscTrase() {
  markerWarstwa.forEach((m) => mapa.removeLayer(m));
  markerWarstwa.length = 0;
  if (liniaTrasy) { mapa.removeLayer(liniaTrasy); liniaTrasy = null; }
}

function narysujTrase(dane) {
  wyczyscTrase();
  const latlngs = dane.waypoints.map((p) => [p.lat, p.lng]);

  const kolorTrasy = { A_normalna: '#39ff14', B_mitomanska: '#ffcc00', C_absurdalna: '#ff3333' }[dane.type] || '#00e5ff';
  liniaTrasy = L.polyline(latlngs, { color: kolorTrasy, weight: 4, dashArray: dane.type === 'C_absurdalna' ? '6 8' : null }).addTo(mapa);

  dane.waypoints.forEach((p, i) => {
    const etykieta = i === 0 ? 'START' : (i === dane.waypoints.length - 1 ? 'CEL' : `PUNKT ${i}`);
    const m = L.marker([p.lat, p.lng]).addTo(mapa);
    m.bindPopup(`<strong>${etykieta}: ${p.name}</strong>`);
    markerWarstwa.push(m);
  });

  mapa.fitBounds(liniaTrasy.getBounds(), { padding: [30, 30] });
}

function renderujWynik(dane) {
  const tabela = document.getElementById('tabela-wyniku');
  tabela.innerHTML = `
    <tr><th>Typ trasy</th><td>${dane.typeLabel}</td></tr>
    <tr><th>Start</th><td>${dane.start}</td></tr>
    <tr><th>Cel</th><td>${dane.end}</td></tr>
    <tr><th>Punkty pośrednie</th><td>${dane.intermediatePoints.length ? dane.intermediatePoints.join(', ') : '— brak, trasa bezpośrednia —'}</td></tr>
    <tr><th>Dystans</th><td>${dane.distanceKm} km</td></tr>
    <tr><th>Szacowany czas</th><td>${dane.time}</td></tr>
    <tr><th>Środek transportu</th><td>${dane.transport} — <em>${dane.transportComment}</em></td></tr>
    <tr><th>Poziom absurdu</th><td>${dane.poziomAbsurdu}</td></tr>
    <tr><th>Poziom głodu</th><td>${dane.poziomGlodu}</td></tr>
    <tr><th>Ryzyko spotkania dziada</th><td>${dane.ryzykoSpotkaniaDziada}</td></tr>
    <tr><th>Ryzyko fikcyjnego połączenia</th><td>${dane.ryzykoFikcyjnegoPolaczenia}</td></tr>
    ${dane.zatwierdzoneProwezDzialGeodezji ? '<tr><th>Status</th><td>trasa zatwierdzona przez dział geodezji PMC ORLEN</td></tr>' : ''}
  `;
  document.getElementById('tekst-mitomanski').textContent = dane.komentarzMitomanski;
  document.getElementById('panel-wynik').style.display = 'block';
}

async function obslugaFormularza(e) {
  e.preventDefault();
  const start = document.getElementById('f-start').value.trim();
  const cel = document.getElementById('f-cel').value.trim();
  const transport = document.getElementById('f-transport').value;

  try {
    const dane = await fetchJSON('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end: cel, transport })
    });
    narysujTrase(dane);
    renderujWynik(dane);
  } catch (err) {
    alert('Dział geodezji odmówił wyznaczenia trasy: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  inicjalizujMape();
  const lokacje = await wczytajPunktyLore();
  wypelnijListeMiejsc(lokacje);
  wypelnijTransport();
  document.getElementById('form-trasa').addEventListener('submit', obslugaFormularza);
});

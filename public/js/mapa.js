// mapa.js — Mapa Mitomańska

let mapa;
const markerWarstwa = [];
let liniaTrasy = null;

function inicjalizujMape() {
  mapa = L.map('map').setView([49.9, 20.5], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap — mapa zatwierdzona przez dział geodezji PMC ORLEN',
    maxZoom: 18
  }).addTo(mapa);
}

// Lokalizacje wczytujemy WYŁĄCZNIE do podpowiedzi (datalist).
// Markery lore (Matterhorn, dom Kononowicza itp.) NIE pojawiają się na mapie,
// dopóki trasa faktycznie przez nie nie prowadzi.
async function wypelnijListeMiejsc() {
  const datalist = document.getElementById('lista-miejsc');
  try {
    const [lokacje, miasta] = await Promise.all([
      fetchJSON('/api/locations'),
      fetchJSON('/api/cities')
    ]);
    // Nie podpowiadamy punktów czysto absurdalnych — mają być niespodzianką.
    const nazwyLore = lokacje.filter((l) => l.type !== 'absurd').map((l) => l.name);
    const wszystkie = [...miasta.map((c) => c.name), ...nazwyLore];
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

  const kolorTrasy = { A_normalna: '#39ff14', B_mitomanska: '#ffcc00', C_absurdalna: '#ff3333' }[dane.type] || '#00e5ff';
  // dane.geometry to prawdziwa trasa po drogach; przy braku — proste odcinki między punktami.
  const latlngs = dane.geometry && dane.geometry.length ? dane.geometry : dane.waypoints.map((p) => [p.lat, p.lng]);
  liniaTrasy = L.polyline(latlngs, {
    color: kolorTrasy,
    weight: 4,
    dashArray: dane.routedByRoads ? null : '6 8'
  }).addTo(mapa);

  // Markery pojawiają się TYLKO dla punktów, przez które prowadzi ta trasa.
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
  const drogiInfo = dane.routedByRoads
    ? `${dane.distanceKm} km (po drogach)`
    : `${dane.distanceKm} km (w linii prostej — dział geodezji nie znalazł drogi)`;
  tabela.innerHTML = `
    <tr><th>Typ trasy</th><td>${dane.typeLabel}</td></tr>
    <tr><th>Start</th><td>${dane.start}</td></tr>
    <tr><th>Cel</th><td>${dane.end}</td></tr>
    <tr><th>Punkty pośrednie</th><td>${dane.intermediatePoints.length ? dane.intermediatePoints.join(', ') : '— brak, trasa bezpośrednia —'}</td></tr>
    <tr><th>Dystans</th><td>${drogiInfo}</td></tr>
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

function pobierzTrybStartu() {
  const checked = document.querySelector('input[name="start-mode"]:checked');
  return checked ? checked.value : 'text';
}

// Prosi o zgodę na lokalizację DOPIERO tu (po wybraniu opcji GPS i kliknięciu).
function pobierzWspolrzedne() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Twoja przeglądarka nie udostępnia lokalizacji.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'Odmówiono dostępu do lokalizacji.' : 'Nie udało się pobrać lokalizacji.')),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

async function obslugaFormularza(e) {
  e.preventDefault();
  const cel = document.getElementById('f-cel').value.trim();
  const transport = document.getElementById('f-transport').value;
  const tryb = pobierzTrybStartu();
  const gpsStatus = document.getElementById('gps-status');

  if (!cel) { alert('Podaj punkt docelowy.'); return; }

  const body = { end: cel, transport };

  if (tryb === 'gps') {
    gpsStatus.textContent = 'Proszę o dostęp do lokalizacji...';
    try {
      const coords = await pobierzWspolrzedne();
      body.startLat = coords.lat;
      body.startLng = coords.lng;
      gpsStatus.textContent = `Lokalizacja pobrana: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    } catch (err) {
      gpsStatus.textContent = '⚠ ' + err.message;
      return;
    }
  } else {
    const start = document.getElementById('f-start').value.trim();
    if (!start) { alert('Podaj punkt startowy albo wybierz lokalizację GPS.'); return; }
    body.start = start;
  }

  try {
    const dane = await fetchJSON('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    narysujTrase(dane);
    renderujWynik(dane);
  } catch (err) {
    alert('Dział geodezji odmówił wyznaczenia trasy: ' + err.message);
  }
}

function aktualizujTrybStartu() {
  const tryb = pobierzTrybStartu();
  const input = document.getElementById('f-start');
  input.disabled = tryb === 'gps';
  input.style.opacity = tryb === 'gps' ? '0.5' : '1';
  if (tryb === 'text') document.getElementById('gps-status').textContent = '';
}

document.addEventListener('DOMContentLoaded', () => {
  inicjalizujMape();
  wypelnijListeMiejsc();
  wypelnijTransport();
  document.getElementById('form-trasa').addEventListener('submit', obslugaFormularza);
  document.querySelectorAll('input[name="start-mode"]').forEach((r) =>
    r.addEventListener('change', aktualizujTrybStartu));
});

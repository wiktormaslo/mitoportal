const express = require('express');
const { geocode } = require('../geocode');
const router = express.Router();

const WARUNKI = [
  'ulewa', 'grad', 'mokry śnieg', 'huragan', 'błoto', 'mgła', 'boczny deszcz',
  'deszcz wpadający przez otwarte szyby', 'upał i jednocześnie marznący deszcz',
  'front prostatyczny', 'ciśnienie dziadowskie', 'burza nad pionowym jeziorem',
  'wiatr halny od Rumunii', 'opad śmierdzących skarpet'
];

const OSTRZEZENIA = [
  'W {miejsce} występuje lokalny front prostatyczny. Pan Piłeczka oddał mocz cztery razy w ciągu godziny, co oznacza nadciągającą burzę.',
  'Nad {miejsce} formuje się ciśnienie dziadowskie. Zalecana Mentalność Grubasa.',
  'W okolicach {miejsce} możliwy opad śmierdzących skarpet. Zamknij okna, jeśli je masz.',
  'Rezonans prostaty Pana Piłeczki wskazuje na gwałtowne pogorszenie pogody nad {miejsce}.',
  'Bracia Akwalung potwierdzają wysoki stan Pionowego Jeziora w okolicach {miejsce}.',
  'Twierdzenie Grubasa nie znajduje w {miejsce} temperatury minimalnego zużycia energii.',
  'Bez względu na porę roku, w {miejsce} będzie źle.'
];

// Mapowanie kodów pogody WMO (Open-Meteo) na polskie opisy.
const WMO = {
  0: 'bezchmurnie', 1: 'głównie bezchmurnie', 2: 'częściowe zachmurzenie', 3: 'zachmurzenie całkowite',
  45: 'mgła', 48: 'osadzająca się mgła',
  51: 'słaba mżawka', 53: 'mżawka', 55: 'gęsta mżawka',
  56: 'marznąca mżawka', 57: 'gęsta marznąca mżawka',
  61: 'słaby deszcz', 63: 'deszcz', 65: 'silny deszcz',
  66: 'marznący deszcz', 67: 'silny marznący deszcz',
  71: 'słaby śnieg', 73: 'śnieg', 75: 'intensywny śnieg', 77: 'krupa śnieżna',
  80: 'przelotny deszcz', 81: 'przelotne opady', 82: 'gwałtowne ulewy',
  85: 'przelotny śnieg', 86: 'intensywny przelotny śnieg',
  95: 'burza', 96: 'burza z gradem', 99: 'silna burza z gradem'
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return +v.toFixed(decimals);
}

async function fetchJSONTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const resp = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mitoportal-PMC-ORLEN/1.0 (+https://github.com/wiktormaslo/mitoportal)' } });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Ustala współrzędne: znane lokalizacje/miasta -> Open-Meteo -> Nominatim.
// Dodatkowy fallback (Nominatim) sprawia, że niemal każda wpisana lokalizacja
// się rozwiązuje, dzięki czemu częściej pokazujemy prawdziwą pogodę.
async function ustalWspolrzedne(place) {
  const local = geocode(place);
  if (local.known) return { lat: local.lat, lng: local.lng, name: local.name };

  const data = await fetchJSONTimeout(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(place)}&count=1&language=pl&format=json`
  );
  const r = data && data.results && data.results[0];
  if (r) return { lat: r.latitude, lng: r.longitude, name: r.name };

  // fallback: pełny geokoder adresów (Nominatim)
  const nom = await fetchJSONTimeout(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=jsonv2&limit=1&accept-language=pl`
  );
  const n = Array.isArray(nom) && nom[0];
  if (n) return { lat: +n.lat, lng: +n.lon, name: n.display_name.split(',')[0].trim() };
  return null;
}

function widocznoscZKodu(code, precip) {
  if (code === 45 || code === 48) return `${rand(50, 400)} metrów`;
  if (precip > 2 || [65, 67, 75, 82, 95, 96, 99].includes(code)) return `${rand(1000, 5000)} metrów`;
  return 'ponad 10 km';
}

// Mapowanie symboli MET Norway (yr.no) na polskie opisy.
function symbolMetNo(code) {
  if (!code) return 'warunki nieokreślone';
  const s = code.replace(/_(day|night|polartwilight)$/,'');
  if (s.includes('thunder')) return 'burza';
  if (s.includes('sleet')) return 'deszcz ze śniegiem';
  if (s.includes('snow')) return s.includes('showers') ? 'przelotny śnieg' : 'śnieg';
  if (s.includes('rain')) return s.includes('showers') ? 'przelotny deszcz' : (s.includes('heavy') ? 'silny deszcz' : 'deszcz');
  if (s.includes('fog')) return 'mgła';
  if (s === 'cloudy') return 'zachmurzenie całkowite';
  if (s.includes('partlycloudy')) return 'częściowe zachmurzenie';
  if (s === 'fair') return 'pogodnie';
  if (s === 'clearsky') return 'bezchmurnie';
  return 'zmienne zachmurzenie';
}

function budujPomiar(place, o) {
  return {
    place,
    temperature: `${Math.round(o.tempC)}°C`,
    feelsLike: `${Math.round(o.feelsC)}°C`,
    condition: o.condition,
    precipitation: `${o.precipMm} mm`,
    wind: `${Math.round(o.windKmh)} km/h`,
    humidity: `${Math.round(o.humidity)}%`,
    visibility: o.visibility,
    pressure: `${Math.round(o.pressure)} hPa`,
    zagrozeniePatoturystyczne: o.precipMm > 1 || o.windKmh > 40 ? 'podwyższone' : 'w normie',
    rezonansProstaty: 'NORMALNY',
    komunikat: `Odczyt z realnego pomiaru meteorologicznego dla: ${place}. Pan Piłeczka chwilowo nie zgłasza zastrzeżeń.`,
    zrodlo: 'pomiar'
  };
}

// Główne źródło: MET Norway (yr.no) — keyuje po User-Agent, nie po współdzielonym IP.
async function metNoPogoda(coords, place) {
  const data = await fetchJSONTimeout(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${coords.lat}&lon=${coords.lng}`
  );
  const ts = data && data.properties && data.properties.timeseries && data.properties.timeseries[0];
  const det = ts && ts.data && ts.data.instant && ts.data.instant.details;
  if (!det) return null;
  const nxt = ts.data.next_1_hours || {};
  const windKmh = (det.wind_speed || 0) * 3.6;
  const precip = (nxt.details && nxt.details.precipitation_amount) || 0;
  const symbol = nxt.summary && nxt.summary.symbol_code;
  return budujPomiar(place, {
    tempC: det.air_temperature,
    feelsC: det.air_temperature - windKmh / 12,
    condition: symbolMetNo(symbol),
    precipMm: precip,
    windKmh,
    humidity: det.relative_humidity,
    pressure: det.air_pressure_at_sea_level,
    visibility: precip > 2 ? `${rand(1000, 5000)} metrów` : 'ponad 10 km'
  });
}

// Zapas: Open-Meteo (na wypadek awarii met.no; na współdzielonym IP bywa 429).
async function openMeteoPogoda(coords, place) {
  const data = await fetchJSONTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m`
  );
  const c = data && data.current;
  if (!c) return null;
  return budujPomiar(place, {
    tempC: c.temperature_2m,
    feelsC: c.apparent_temperature,
    condition: WMO[c.weather_code] || 'warunki nieokreślone',
    precipMm: c.precipitation,
    windKmh: c.wind_speed_10m,
    humidity: c.relative_humidity_2m,
    pressure: c.surface_pressure,
    visibility: widocznoscZKodu(c.weather_code, c.precipitation)
  });
}

async function realnaPogoda(place) {
  const coords = await ustalWspolrzedne(place);
  if (!coords) return null;
  const nazwa = coords.name || place;
  return (await metNoPogoda(coords, nazwa)) || (await openMeteoPogoda(coords, nazwa));
}

function fejkowaPogoda(place) {
  const temp = rand(-15, 8, 0);
  const feelsLike = temp - rand(3, 14, 0);
  return {
    place,
    temperature: `${temp}°C`,
    feelsLike: `${feelsLike}°C`,
    condition: pick(WARUNKI),
    precipitation: `${rand(20, 220, 0)} mm`,
    wind: `${rand(30, 130, 0)} km/h`,
    humidity: `${rand(70, 100, 0)}%`,
    visibility: `${rand(3, 80, 0)} metrów`,
    pressure: `${rand(960, 1000, 0)} hPa`,
    zagrozeniePatoturystyczne: pick(['podwyższone', 'wysokie', 'bardzo wysokie', 'ekstremalne']),
    rezonansProstaty: pick(['NORMALNY', 'PODWYŻSZONY', 'KRYTYCZNY']),
    komunikat: pick(OSTRZEZENIA).replace('{miejsce}', place),
    zrodlo: 'mitomania'
  };
}

router.get('/weather', async (req, res) => {
  const place = (req.query.place || 'nieznana miejscowość').trim();

  // 70% prawdziwa pogoda, 30% mitomańska.
  if (Math.random() < 0.7) {
    const real = await realnaPogoda(place);
    if (real) return res.json(real);
    // gdy realne API zawiedzie — spadamy do wersji mitomańskiej
  }
  res.json(fejkowaPogoda(place));
});

module.exports = router;

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
    const resp = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'Mitoportal-PMC-ORLEN/1.0' } });
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

async function realnaPogoda(place) {
  const coords = await ustalWspolrzedne(place);
  if (!coords) return null;
  const data = await fetchJSONTimeout(
    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m`
  );
  const c = data && data.current;
  if (!c) return null;

  return {
    place: coords.name || place,
    temperature: `${Math.round(c.temperature_2m)}°C`,
    feelsLike: `${Math.round(c.apparent_temperature)}°C`,
    condition: WMO[c.weather_code] || 'warunki nieokreślone',
    precipitation: `${c.precipitation} mm`,
    wind: `${Math.round(c.wind_speed_10m)} km/h`,
    humidity: `${Math.round(c.relative_humidity_2m)}%`,
    visibility: widocznoscZKodu(c.weather_code, c.precipitation),
    pressure: `${Math.round(c.surface_pressure)} hPa`,
    zagrozeniePatoturystyczne: c.precipitation > 1 || c.wind_speed_10m > 40 ? 'podwyższone' : 'w normie',
    rezonansProstaty: 'NORMALNY',
    komunikat: `Odczyt z realnego pomiaru meteorologicznego dla: ${coords.name || place}. Pan Piłeczka chwilowo nie zgłasza zastrzeżeń.`,
    zrodlo: 'pomiar'
  };
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

// Diagnostyka: pokazuje, dlaczego realny pomiar się nie udaje (status HTTP / błąd).
router.get('/weather/diag', async (req, res) => {
  const place = (req.query.place || 'Sanok').trim();
  const out = { place };
  try {
    const coords = await ustalWspolrzedne(place);
    out.coords = coords;
    if (!coords) return res.json({ ...out, wynik: 'brak współrzędnych' });
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,surface_pressure,wind_speed_10m`;
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 10000);
    const started = Date.now();
    try {
      const r = await fetch(url, { signal: controller.signal });
      out.httpStatus = r.status;
      out.ms = Date.now() - started;
      out.body = (await r.text()).slice(0, 300);
    } catch (e) {
      out.fetchError = String(e && e.message || e);
      out.ms = Date.now() - started;
    } finally {
      clearTimeout(t);
    }
  } catch (e) {
    out.error = String(e && e.message || e);
  }
  res.json(out);
});

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

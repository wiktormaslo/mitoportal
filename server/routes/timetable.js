const express = require('express');
const router = express.Router();

// ===== Narzędzia losowe =====
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ===== Zapytania do zewnętrznych API (transitous / MOTIS) =====
async function fetchJSONTimeout(url, ms = 12000) {
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

async function geocodeTransitous(text) {
  const data = await fetchJSONTimeout(
    `https://api.transitous.org/api/v1/geocode?text=${encodeURIComponent(text)}&language=pl`
  );
  const r = Array.isArray(data) ? data.find((x) => x.lat && x.lon) : null;
  if (!r) return null;
  return { name: r.name, lat: r.lat, lon: r.lon };
}

// Format godziny w czasie polskim (API zwraca UTC).
function hhmm(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pl-PL', {
    timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit'
  });
}

function diffMin(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 60000));
}

// ===== Prawdziwe pociągi z MOTIS =====
async function realneKursy(from, to, isoTime) {
  const url = `https://api.transitous.org/api/v3/plan?fromPlace=${from.lat},${from.lon}` +
    `&toPlace=${to.lat},${to.lon}&time=${encodeURIComponent(isoTime)}` +
    `&transitModes=RAIL&numItineraries=7`;
  const data = await fetchJSONTimeout(url, 15000);
  if (!data || !data.itineraries) return [];
  const kursy = [];
  for (const it of data.itineraries) {
    const legs = it.legs.filter((l) => l.mode !== 'WALK' && l.from && l.to);
    if (!legs.length) continue;
    const first = legs[0], last = legs[legs.length - 1];
    const dep = first.from.departure || first.startTime;
    const arr = last.to.arrival || last.endTime;
    kursy.push({
      type: 'pkp',
      departureTime: hhmm(dep),
      arrivalTime: hhmm(arr),
      from: first.from.name,
      to: last.to.name,
      line: legs.map((l) => l.routeShortName || l.tripShortName || l.routeLongName).filter(Boolean).join(' → '),
      operator: [...new Set(legs.map((l) => l.agencyName).filter(Boolean))].join(', ') || 'PKP',
      transfers: legs.length - 1,
      durationMin: diffMin(dep, arr),
      real: true,
      arrivalProbability: randInt(75, 90),
      note: pick([
        'Kurs potwierdzony w rozkładzie.',
        'Połączenie realne, choć w Sanoku to i tak nic nie znaczy.',
        'Zatwierdzone przez dział geodezji PMC ORLEN.',
        'Pociąg prawdopodobnie istnieje fizycznie.'
      ]),
      _depSort: dep
    });
  }
  return kursy;
}

// ===== Zmyślone pociągi PKP =====
const KAT = ['IC', 'TLK', 'EIC', 'REGIO', 'Os', 'KM'];
const NAZWY = ['Bieszczadzki', 'Dziadowski', 'Mitoman', 'Prostatowy', 'Akwalung', 'Kononowicz',
  'Grubas', 'Wetliński', 'Halny', 'Fikcyjny', 'Sanocki', 'Piłeczka'];
const OPERATORZY_FAKE = ['PKP Intercity', 'POLREGIO', 'Koleje Małopolskie', 'PKP'];
const NOTKI_FAKE_PKP = [
  'Kurs istnieje wyłącznie w rozkładzie papierowym.',
  'Pociąg widziany ostatnio w 2019 roku.',
  'Peron zostanie ogłoszony już po odjeździe.',
  'Skład może zostać zastąpiony autobusem, który też nie przyjedzie.',
  'Dział geodezji PMC ORLEN nie ręczy za ten pociąg.',
  'Połączenie potwierdzone przez dziada ze schroniska.'
];

function fakeCzas() {
  const h = randInt(4, 22);
  const m = pick([0, 5, 12, 17, 23, 34, 41, 47, 53, 58]);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
function dodajMinuty(hhmmStr, mins) {
  const [h, m] = hhmmStr.split(':').map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function zmyslonyKursPKP(fromName, toName) {
  const kat = pick(KAT);
  const nazwa = ['IC', 'TLK', 'EIC'].includes(kat) && Math.random() < 0.7 ? ' ' + pick(NAZWY) : '';
  const dep = fakeCzas();
  const durationMin = randInt(45, 480);
  return {
    type: 'pkp',
    departureTime: dep,
    arrivalTime: dodajMinuty(dep, durationMin),
    from: fromName,
    to: toName,
    line: `${kat} ${randInt(3000, 99999)}${nazwa}`,
    operator: pick(OPERATORZY_FAKE),
    transfers: randInt(0, 3),
    durationMin,
    real: false,
    arrivalProbability: randInt(20, 50),
    note: pick(NOTKI_FAKE_PKP),
    _depSort: '2000-01-01T' + dep + ':00Z'
  };
}

// ===== Całkowicie zmyślony PKS =====
const PKS_PRZEWOZNICY = ['PisBus', 'Tranzystor Travel', 'Podkarpackie Koleje Samochodowe'];
const NOTKI_PKS = [
  'Odjazd orientacyjny, kierowca decyduje na miejscu.',
  'Przystanek bez wiaty, czekaj z nadzieją.',
  'Bus może być, ale nie musi.',
  'Kierowca zatrzymuje się na sikanie jak Pan Piłeczka.',
  'Kurs zależny od pogody i nastroju kierowcy.',
  'Płatność wyłącznie gotówką i dobrym słowem.',
  'Autobus bywa czerwonym Sprinterem z Kędzierzyna-Koźla.',
  'Trasa może prowadzić przez Rumunię, jeśli kierowca się zamyśli.'
];

function zmyslonyKursPKS(fromName, toName) {
  const dep = fakeCzas();
  const durationMin = randInt(40, 600);
  return {
    type: 'pks',
    departureTime: '~' + dep,
    arrivalTime: '~' + dodajMinuty(dep, durationMin),
    from: fromName,
    to: toName,
    line: `linia ${randInt(1, 999)}`,
    operator: pick(PKS_PRZEWOZNICY),
    transfers: randInt(0, 2),
    durationMin,
    real: false,
    orientational: true,
    arrivalProbability: randInt(10, 45),
    note: pick(NOTKI_PKS),
    _depSort: '2000-01-01T' + dep + ':00Z'
  };
}

function sortujPoOdjezdzie(a, b) {
  return String(a._depSort).localeCompare(String(b._depSort));
}

router.get('/rozklad', async (req, res) => {
  const fromText = (req.query.from || '').trim();
  const toText = (req.query.to || '').trim();
  const date = (req.query.date || new Date().toISOString().slice(0, 10)).trim();

  if (!fromText || !toText) {
    return res.status(400).json({ error: 'Podaj stację początkową i docelową.' });
  }

  // Geokodowanie stacji.
  const [fromGeo, toGeo] = await Promise.all([geocodeTransitous(fromText), geocodeTransitous(toText)]);
  const fromName = fromGeo ? fromGeo.name : fromText;
  const toName = toGeo ? toGeo.name : toText;

  // PKP: prawdziwe kursy + domieszka zmyślonych (docelowo ~70% real / 30% fake).
  let real = [];
  if (fromGeo && toGeo) {
    real = await realneKursy(fromGeo, toGeo, `${date}T05:00:00Z`);
  }
  let pkp;
  if (real.length) {
    const fakeCount = Math.max(1, Math.round((real.length * 0.3) / 0.7));
    const fake = Array.from({ length: fakeCount }, () => zmyslonyKursPKP(fromName, toName));
    pkp = [...real, ...fake].sort(sortujPoOdjezdzie);
  } else {
    // brak realnych połączeń — same zmyślone (np. trasa bez kolei)
    pkp = Array.from({ length: randInt(3, 5) }, () => zmyslonyKursPKP(fromName, toName)).sort(sortujPoOdjezdzie);
  }

  // PKS: całkowicie zmyślony.
  const pks = Array.from({ length: randInt(3, 5) }, () => zmyslonyKursPKS(fromName, toName)).sort(sortujPoOdjezdzie);

  // Sprzątamy pola pomocnicze.
  const strip = (k) => { const { _depSort, ...rest } = k; return rest; };

  res.json({
    from: fromName,
    to: toName,
    date,
    realneZnalezione: real.length,
    pkp: pkp.map(strip),
    pks: pks.map(strip)
  });
});

module.exports = router;

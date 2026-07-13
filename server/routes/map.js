const express = require('express');
const fs = require('fs');
const path = require('path');
const { geocode, haversineKm, locations, getPionoweJezioro } = require('../geocode');

const router = express.Router();

const routesConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'data', 'routes-config.json'), 'utf-8')
);

const MITOMANIA_POINTS = locations.filter((l) => l.type === 'lore' && l.id !== 'mitomanska-chata');
const ABSURD_POINTS = locations.filter((l) => l.type === 'absurd' || l.type === 'zjawisko');

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickMany(arr, count) {
  const copy = [...arr];
  const out = [];
  while (out.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
}

function resolvePoint(loreLocation) {
  if (loreLocation.id === 'pionowe-jezioro') return getPionoweJezioro();
  return loreLocation;
}

function pickRouteType() {
  const w = routesConfig.typeWeights;
  const r = Math.random();
  if (r < w.A_normalna) return 'A_normalna';
  if (r < w.A_normalna + w.B_mitomanska) return 'B_mitomanska';
  return 'C_absurdalna';
}

function buildWaypoints(start, end, type) {
  const points = [{ name: start.name, lat: start.lat, lng: start.lng }];

  if (type === 'B_mitomanska') {
    const detour = resolvePoint(pick(MITOMANIA_POINTS));
    points.push({ name: detour.name, lat: detour.lat, lng: detour.lng });
  } else if (type === 'C_absurdalna') {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 punktów
    const detours = pickMany(ABSURD_POINTS, count).map(resolvePoint);
    for (const d of detours) points.push({ name: d.name, lat: d.lat, lng: d.lng });
  }

  points.push({ name: end.name, lat: end.lat, lng: end.lng });
  return points;
}

function totalDistance(points) {
  let sum = 0;
  for (let i = 0; i < points.length - 1; i++) {
    sum += haversineKm(points[i], points[i + 1]);
  }
  return sum;
}

const MITOMANSKIE_KOMENTARZE = [
  'Trasa zatwierdzona przez dział geodezji PMC ORLEN.',
  'Pan Piłeczka potwierdza kierunek prostatą.',
  'Bracia Akwalung nie zgłosili zastrzeżeń do przebiegu trasy.',
  'Dział geodezji przypomina, że mapa może kłamać.',
  'Trasa zgodna z Twierdzeniem Grubasa.',
  'Zalecana Mentalność Grubasa przed wyruszeniem.',
  'Fikcyjny pociąg w Sanoku nie obsługuje tego kierunku.'
];

const KOMENTARZE_TYPU = {
  A_normalna: [
    'Trasa w miarę rozsądna. Dział geodezji jest równie zaskoczony jak Ty.',
    'Najkrótsza sensowna droga. Nudy, ale bezpiecznie.'
  ],
  B_mitomanska: [
    'Trasa prowadzi mniej więcej poprawnie, ale robi objazd przez obiekt związany z lore.',
    'Niewielki objazd. Warto, bo mitomańsko.'
  ],
  C_absurdalna: [
    'Trasa całkowicie absurdalna. Zalecany zapas jedzenia zgodnie z Mentalnością Grubasa.',
    'Najkrótsza trasa czasem wcale nie jest najkrótsza.'
  ]
};

function poziomAbsurdu(type) {
  if (type === 'A_normalna') return 'niski';
  if (type === 'B_mitomanska') return 'średni';
  return 'ekstremalny';
}

function ryzykoDziada(type, waypointCount) {
  const base = { A_normalna: 1, B_mitomanska: 2, C_absurdalna: 3 }[type];
  const score = base + waypointCount + Math.floor(Math.random() * 3);
  if (score <= 2) return 'niskie';
  if (score <= 4) return 'podwyższone';
  if (score <= 6) return 'wysokie';
  return 'ekstremalne';
}

router.get('/locations', (req, res) => {
  const withLiveJezioro = locations.map((l) => (l.id === 'pionowe-jezioro' ? getPionoweJezioro() : l));
  res.json(withLiveJezioro);
});

router.post('/route', (req, res) => {
  const { start, end, transport } = req.body || {};
  if (!start || !end || !transport) {
    return res.status(400).json({ error: 'Wymagane pola: start, end, transport.' });
  }
  const mode = routesConfig.transportModes[transport];
  if (!mode) {
    return res.status(400).json({ error: 'Nieznany środek transportu.' });
  }

  const startPoint = geocode(start);
  const endPoint = geocode(end);
  const type = pickRouteType();
  const waypoints = buildWaypoints(startPoint, endPoint, type);
  const distanceKm = +totalDistance(waypoints).toFixed(1);

  let timeText;
  if (mode.speedKmH === null) {
    timeText = 'nieznany, pociąg może nie istnieć';
  } else {
    const hours = distanceKm / mode.speedKmH;
    if (hours < 1) {
      timeText = `${Math.round(hours * 60)} min`;
    } else {
      const days = Math.floor(hours / 24);
      const remHours = Math.round(hours % 24);
      timeText = days > 0 ? `${days} dni ${remHours} godz.` : `${Math.round(hours)} godz.`;
    }
  }

  const intermediate = waypoints.slice(1, -1).map((p) => p.name);
  const comment = pick([...(KOMENTARZE_TYPU[type] || []), pick(MITOMANSKIE_KOMENTARZE)]);

  res.json({
    typeLabel: { A_normalna: 'trasa poprawna', B_mitomanska: 'trasa mitomańska', C_absurdalna: 'trasa absurdalna' }[type],
    type,
    start: startPoint.name,
    end: endPoint.name,
    waypoints,
    intermediatePoints: intermediate,
    distanceKm,
    time: timeText,
    transport: mode.label,
    transportComment: mode.comment,
    poziomAbsurdu: poziomAbsurdu(type),
    poziomGlodu: `${Math.min(10, Math.round(distanceKm / 50) + Math.floor(Math.random() * 4))}/10`,
    ryzykoSpotkaniaDziada: ryzykoDziada(type, intermediate.length),
    ryzykoFikcyjnegoPolaczenia: transport === 'pkp' ? 'wysokie' : pick(['niskie', 'umiarkowane', 'wysokie']),
    komentarzMitomanski: comment,
    zatwierdzoneProwezDzialGeodezji: type === 'C_absurdalna'
  });
});

module.exports = router;

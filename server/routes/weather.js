const express = require('express');
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

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max, decimals = 0) {
  const v = Math.random() * (max - min) + min;
  return +v.toFixed(decimals);
}

router.get('/weather', (req, res) => {
  const place = (req.query.place || 'nieznana miejscowość').trim();

  const temp = rand(-15, 8, 0);
  const feelsLike = temp - rand(3, 14, 0);

  res.json({
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
    komunikat: pick(OSTRZEZENIA).replace('{miejsce}', place)
  });
});

module.exports = router;

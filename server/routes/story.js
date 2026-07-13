const express = require('express');
const db = require('../database');

const router = express.Router();

const MIEJSCA = [
  'Cisnej', 'Wetliny', 'Komańczy', 'Duszatynu', 'Sanoka', 'Kotlarni', 'Wisły',
  'Mitomańskiej Chaty', 'Pionowego Jeziora', 'Matterhornu', 'Rumunii'
];

const POSTACIE = [
  'Rawski', 'Pan Piłeczka', 'Dziad Poparzone Ręce', 'Mitoman', 'Juno',
  'Bracia Akwalung', 'przypadkowy dziad ze schroniska', 'rekonstruktor spod Koźla'
];

const TEORIE = [
  'Twierdzenie Grubasa działa również pod wodą',
  'Pionowe Jezioro jest w rzeczywistości poziome, tylko z innej strony',
  'fikcyjny pociąg w Sanoku kursuje wyłącznie dla wtajemniczonych',
  'rezonans prostaty można wzmocnić poprzez picie Jägermeistera',
  'Matterhorn przesuwa się bliżej Polski raz na dekadę',
  'Bracia Akwalung sterują pogodą z głębi Pionowego Jeziora',
  'dziady komunikują się między sobą przez PRT.FM na częstotliwościach niesłyszalnych dla ludzi'
];

const TRANSPORT = [
  'Ford Ranger Raptor Code Orange', 'UAZ Pana Piłeczki', 'PKS o nieustalonej godzinie',
  'fikcyjny pociąg', 'czerwony Mercedes Sprinter z tablicami z Kędzierzyna-Koźla',
  'marsz na czworakach tyłem'
];

const ZAKONCZENIA = [
  'gdzie przez trzy godziny słuchali PRT.FM.',
  'co uznano za w pełni normalny przebieg wyprawy.',
  'i nikt nigdy więcej o tym nie wspomniał, jakby zawsze tak było.',
  'a dział geodezji PMC ORLEN uznał trasę za zatwierdzoną z mocą wsteczną.',
  'po czym ogłoszono nowy rozdział Dziadologii.',
  'co potwierdza Twierdzenie Grubasa po raz kolejny.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

router.get('/story', (req, res) => {
  const articles = db.prepare('SELECT title, slug FROM wiki_articles').all();
  const miejsceStart = pick(MIEJSCA);
  const miejsceKoniec = pick(articles).title;
  const postac = pick(POSTACIE);
  const teoria = pick(TEORIE);
  const transport = pick(TRANSPORT);
  const dziad = pick(POSTACIE.filter((p) => p !== postac));
  const zakonczenie = pick(ZAKONCZENIA);

  const text = `W drodze do ${miejsceStart} grupa spotkała ${postac}, który twierdził, że ${teoria}. ` +
    `Po awarii pojazdu (${transport}) wszyscy trafili do miejsca znanego z artykułu „${miejsceKoniec}”, ` +
    `gdzie na miejscu czekał już ${dziad}. Wyprawa zakończyła się tam, ${zakonczenie}`;

  res.json({
    text,
    elements: { miejsceStart, miejsceKoniec, postac, teoria, transport, dziad },
    canonLevel: pick(['relacja dziada', 'niepotwierdzone', 'totalna mitomania'])
  });
});

module.exports = router;

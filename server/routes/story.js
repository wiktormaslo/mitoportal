const express = require('express');
const db = require('../database');

const router = express.Router();

const MIEJSCA = [
  'Cisnej', 'Wetliny', 'Komańczy', 'Duszatynu', 'Sanoka', 'Kotlarni', 'Wisły',
  'Mitomańskiej Chaty', 'Pionowego Jeziora', 'Matterhornu', 'Rumunii',
  'Kędzierzyna-Koźla', 'Tarnowa', 'opuszczonej wiaty pod Cisną', 'skansenu w przypadkowej wsi',
  'baru mlecznego w Sanoku', 'stacji ORLEN pod Duszatynem', 'Ukraińskiego Burdelu w Wetlinie',
  'przystanku PKS bez rozkładu', 'schronu ratunkowego na przełęczy', 'fikcyjnego peronu w Sanoku',
  'kopalni piasku w Kotlarni', 'domu Kononowicza', 'granicy z Ukrainą', 'Media Expert w Wiśle',
  'muzeum regionalnego w Komańczy', 'chaty pod Czernicą', 'lasu bez zasięgu',
  'przełęczy, której nie ma na mapie', 'U Trolla w Cisnej', 'meliny pod wiatą',
  'pola pod lasem w Bieszczadach', 'zamkniętego schroniska', 'rzeki w Duszatynie',
  'przydrożnego Lewiatana', 'warsztatu naprawiającego UAZ-y od 1987 roku'
];

const POSTACIE = [
  'Rawski', 'Pan Piłeczka', 'Dziad Poparzone Ręce', 'Mitoman', 'Juno',
  'Bracia Akwalung', 'przypadkowy dziad ze schroniska', 'rekonstruktor spod Koźla',
  'dziad w kapeluszu', 'emerytowany kolejarz z papierowym rozkładem',
  'właściciel baru nieprzyjmujący kart', 'bushcrafter z siekierą i teorią',
  'kolekcjoner łusek z muszkietu', 'pan od UAZ-a spod Duszatyna',
  'przewodnik bez licencji, ale z pewnością siebie', 'rekonstruktor napoleoński na czczo',
  'dziad twierdzący, że zna Kononowicza osobiście', 'grzybiarz o zmroku',
  'weteran survivalu z termosem', 'człowiek sprzedający scyzoryki z bagażnika',
  'dziad znający wszystkie skróty (żaden nie działa)', 'radiowiec z PRT.FM',
  'pani ze skansenu, która wie wszystko', 'były komandos z własną wersją wydarzeń',
  'kartograf poprawiający mapy długopisem', 'dziad przekonany, że pionowe jezioro to spisek',
  'właściciel psa, który też jest dziadem', 'geodeta PMC ORLEN na delegacji',
  'traper z Bieszczad z jednym zębem', 'entuzjasta kolei wąskotorowej',
  'podejrzanie młody Pan Piłeczka', 'dwaj bracia podszywający się pod Akwalungów',
  'staruszek pamiętający, jak Matterhorn był bliżej'
];

const PROBLEMY = [
  'skończył się kluczyk do UAZ-a', 'błoto wpadło przez otwarte szyby',
  'pociąg jednak nie istniał', 'plecaki okazały się o 30 kg za ciężkie',
  'zabrakło jedzenia wbrew Mentalności Grubasa', 'mapa uparcie wskazywała Rumunię',
  'lusterko prawie się urwało', 'Rawski znalazł Jägermeistera',
  'prostata Pana Piłeczki zawyła alarm', 'zgubiono planszę Monopoly',
  'buty zaczęły śmierdzieć nie do zniesienia', 'padł ostatni powerbank',
  'droga zamieniła się w bagno', 'ktoś zapomniał namiotu',
  'w środku wyprawy ogłoszono prohibicję', 'GPS wskazał środek Pionowego Jeziora',
  'zabrakło zasięgu na trzy dni', 'wiatę zajęły już inne dziady',
  'UAZ zatrzymał się na kolejne sikanie', 'z lasu dobiegły rytualne bębny',
  'czerwony Sprinter znów zaczął krążyć w pobliżu', 'skończył się papier w papierowym rozkładzie',
  'okazało się, że skręt był 40 km temu', 'spadła mgła gęsta jak zupa',
  'ktoś zaproponował skrót przez Czechy'
];

const TEORIE = [
  'Twierdzenie Grubasa działa również pod wodą',
  'Pionowe Jezioro jest w rzeczywistości poziome, tylko z innej strony',
  'fikcyjny pociąg w Sanoku kursuje wyłącznie dla wtajemniczonych',
  'rezonans prostaty można wzmocnić poprzez picie Jägermeistera',
  'Matterhorn przesuwa się bliżej Polski raz na dekadę',
  'Bracia Akwalung sterują pogodą z głębi Pionowego Jeziora',
  'dziady komunikują się przez PRT.FM na częstotliwościach niesłyszalnych dla ludzi',
  'śmierdzące skarpety odstraszają niedźwiedzie na kilometr',
  'każdy prawdziwy dziad wyczuwa dworzec PKP przez ścianę',
  'na Matterhorn najlepiej wchodzić tyłem, żeby zmylić grawitację',
  'kózka rozumie po polsku, tylko nie chce odpowiadać',
  'Jägermeister podnosi morale o dokładnie 12 procent',
  'fikcyjny pociąg da się złapać, jeśli się w niego naprawdę uwierzy',
  'prostata to najstarszy barometr znany ludzkości',
  'niski kluczyk oznacza, że mapa akurat dziś kłamie',
  'błoto Kotlarni ma właściwości lecznicze',
  'PRT.FM nadaje również w snach',
  'każda wiata w Bieszczadach jest połączona podziemnym tunelem',
  'grubas nie marznie, bo działa jak żywy termos',
  'offroad to najczystsza forma medytacji',
  'prawdziwy dziad nigdy nie płaci kartą, bo karta go widzi',
  'Rumunia jest bliżej, niż się wydaje, jeśli jechać nocą',
  'muszkiet strzela celniej po Jägermeisterze',
  'każdy skansen to portal do lat 70.',
  'Kononowicz zna najkrótszą drogę do Cisnej',
  'śmierdzące buty schną szybciej, jeśli się je przeklina',
  'pionowe jezioro to tak naprawdę bardzo głęboki korytarz',
  'czerwony Sprinter to nie samochód, tylko stan umysłu',
  'dziad w kapeluszu widzi pogodę na trzy dni w przód',
  'na czworakach idzie się szybciej, tylko trwa to dłużej',
  'każdy prawdziwy szczyt zdobywa się, jedząc coś obrzydliwego'
];

const TRANSPORT = [
  'Ford Ranger Raptor Code Orange', 'UAZ Pana Piłeczki', 'PKS o nieustalonej godzinie',
  'fikcyjny pociąg', 'czerwony Mercedes Sprinter z tablicami z Kędzierzyna-Koźla',
  'marsz na czworakach tyłem', 'rower z jednym biegiem pod górę',
  'traktor pożyczony od dziada', 'autostop pod Lewiatanem',
  'wojskowy Star 266 bez tłumika', 'rozklekotany bus do Komańczy',
  'kajak po Pionowym Jeziorze (pionowo)', 'sanie, mimo lata',
  'quad z urwanym błotnikiem', 'konny wóz z Bieszczad',
  'motorower Pana Piłeczki juniora', 'drezyna z fikcyjnej linii kolejowej',
  'taksówka, która nie zna drogi', 'ciężarówka wioząca skarpety',
  'łódź Braci Akwalung', 'deskorolka na szutrze',
  'Fiat 126p z czterema dziadami', 'UAZ z demobilu',
  'rower cargo z całym obozem', 'hulajnoga na przełęczy',
  'ciągnik siodłowy bez naczepy', 'balon, który nie chciał wystartować',
  'czołg z rekonstrukcji (bez amunicji)', 'łódź podwodna widziana tylko przez Rawskiego',
  'marsz na czworakach tyłem, wariant zaawansowany'
];

const ZAKONCZENIA = [
  'gdzie przez trzy godziny słuchali PRT.FM.',
  'co uznano za w pełni normalny przebieg wyprawy.',
  'i nikt nigdy więcej o tym nie wspomniał, jakby zawsze tak było.',
  'a dział geodezji PMC ORLEN uznał trasę za zatwierdzoną z mocą wsteczną.',
  'po czym ogłoszono nowy rozdział Dziadologii.',
  'co potwierdza Twierdzenie Grubasa po raz kolejny.',
  'gdzie do rana grało PRT.FM z jednego głośnika.',
  'a rano nikt nie pamiętał, jak tam dotarli.',
  'po czym uznano to za sukces większy niż zakładano.',
  'i wpisano całość do kroniki jako „w pełni udane”.',
  'gdy prostata Pana Piłeczki ogłosiła koniec załamania pogody.',
  'a Rawski ustanowił kolejną prohibicję.',
  'gdzie dział geodezji domalował trasę długopisem.',
  'i wszyscy zgodnie orzekli, że im gorzej, tym lepiej.',
  'po czym powstał nowy raport dziadologiczny.',
  'gdy skończyły się zapasy przewidziane Mentalnością Grubasa.',
  'a Bracia Akwalung pokiwali głowami z głębi jeziora.',
  'gdzie Matterhorn był akurat najbliżej Polski.',
  'i uznano, że pociąg jednak istniał, ale duchowo.',
  'po zjedzeniu czegoś, o czym lepiej nie pisać.',
  'gdy kózka wreszcie się odezwała, ale nikt jej nie zrozumiał.',
  'a mapa przyznała się, że kłamała od początku.',
  'gdzie wszyscy spali pod wiatą, jak nakazuje tradycja.',
  'i nazwano to miejsce kolejnym Ukraińskim Burdelem.',
  'po czym ślad po grupie zaginął na cztery godziny.',
  'gdy śmierdzące buty w końcu wyschły, cudem.',
  'a dziad ze schroniska pobłogosławił wyprawę.',
  'gdzie czerwony Sprinter zniknął równie tajemniczo, jak się pojawił.',
  'i cała historia trafiła prosto do kanonu.',
  'po tym, jak Twierdzenie Grubasa potwierdziło się eksperymentalnie.',
  'a wszyscy zgodzili się nigdy tego nie tłumaczyć.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function kapitalizuj(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Sześć różnych formatów artykułu — każdy korzysta z tych samych elementów.
const FORMATY = [
  // 1. Klasyczna relacja z drogi
  (e) => `W drodze do ${e.miejsceStart} grupa spotkała ${e.postac}, który twierdził, że ${e.teoria}. ` +
    `Wtedy ${e.problem}. Po awarii pojazdu (${e.transport}) wszyscy trafili do miejsca znanego z artykułu „${e.miejsceKoniec}”, ` +
    `gdzie na miejscu czekał już ${e.dziad}. Wyprawa zakończyła się tam, ${e.zakonczenie}`,

  // 2. Raport terenowy
  (e) => `Raport z rejonu ${e.miejsceStart}: odnotowano obecność, którą sklasyfikowano jako ${e.postac}. ` +
    `Świadek konsekwentnie utrzymywał, że ${e.teoria}. W trakcie sporządzania dokumentacji ${e.problem}, ` +
    `co zmusiło zespół do przejścia na ${e.transport}. Sprawę zamknięto dopiero po dotarciu w rejon opisany w aktach „${e.miejsceKoniec}”, ${e.zakonczenie}`,

  // 3. Napędzana cytatem
  (e) => `„${kapitalizuj(e.teoria)}” — tymi słowami ${e.postac} przywitał grupę w okolicy ${e.miejsceStart}. ` +
    `Nikt nie zdążył dopytać, ponieważ ${e.problem}. Ostatecznie ${e.transport} okazał się jedynym wyjściem, ` +
    `a cała sprawa i tak skończyła się w rejonie „${e.miejsceKoniec}”, ${e.zakonczenie}`,

  // 4. Wpis kronikarski
  (e) => `Zapisano w kronice PMC ORLEN: tego dnia ekipa dotarła w okolice ${e.miejsceStart}. ` +
    `Na miejscu czekał ${e.dziad}, który bez pytania oświadczył, że ${e.teoria}. Gdy ${e.problem}, ` +
    `przesiadka na ${e.transport} stała się koniecznością. Kronikarz odnotował, że wszystko zakończyło się w rejonie „${e.miejsceKoniec}”, ${e.zakonczenie}`,

  // 5. Komunikat ostrzegawczy
  (e) => `Komunikat dla patoturystów kierujących się w stronę ${e.miejsceStart}: w rejonie potwierdzono ${e.postac}. ` +
    `Zgłoszono również, że ${e.teoria}. Uwaga — w zeszłym tygodniu ${e.problem}, dlatego zaleca się ${e.transport}. ` +
    `Trasa i tak prowadzi ostatecznie do „${e.miejsceKoniec}”, ${e.zakonczenie}`,

  // 6. Badanie naukowe
  (e) => `Badanie terenowe nr ${1000 + Math.floor(Math.random() * 9000)}: obiektem obserwacji był ${e.postac} w okolicy ${e.miejsceStart}. ` +
    `Postawiono hipotezę roboczą, że ${e.teoria}. Eksperyment przerwano, gdy ${e.problem}. ` +
    `Zespół ewakuował się przy pomocy środka „${e.transport}” do stanowiska „${e.miejsceKoniec}”, ${e.zakonczenie}`
];

router.get('/story', (req, res) => {
  const articles = db.prepare('SELECT title, slug FROM wiki_articles').all();
  const elements = {
    miejsceStart: pick(MIEJSCA),
    miejsceKoniec: pick(articles).title,
    postac: pick(POSTACIE),
    teoria: pick(TEORIE),
    problem: pick(PROBLEMY),
    transport: pick(TRANSPORT),
    zakonczenie: pick(ZAKONCZENIA)
  };
  elements.dziad = pick(POSTACIE.filter((p) => p !== elements.postac));

  const text = pick(FORMATY)(elements);

  res.json({
    text,
    elements,
    canonLevel: pick(['relacja dziada', 'niepotwierdzone', 'totalna mitomania'])
  });
});

module.exports = router;

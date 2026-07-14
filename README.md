# PMC ORLEN — Mitomański Internet

Oficjalny nieoficjalny portal patoturystyczny. Strona internetowa stylizowana na
prymitywny internet z końca lat 90., zbudowana na kanonie z pliku
[`PMC_ORLEN_LORE_AI_FULL.txt`](PMC_ORLEN_LORE_AI_FULL.txt).

Strona ma wyglądać brzydko, kiczowato i amatorsko — to jest zamierzone.
Nie poprawiać estetyki w stronę nowoczesnego designu.

## Współtworzenie treści (wiki / księga gości)

Dane użytkowników na darmowym hostingu są ulotne, dlatego trwałe treści dodaje się przez seedy:

1. **Zgłoszenie ze strony:** po dodaniu artykułu (Wiki) lub wpisu (Księga Gości) portal
   pokazuje gotowy JSON i automatycznie otwiera pocztę z prośbą o wysłanie go na
   `mitoportal.orlen@gmail.com`.
2. **Ingest:** wrzuć otrzymany plik `.json` (jeden obiekt albo tablicę) do
   [`data/inbox/`](data/inbox/) i uruchom:
   ```bash
   npm run merge-inbox
   ```
   Skrypt rozpozna typ (artykuł vs wpis księgi), scali dane do `data/wiki.json` /
   `data/guestbook.json`, a przetworzone pliki przeniesie do `data/inbox/processed/`.
3. **Publikacja:** commit + push — Render wczyta nowe seedy przy następnym deployu.

## Uruchomienie

Wymagany Node.js (testowane na v24).

```bash
npm install
npm start
```

Strona będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000)
(port można zmienić zmienną środowiskową `PORT`).

Przy pierwszym uruchomieniu backend automatycznie tworzy bazę SQLite
(`data/mitoportal.db`) i zasila ją artykułami wiki wygenerowanymi z pliku lore
(`data/wiki.json`) oraz startowymi wpisami w księdze gości.

## Wdrożenie na Render.com (link w przeglądarce)

Repozytorium zawiera blueprint [`render.yaml`](render.yaml), więc konfiguracja
jest automatyczna:

1. Załóż darmowe konto na [render.com](https://render.com) i połącz je z GitHubem.
2. Kliknij **New → Blueprint**, wybierz repozytorium `mitoportal`.
3. Render odczyta `render.yaml`, zbuduje aplikację (`npm install`) i uruchomi ją
   (`npm start`). Po chwili otrzymasz publiczny link, np. `https://mitoportal.onrender.com`.

Uwagi dot. darmowego planu:
- Usługa **usypia po ~15 min bezczynności** — pierwsze wejście po przerwie może
  trwać ~30 s (zimny start).
- Dysk jest **efemeryczny**: przy restarcie/redeployu baza SQLite jest tworzona od
  nowa. Artykuły wiki i wpisy księgi gości zawsze wracają (są zasiewane z
  `data/wiki.json` oraz `data/guestbook.json`), ale zmiany dodane przez
  użytkowników w trakcie działania resetują się przy restarcie.

### Zachowywanie treści między deployami (bez płacenia)

Zamiast płatnej bazy można ręcznie utrwalać treść przez eksport seedów:

1. Na działającej stronie kliknij **📥 Pobierz artykuły (JSON)** w Wiki
   (oraz **📥 Pobierz wpisy (JSON)** w Księdze Gości). Pobierają się pliki
   `wiki.json` / `guestbook.json` w formacie zgodnym z seedami.
2. Podmień nimi pliki w `data/` w repozytorium i zrób commit + push.
3. Po następnym deployu strona wystartuje już z tą treścią.

Format pobieranego pliku jest identyczny jak seed — wystarczy nadpisać
`data/wiki.json` / `data/guestbook.json`. Dla pełnej trwałości bez ręcznej pracy
podepnij na Render płatny **Persistent Disk** i ustaw `DATABASE_PATH` na ścieżkę
w tym dysku (np. `/var/data/mitoportal.db`).

## Struktura projektu

```
/
├── public/            frontend: HTML, CSS, JS, GIF-y
├── data/               dane startowe (JSON) + baza SQLite (tworzona automatycznie)
├── server/             backend Express (API + baza danych)
├── PMC_ORLEN_LORE_AI_FULL.txt   źródło kanonu — NIE nadpisywać
└── package.json
```

## Podstrony

| Strona | Opis |
|---|---|
| `index.html` | Strona główna: aktualności, licznik, cytaty, ostrzeżenia |
| `wiki.html` | Mitomańska encyklopedia — przeglądanie, wyszukiwanie, dodawanie i edycja artykułów |
| `mapa.html` | Mapa Mitomańska (Leaflet + OSM) — losowe trasy: poprawna / mitomańska / absurdalna |
| `pogoda.html` | Pogoda Mitomańska — zawsze zła, niezależnie od miejscowości |
| `historia.html` | Generator losowych historii ze świata PMC ORLEN |
| `archiwum.html` | Oś czasu wypraw (Stampnica 2022, Bieszczady 2024, Offroad Kotlarnia 2026...) |
| `ksiega-gosci.html` | Księga gości w stylu 2001 roku |
| `o-stronie.html` | O portalu, zasadach świata i technologii |

## API (backend)

Pełna lista pod `server/routes/*.js`, m.in.:

- `GET/POST/PUT/DELETE /api/wiki` — artykuły wiki
- `GET /api/wiki/search?q=` — wyszukiwarka (z podpowiedzią "czy chodziło ci o dziada?")
- `GET /api/locations`, `POST /api/route` — mapa i losowe trasy
- `GET /api/weather?place=` — zawsze zła pogoda
- `GET /api/story` — losowa historia
- `GET/POST /api/guestbook` — księga gości
- `GET /api/counter`, `GET /api/status` — licznik odwiedzin, status prohibicji/pociągu

## Zasady rozwoju treści

Nowe artykuły wiki i historie mogą rozszerzać kanon, ale powinny pozostać wierne
zasadom z pliku lore: poważny ton, brak tłumaczenia absurdów, narastająca
mitomania. Plik `PMC_ORLEN_LORE_AI_FULL.txt` jest źródłem prawdy i nie powinien
być nadpisywany ani usuwany.

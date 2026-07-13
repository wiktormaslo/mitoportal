# PMC ORLEN — Mitomański Internet

Oficjalny nieoficjalny portal patoturystyczny. Strona internetowa stylizowana na
prymitywny internet z końca lat 90., zbudowana na kanonie z pliku
[`PMC_ORLEN_LORE_AI_FULL.txt`](PMC_ORLEN_LORE_AI_FULL.txt).

Strona ma wyglądać brzydko, kiczowato i amatorsko — to jest zamierzone.
Nie poprawiać estetyki w stronę nowoczesnego designu.

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

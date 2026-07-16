// randka.js — szemrany portal randkowy (3 warianty, losowo)

const DZIADY = [
  { img: 'dziad-1', name: 'Bogdan',   age: 64, bio: 'Mam własną wiatę i suchy śpiwór. Wpadniesz się ogrzać?' },
  { img: 'dziad-2', name: 'Zdzisław', age: 61, bio: 'Ułan w stanie spoczynku. Szukam kogoś do musztry.' },
  { img: 'dziad-3', name: 'Mirek',    age: 58, bio: 'Nurkuję głęboko. Także w uczuciach.' },
  { img: 'dziad-4', name: 'Ryszard',  age: 59, bio: 'Elastyczny bardziej, niż na to wyglądam.' },
  { img: 'dziad-5', name: 'Kazimierz',age: 62, bio: 'Klękam tylko przed Tobą i przed piecem.' },
  { img: 'dziad-6', name: 'Heniek',   age: 67, bio: 'Grubas z zasadami: jem dużo, kocham jeszcze więcej.' },
  { img: 'dziad-7', name: 'Waldek',   age: 55, bio: 'Mam własny akwalung i dwie beczki bimbru.' },
  { img: 'dziad-8', name: 'Tadeusz',  age: 60, bio: 'Znam skrót przez las. Wolę jednak iść powoli.' }
];

const TEKSTY = [
  'Mam suchy śpiwór i mokre zamiary 😏',
  'Napalę w piecu, wysuszymy razem skarpety 🔥',
  'Znam skrót przez las. Ale z Tobą pójdę okrężną 😉',
  'Moja prostata wykryła, że jest Ci samotnie.',
  'Umiem rozpalić ogień jedną zapałką. Ciebie rozpalę bez.',
  'Wpadnij na bimber. Mam dwie beczki i jedną ławę.',
  'Wiata M5, pełne wyposażenie. Zapraszam na noc 🌙',
  'Mam UAZ-a i dużo czasu. Podwiozę, dokąd zechcesz.',
  'Nie pytaj o wiek kluczyka. Pytaj, czy pasuje 😏',
  'Rozłożę namiot w 40 sekund. Resztę w Twoim tempie.',
  'Pussi fresh, pussi clean. Ja też jestem czysty.',
  'Zdobyłem Matterhorn tyłem. Ciebie zdobędę przodem.',
  'Mam kapelusz, muszkiet i wolny wieczór 🎩',
  'Czekam nad Pionowym Jeziorem. W górę i w dół 🌊'
];

const POWIADOMIENIA = [
  (d) => `<b>${d.name}</b> czeka na Ciebie — ${rnd(1,9)} km stąd`,
  (d) => `<b>${d.name}</b> polubił Twoje zdjęcie ❤`,
  (d) => `🔥 Ktoś w pobliżu chce się ogrzać (${rnd(1,5)} km)`,
  ()  => `Masz <b>${rnd(12,88)}</b> nowych zaproszeń!`,
  (d) => `<b>${d.name}</b> właśnie napisał: „jesteś tam?”`,
  ()  => `⚠ ${rnd(3,9)} dziadów obejrzało Twój profil w tej minucie`,
  (d) => `<b>${d.name}</b> jest teraz online i szuka wiaty`
];

function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) { const a = [...arr]; for (let i = a.length-1; i>0; i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function foto(d) { return `assets/randka/${d.img}.png`; }
const app = () => document.getElementById('app');

// ---------- POWIADOMIENIA (slide z prawej) ----------
let notifY = 60;
function powiadomienie() {
  const d = pick(DZIADY);
  const el = document.createElement('div');
  el.className = 'notif';
  el.style.top = notifY + 'px';
  el.innerHTML = pick(POWIADOMIENIA)(d) + ' <span style="float:right;cursor:pointer">✖</span>';
  document.body.appendChild(el);
  notifY += 62; if (notifY > 360) notifY = 60;
  el.querySelector('span').onclick = () => el.remove();
  setTimeout(() => el.remove(), 6000);
}

// ---------- POPUP CZATU (natarczywy, przeciągalny) ----------
function chatPopup() {
  const d = pick(DZIADY);
  const el = document.createElement('div');
  el.className = 'chat-pop';
  el.style.left = rnd(20, Math.max(30, innerWidth - 290)) + 'px';
  el.style.top = rnd(90, Math.max(120, innerHeight - 220)) + 'px';
  el.innerHTML = `
    <div class="bar"><span>💬 ${d.name}, ${d.age}</span><span class="x">✖</span></div>
    <div class="body">
      <img src="${foto(d)}" alt="${d.name}">
      <div class="msg">${pick(TEKSTY)}</div>
      <div class="row"><input placeholder="Napisz do ${d.name}..."><button>WYŚLIJ</button></div>
    </div>`;
  document.body.appendChild(el);
  // X czasem zamyka, czasem otwiera kolejny (szemrany portal)
  el.querySelector('.x').onclick = () => { el.remove(); if (Math.random() < 0.6) setTimeout(chatPopup, 200); };
  el.querySelector('button').onclick = () => {
    el.querySelector('.msg').innerHTML = pick(TEKSTY);
    el.querySelector('input').value = '';
  };
  dragify(el, el.querySelector('.bar'));
}
function dragify(el, handle) {
  let ox = 0, oy = 0, on = false;
  handle.onmousedown = (e) => { on = true; ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop; e.preventDefault(); };
  document.onmousemove = (e) => { if (on) { el.style.left = (e.clientX-ox)+'px'; el.style.top = (e.clientY-oy)+'px'; } };
  document.onmouseup = () => { on = false; };
}

// ---------- WARIANT 1: FORMULARZ ----------
function wariant1() {
  const d = pick(DZIADY);
  app().innerHTML = `
    <div class="v1-hero">
      <h1 class="blink">CZY SZUKASZ SAMOTNEGO DOJRZAŁEGO MĘŻCZYZNY?</h1>
      <img class="v1-photo" src="${foto(d)}" alt="samotny dziad">
      <p style="font-size:18px;color:#ffe000">${d.name}, ${d.age} lat, czeka ${rnd(1,4)} km od Ciebie!</p>
      <button class="big-btn" id="reg">❤ ZAREJESTRUJ SIĘ ZA DARMO ❤</button>
      <div id="formhost"></div>
    </div>`;
  document.getElementById('reg').onclick = () => {
    document.getElementById('formhost').innerHTML = `
      <form class="r-form" id="rform">
        <label>Twój pseudonim</label><input required placeholder="np. samotna_dusza_1987">
        <label>Wiek</label><input required type="number" placeholder="18">
        <label>Miejscowość</label><input required placeholder="np. Sanok (jeśli istnieje)">
        <label>Czego szukasz?</label>
        <select><option>Dojrzałego dziada z wiatą</option><option>Kogoś z UAZ-em</option>
        <option>Mistrza bimbru</option><option>Nurka z Pionowego Jeziora</option><option>Wszystkiego naraz</option></select>
        <label>Napisz coś o sobie</label><textarea rows="3" placeholder="Lubię błoto, ciężkie plecaki i deadpan..."></textarea>
        <label><input type="checkbox" style="width:auto" required> Oświadczam, że mam ukończone 18 lat i suchy śpiwór</label>
        <button class="big-btn" type="submit">WYŚLIJ ZGŁOSZENIE 💘</button>
      </form>`;
    document.getElementById('rform').onsubmit = (e) => {
      e.preventDefault();
      document.getElementById('formhost').innerHTML = `
        <div class="r-error">
          <div class="blink" style="font-size:20px">✖ BŁĄD 0x69B — REJESTRACJA NIEUDANA ✖</div><br>
          Serwer randkowy znajduje się chwilowo w Pionowym Jeziorze i nie odbiera.<br>
          Kod błędu: PROSTATA_TIMEOUT. Dział geodezji PMC ORLEN nie znalazł drogi do Twojego serca.<br>
          Bracia Akwalung próbują go wyłowić. Spróbuj ponownie <b>nigdy</b>.<br><br>
          [ Twoje zgłoszenie zostało wysłane do 4213 dziadów mimo błędu ]
        </div>`;
    };
  };
}

// ---------- WARIANT 2: APLIKACJA RANDKOWA ----------
function wariant2() {
  const lista = shuffle(DZIADY);
  app().innerHTML = `
    <h2 style="text-align:center;color:#ffe000;font-family:Impact">💞 DZIADOWIE W TWOJEJ OKOLICY 💞</h2>
    <div class="feed">${lista.map((d) => `
      <div class="card">
        <span class="online">● ONLINE</span><span class="dist">${rnd(1,9)} km</span>
        <div class="photo-box"><img src="${foto(d)}" alt="${d.name}"></div>
        <div class="name">${d.name}, ${d.age}</div>
        <div class="meta">Patoturysta • dostępny od zaraz</div>
        <div class="bio">${d.bio}</div>
        <button class="write-btn">💬 NAPISZ TERAZ</button>
      </div>`).join('')}</div>`;
  app().querySelectorAll('.write-btn').forEach((b) => b.onclick = chatPopup);
  // od razu kilka natarczywych popupów
  setTimeout(chatPopup, 400); setTimeout(chatPopup, 1600); setTimeout(chatPopup, 3200);
  if (!window._chatInt) window._chatInt = setInterval(chatPopup, 7000);
}

// ---------- WARIANT 3: WYBIERZ AI DZIADA ----------
function wariant3() {
  const grupa = shuffle(DZIADY).slice(0, 4);  // losowe 4, bez powtórzeń
  app().innerHTML = `
    <div class="v3">
      <h1 class="blink">WYBIERZ SWOJEGO AI DZIADA</h1>
      <p style="text-align:center;color:#ffb3e6">Każdy dziad w pełni sztuczny. Uczucia prawdziwe. Wybór należy do Ciebie.</p>
      <div class="v3-grid">${grupa.map((d) => `
        <div class="card">
          <div class="photo-box"><img src="${foto(d)}" alt="${d.name}"></div>
          <div class="name">${d.name}, ${d.age}</div>
          <div class="meta">AI DZIAD v${rnd(1,9)}.0 • model bushcraft</div>
          <button class="fuck-btn">CLICK TO FUCK</button>
        </div>`).join('')}</div>
      <p style="text-align:center"><button class="big-btn" id="reroll">🎲 POKAŻ INNYCH DZIADÓW</button></p>
    </div>`;
  app().querySelectorAll('.fuck-btn').forEach((b) => b.onclick = wariant2);   // -> wariant 2
  document.getElementById('reroll').onclick = wariant3;                        // rotacja losowa
}

// ---------- START: losowy wariant ----------
document.addEventListener('DOMContentLoaded', () => {
  [wariant1, wariant2, wariant3][rnd(0, 2)]();
  setInterval(powiadomienie, 4200);
  setTimeout(powiadomienie, 900);
});

// pogoda.js — Pogoda Mitomańska

async function sprawdzPogode(e) {
  e.preventDefault();
  const miejsce = document.getElementById('f-miejsce').value.trim();
  if (!miejsce) return;

  try {
    const dane = await fetchJSON(`/api/weather?place=${encodeURIComponent(miejsce)}`);
    document.getElementById('wynik-tytul').textContent = `Prognoza dla: ${dane.place}`;
    document.getElementById('tabela-pogody').innerHTML = `
      <tr><th>Temperatura</th><td>${dane.temperature}</td></tr>
      <tr><th>Odczuwalna</th><td>${dane.feelsLike}</td></tr>
      <tr><th>Warunki</th><td>${dane.condition}</td></tr>
      <tr><th>Opady</th><td>${dane.precipitation}</td></tr>
      <tr><th>Wiatr</th><td>${dane.wind}</td></tr>
      <tr><th>Wilgotność</th><td>${dane.humidity}</td></tr>
      <tr><th>Widoczność</th><td>${dane.visibility}</td></tr>
      <tr><th>Ciśnienie</th><td>${dane.pressure}</td></tr>
      <tr><th>Zagrożenie patoturystyczne</th><td>${dane.zagrozeniePatoturystyczne}</td></tr>
      <tr><th>Rezonans prostaty</th><td>${dane.rezonansProstaty}</td></tr>
    `;
    document.getElementById('komunikat-pogodowy').textContent = dane.komunikat;
    document.getElementById('panel-wynik').style.display = 'block';
  } catch (err) {
    alert('Serwis meteorologiczny odmówił współpracy: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('form-pogoda').addEventListener('submit', sprawdzPogode);
});

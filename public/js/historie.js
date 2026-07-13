// historie.js — Losowa Historia

async function generujHistorie() {
  try {
    const dane = await fetchJSON('/api/story');
    document.getElementById('tekst-historii').textContent = dane.text;
    document.getElementById('kanon-historii').textContent = dane.canonLevel;
    document.getElementById('panel-historia').style.display = 'block';
  } catch (err) {
    alert('Generator historii chwilowo milczy: ' + err.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-generuj').addEventListener('click', generujHistorie);
  generujHistorie();
});

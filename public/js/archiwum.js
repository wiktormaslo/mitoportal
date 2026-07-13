// archiwum.js — Archiwum Wypraw

async function zaladujArchiwum() {
  const kontener = document.getElementById('oś-czasu');
  try {
    const wyprawy = await fetchJSON('/api/expeditions');
    wyprawy.sort((a, b) => a.year - b.year);
    kontener.innerHTML = wyprawy.map((w) => `
      <div class="timeline-item">
        <div class="panel">
          <h2>${w.name} (${w.year})</h2>
          <div class="placeholder-photo">[ zdjęcie niedostępne — negatyw prawdopodobnie w Pionowym Jeziorze ]</div>
          <p><strong>Trasa:</strong> ${w.route}</p>
          <p><strong>Uczestnicy:</strong> ${w.participants.join(', ')}</p>
          <p><strong>Status:</strong> ${w.status}</p>
          <p><strong>Najważniejsze wydarzenia:</strong></p>
          <ul>${w.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>
          <table class="expedition-stats">
            <tr><th>Kilometry</th><td>${w.distanceKm} km</td>
                <th>Noclegi pod wiatą</th><td>${w.nightsUnderShelter}</td></tr>
            <tr><th>Spotkani dziadowie</th><td>${w.dziadySpotted}</td>
                <th>Poziom głodu</th><td>${w.hungerLevel}/10</td></tr>
            <tr><th>Poziom chaosu</th><td colspan="3">${w.chaosLevel}/10</td></tr>
          </table>
        </div>
      </div>
    `).join('');
  } catch (e) {
    kontener.innerHTML = '<p>Archiwum chwilowo niedostępne. Może zostało pod wiatą.</p>';
  }
}

document.addEventListener('DOMContentLoaded', zaladujArchiwum);

const fs = require('fs');
const path = require('path');

const locations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'locations.json'), 'utf-8'));
const cities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'cities.json'), 'utf-8'));

function normalize(str) {
  return str.toLowerCase().trim();
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Zwraca {name, lat, lng, known} dla dowolnej podanej nazwy miejsca.
// Nieznane nazwy dostają deterministyczne (na bazie hasha) współrzędne w granicach Polski,
// żeby ta sama nazwa zawsze prowadziła w to samo miejsce.
function geocode(name) {
  const n = normalize(name);

  const loc = locations.find((l) => normalize(l.name) === n || normalize(l.id) === n);
  if (loc) return { name: loc.name, lat: loc.lat, lng: loc.lng, known: true };

  const city = cities.find((c) => normalize(c.name) === n);
  if (city) return { name: city.name, lat: city.lat, lng: city.lng, known: true };

  const partial = locations.find((l) => normalize(l.name).includes(n) || n.includes(normalize(l.name)));
  if (partial) return { name: partial.name, lat: partial.lat, lng: partial.lng, known: true };

  const h = hashString(n);
  const lat = 49.0 + (h % 580) / 100; // 49.00 - 54.80
  const lng = 14.2 + ((h >> 8) % 1000) / 100; // 14.20 - 24.20
  return { name: name.trim(), lat, lng, known: false };
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function getPionoweJezioro() {
  const base = locations.find((l) => l.id === 'pionowe-jezioro');
  // Jezioro jest pionowe, więc jego współrzędne mają prawo dryfować.
  const jitterLat = (Math.random() - 0.5) * 0.6;
  const jitterLng = (Math.random() - 0.5) * 0.6;
  return {
    ...base,
    lat: +(base.lat + jitterLat).toFixed(5),
    lng: +(base.lng + jitterLng).toFixed(5)
  };
}

module.exports = { geocode, haversineKm, locations, cities, getPionoweJezioro };

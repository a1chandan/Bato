// Initialize the map
const map = L.map('map').setView([27.7, 85.4], 14);

// Add a base layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  opacity: 0.7,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Add a scale bar
L.control.scale({
  position: 'bottomleft',
  metric: true,
  imperial: true
}).addTo(map);

// Variables for GeoJSON layers
let geojsonLayer;
let parcelLayer;

// Load GeoJSON data
fetch('data/kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    geojsonLayer = L.geoJSON(data, {
      style: { color: 'blue', weight: 0.4 },
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      }
    });

    parcelLayer = L.geoJSON(data, {
      style: { color: 'red', weight: 1 },
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      }
    }).addTo(map);

    map.fitBounds(parcelLayer.getBounds());
  })
  .catch(error => console.error('Error loading GeoJSON:', error));


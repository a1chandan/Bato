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
      style: { color: 'blue', weight: 1 },
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      }
    });

    parcelLayer = L.geoJSON(data, {
      style: { color: 'red', weight: 2 },
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      }
    }).addTo(map);

    map.fitBounds(parcelLayer.getBounds());
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

// Add drawing controls with Leaflet-Draw
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

const drawControl = new L.Control.Draw({
  position: 'topright', // Place controls in the top-right corner
  draw: {
    polyline: {
      metric: true,
      feet: true,
      showLength: true // Display length while drawing
    },
    polygon: false,
    rectangle: false,
    circle: false,
    marker: false
  }
});

map.addControl(drawControl);

// Handle the drawn polyline for distance measurement
map.on(L.Draw.Event.CREATED, (event) => {
  const layer = event.layer;

  if (layer instanceof L.Polyline) {
    const latlngs = layer.getLatLngs();
    let totalDistance = 0;

    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    alert(`Total distance: ${totalDistance.toFixed(2)} meters (${(totalDistance * 3.28084).toFixed(2)} feet)`);
  }

  drawnItems.addLayer(layer);
});

// Initialize map
const map = L.map('map').setView([27.7, 85.4], 13); // Adjust the default view based on your data

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load GeoJSON data
fetch('data/kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    const parcels = L.geoJSON(data, {
      style: {
        color: "#999",
        weight: 1,
      }
    }).addTo(map);

    // Query form functionality
    document.getElementById('query-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      parcels.eachLayer(layer => {
        const props = layer.feature.properties;
        if (
          props.vdc === vdc &&
          props.wardno === wardno &&
          props.parcelno === parcelno
        ) {
          layer.setStyle({
            color: "#ff0000",
            weight: 3
          });
          map.fitBounds(layer.getBounds());
        } else {
          layer.setStyle({
            color: "#999",
            weight: 1
          });
        }
      });
    });
  });

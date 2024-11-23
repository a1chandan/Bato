// Initialize map
const map = L.map('map'); // No need to set view yet; we will center based on the GeoJSON

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load GeoJSON data
fetch('data/kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    // Add GeoJSON layer to the map
    const parcels = L.geoJSON(data, {
      style: {
        color: "#999",
        weight: 1,
      }
    }).addTo(map);

    // Automatically center the map based on the GeoJSON's bounding box
    const bounds = parcels.getBounds();
    map.fitBounds(bounds);

    // Query form functionality
    document.getElementById('query-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      // Highlight the selected parcel
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
          map.fitBounds(layer.getBounds()); // Zoom to the selected parcel
        } else {
          layer.setStyle({
            color: "#999",
            weight: 1
          });
        }
      });
    });
  });

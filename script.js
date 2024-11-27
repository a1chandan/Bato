// Include Turf.js (ensure you include the library in your HTML file)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>
// Include Leaflet.js (ensure you include the library in your HTML file)
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.3/dist/leaflet.css">
// <script src="https://unpkg.com/leaflet@1.9.3/dist/leaflet.js"></script>

// Initialize the map
const map = L.map('map').setView([27.7, 85.4], 14); // Default view to some center (latitude, longitude)

// Add a base layer with transparency
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  opacity: 0.7,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables to store the GeoJSON layers
let geojsonLayer; // Full dataset (Sheet Map)
let parcelLayer;  // Filtered dataset (Parcel Map)

// Layer to display distance labels
let distanceLabelLayer = L.layerGroup().addTo(map);

// Load GeoJSON data
fetch('data/kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    // Add the full GeoJSON data as the Sheet Map
    geojsonLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      },
      style: {
        color: 'blue',
        weight: 1
      }
    }).addTo(map); // Add the sheet map layer to the map

    // Add the Parcel Map (filtered layer) initially showing all data
    parcelLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      },
      style: {
        color: 'red',
        weight: 2
      }
    }).addTo(map);

    // Fit the map to the bounds of all parcels initially
    map.fitBounds(parcelLayer.getBounds());

    // Add distance labels aligned along sides of parcels
    const addDistanceLabels = (feature) => {
      const coordinates = feature.geometry.type === 'Polygon'
        ? feature.geometry.coordinates[0]
        : feature.geometry.coordinates[0][0];

      for (let i = 0; i < coordinates.length - 1; i++) {
        const start = coordinates[i];
        const end = coordinates[i + 1];

        const startPoint = turf.point(start);
        const endPoint = turf.point(end);
        const distance = turf.distance(startPoint, endPoint, { units: 'feet' });

        const midPoint = turf.midpoint(startPoint, endPoint);
        const angle = Math.atan2(end[1] - start[1], end[0] - start[0]) * (180 / Math.PI);

        L.marker([midPoint.geometry.coordinates[1], midPoint.geometry.coordinates[0]], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div style="transform: rotate(${angle}deg); white-space: nowrap;">${distance.toFixed(2)}'</div>`,
            iconSize: [50, 20]
          }),
          interactive: false
        }).addTo(distanceLabelLayer);
      }
    };

    // Add a search form to filter parcels
    document.getElementById('search-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      // Filter features based on input
      const filterFunction = (feature) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        return (
          (!vdc || VDC.toString() === vdc) &&
          (!wardno || WARDNO.toString() === wardno) &&
          (!parcelno || PARCELNO.toString() === parcelno)
        );
      };

      // Clear previous layers and labels
      if (parcelLayer) map.removeLayer(parcelLayer);
      distanceLabelLayer.clearLayers();

      // Apply filter and add new parcelLayer
      parcelLayer = L.geoJSON(data, {
        filter: filterFunction,
        style: {
          color: 'red',
          weight: 2
        }
      }).addTo(map);

      if (parcelLayer.getLayers().length > 0) {
        const firstLayer = parcelLayer.getLayers()[0];
        map.fitBounds(firstLayer.getBounds()); // Zoom to the first matching parcel
        addDistanceLabels(firstLayer.feature); // Add labels to the parcel sides
      } else {
        alert('No parcels found matching your query.');
      }
    });
  })
  .catch((error) => console.error('Error loading GeoJSON:', error));

// Include Turf.js (ensure you include the library in your HTML file)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/Turf.js/6.5.0/turf.min.js"></script>

// Initialize the map
const map = L.map('map').setView([27.7, 85.4], 14);

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
    });

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

    // Function to filter data based on query and display only the filtered parcels
    const displayFilteredData = (filterFunction) => {
      // Clear the previous parcelLayer and distance labels
      if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }
      distanceLabelLayer.clearLayers();

      // Create a new parcelLayer with the filtered data
      parcelLayer = L.geoJSON(data, {
        filter: filterFunction,
        onEachFeature: function (feature, layer) {
          const { VDC, WARDNO, PARCELNO } = feature.properties;
          layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
        },
        style: {
          color: 'red',
          weight: 2
        }
      }).addTo(map);

      // Zoom to the filtered parcel's bounds
      if (parcelLayer.getLayers().length > 0) {
        const parcel = parcelLayer.getLayers()[0]; // Get the first (and typically only) feature
        map.fitBounds(parcel.getBounds());

        // Add distance labels to the parcel sides with sharp bends
        addDistanceLabels(parcel.feature);
      } else {
        alert('No parcels found matching your query.');
      }
    };

    // Function to calculate the angle between two vectors
    const calculateAngle = (a, b, c) => {
      const ba = [a[0] - b[0], a[1] - b[1]];
      const bc = [c[0] - b[0], c[1] - b[1]];

      const dotProduct = ba[0] * bc[0] + ba[1] * bc[1];
      const magnitudeBA = Math.sqrt(ba[0] ** 2 + ba[1] ** 2);
      const magnitudeBC = Math.sqrt(bc[0] ** 2 + bc[1] ** 2);

      const cosineAngle = dotProduct / (magnitudeBA * magnitudeBC);
      const angleRadians = Math.acos(cosineAngle);

      return (angleRadians * 180) / Math.PI; // Convert to degrees
    };

    // Function to add distance labels for sides with sharp bends
    const addDistanceLabels = (feature) => {
      const geometryType = feature.geometry.type;

      let coordinates;
      if (geometryType === 'Polygon') {
        coordinates = feature.geometry.coordinates[0]; // Outer ring of the polygon
      } else if (geometryType === 'MultiPolygon') {
        coordinates = feature.geometry.coordinates[0][0]; // First outer ring of the first polygon
      } else {
        console.error(`Unsupported geometry type: ${geometryType}`);
        return;
      }

      for (let i = 1; i < coordinates.length - 1; i++) {
        const prev = coordinates[i - 1];
        const current = coordinates[i];
        const next = coordinates[i + 1];

        const angle = calculateAngle(prev, current, next);

        if (angle < 150) { // Sharp bend threshold (180 - 30 degrees)
          const start = turf.point(prev);
          const end = turf.point(current);
          const midPoint = turf.midpoint(start, end);
          const distance = turf.distance(start, end, { units: 'feet' }).toFixed(2); // Calculate distance in feet

          // Add a label to the map at the midpoint of the side
          L.marker([midPoint.geometry.coordinates[1], midPoint.geometry.coordinates[0]], {
            icon: L.divIcon({
              className: 'distance-label',
              html: `<span>${distance}'</span>`, // No box, just text
              iconSize: [50, 20]
            }),
            interactive: false
          }).addTo(distanceLabelLayer);
        }
      }
    };

    // Add search functionality
    document.getElementById('search-form').addEventListener('submit', function (e) {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      const filterFunction = (feature) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        const normalizedVDC = vdc.trim() === '' ? null : parseInt(vdc.trim(), 10);
        const normalizedWARDNO = wardno.trim() === '' ? null : wardno.trim();
        const normalizedPARCELNO = parcelno.trim() === '' ? null : parseInt(parcelno.trim(), 10);

        return (
          (normalizedVDC === null || VDC === normalizedVDC) &&
          (normalizedWARDNO === null || WARDNO === normalizedWARDNO) &&
          (normalizedPARCELNO === null || PARCELNO === normalizedPARCELNO)
        );
      };

      displayFilteredData(filterFunction);
    });

    // Create a legend with checkboxes
    const legend = L.control({ position: 'topright' });

    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend');
      div.innerHTML = `
        <h4>Map Layers</h4>
        <label><input type="checkbox" id="sheetMapCheckbox"> Sheet Map</label><br>
        <label><input type="checkbox" id="parcelMapCheckbox" checked> Parcel Map</label>
      `;
      return div;
    };

    legend.addTo(map);

    // Handle checkbox changes
    document.getElementById('sheetMapCheckbox').addEventListener('change', function () {
      if (this.checked) {
        map.addLayer(geojsonLayer);
      } else {
        map.removeLayer(geojsonLayer);
      }
    });

    document.getElementById('parcelMapCheckbox').addEventListener('change', function () {
      if (this.checked && parcelLayer) {
        map.addLayer(parcelLayer);
        map.addLayer(distanceLabelLayer);
      } else if (parcelLayer) {
        map.removeLayer(parcelLayer);
        map.removeLayer(distanceLabelLayer);
      }
    });
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

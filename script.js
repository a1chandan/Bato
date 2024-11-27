
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
        layer.bindPopup(\`VDC: \${VDC}<br>Ward No: \${WARDNO}<br>Parcel No: \${PARCELNO}\`);
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
        layer.bindPopup(\`VDC: \${VDC}<br>Ward No: \${WARDNO}<br>Parcel No: \${PARCELNO}\`);
      },
      style: {
        color: 'red',
        weight: 2
      }
    }).addTo(map);

    // Fit the map to the bounds of all parcels initially
    map.fitBounds(parcelLayer.getBounds());

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

    // Function to add generalized distance labels aligned along the sides
    const addDistanceLabels = (feature) => {
      const geometryType = feature.geometry.type;

      let coordinates;
      if (geometryType === 'Polygon') {
        coordinates = feature.geometry.coordinates[0]; // Outer ring of the polygon
      } else if (geometryType === 'MultiPolygon') {
        coordinates = feature.geometry.coordinates[0][0]; // First outer ring of the first polygon
      } else {
        console.error(\`Unsupported geometry type: \${geometryType}\`);
        return;
      }

      let generalizedSegments = [];
      let start = coordinates[0];
      let accumulatedDistance = 0;

      for (let i = 1; i < coordinates.length; i++) {
        const current = coordinates[i];
        const next = coordinates[i + 1] || coordinates[0]; // Wrap to first for closed polygons

        // Calculate segment length
        const startPoint = turf.point(start);
        const currentPoint = turf.point(current);
        const distance = turf.distance(startPoint, currentPoint, { units: 'feet' });

        // Calculate bend angle if there is a next segment
        let angle = 180;
        if (i < coordinates.length - 1) {
          angle = calculateAngle(start, current, next);
        }

        if (distance < 5 || angle > 150) {
          // Accumulate distance for small segments or minor bends
          accumulatedDistance += distance;
        } else {
          // Add generalized segment
          accumulatedDistance += distance;
          generalizedSegments.push({
            start,
            end: current,
            distance: accumulatedDistance
          });

          // Reset for the next generalized segment
          start = current;
          accumulatedDistance = 0;
        }
      }

      // Label each generalized segment
      generalizedSegments.forEach((segment) => {
        const { start, end, distance } = segment;

        // Calculate midpoint
        const midPoint = turf.midpoint(turf.point(start), turf.point(end)).geometry.coordinates;

        // Calculate angle for label rotation
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const angle = Math.atan2(dy, dx) * (180 / Math.PI); // Convert radians to degrees

        // Offset the label slightly away from the line
        const offset = [-dy * 0.00005, dx * 0.00005]; // Scale offset for visibility
        const offsetMidPoint = [midPoint[0] + offset[0], midPoint[1] + offset[1]];

        // Add a label to the map at the offset midpoint
        L.marker([offsetMidPoint[1], offsetMidPoint[0]], {
          icon: L.divIcon({
            className: 'distance-label',
            html: `<div style="transform: rotate(\${angle}deg); white-space: nowrap;">\${distance.toFixed(2)}'</div>`,
            iconSize: [50, 20]
          }),
          interactive: false
        }).addTo(distanceLabelLayer);
      });
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

    const displayFilteredData = (filterFunction) => {
      if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }
      distanceLabelLayer.clearLayers();

      parcelLayer = L.geoJSON(data, {
        filter: filterFunction,
        onEachFeature: function (feature, layer) {
          const { VDC, WARDNO, PARCELNO } = feature.properties;
          layer.bindPopup(\`VDC: \${VDC}<br>Ward No: \${WARDNO}<br>Parcel No: \${PARCELNO}\`);
        },
        style: {
          color: 'red',
          weight: 2
        }
      }).addTo(map);

      if (parcelLayer.getLayers().length > 0) {
        const parcel = parcelLayer.getLayers()[0];
        map.fitBounds(parcel.getBounds());
        addDistanceLabels(parcel.feature);
      } else {
        alert('No parcels found matching your query.');
      }
    };
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

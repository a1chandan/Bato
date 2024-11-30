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
let geojsonLayer; // Full dataset (Sheet Map)
let parcelLayer;  // Filtered dataset (Parcel Map)

// Load GeoJSON data
fetch('data/kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    // Add the full GeoJSON data
    geojsonLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      },
      style: {
        color: 'blue',
        weight: 0.4
      }
    });

    // Add filtered GeoJSON data (Parcel Map)
    parcelLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        const { VDC, WARDNO, PARCELNO } = feature.properties;
        layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
      },
      style: {
        color: 'red',
        weight: 1
      }
    }).addTo(map);

    // Fit to the bounds of all parcels initially
    map.fitBounds(parcelLayer.getBounds());

    // Filter data based on query
    const displayFilteredData = (filterFunction) => {
      if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }

      parcelLayer = L.geoJSON(data, {
        filter: filterFunction,
        onEachFeature: (feature, layer) => {
          const { VDC, WARDNO, PARCELNO } = feature.properties;
          layer.bindPopup(`VDC: ${VDC}<br>Ward No: ${WARDNO}<br>Parcel No: ${PARCELNO}`);
        },
        style: {
          color: 'red',
          weight: 1
        }
      }).addTo(map);

      if (parcelLayer.getLayers().length > 0) {
        map.fitBounds(parcelLayer.getBounds());
      } else {
        alert('No parcels found matching your query.');
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
        return (
          (!vdc || VDC == vdc) &&
          (!wardno || WARDNO == wardno) &&
          (!parcelno || PARCELNO == parcelno)
        );
      };

      displayFilteredData(filterFunction);
    });
  })
  .catch(error => console.error('Error loading GeoJSON:', error));

// Add measurement tool
map.pm.addControls({
  position: 'bottomright',
  drawMarker: false,
  drawPolygon: false,
  drawPolyline: true, // Enable polyline drawing for distance measurement
  drawRectangle: false,
  drawCircle: false,
  editMode: false,
  dragMode: false,
  cutPolygon: false,
  removalMode: false
});

// Listen for distance measurement completion
map.on('pm:create', (e) => {
  if (e.layer instanceof L.Polyline) {
    const latlngs = e.layer.getLatLngs();
    let totalDistance = 0;

    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    alert(`Total distance: ${totalDistance.toFixed(2)} meters (${(totalDistance * 3.28084).toFixed(2)} feet)`);
    map.removeLayer(e.layer); // Remove the drawn layer
  }
});

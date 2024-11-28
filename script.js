// Initialize the map
const map = L.map('map').setView([27.7, 85.4], 14);

// Add a base layer with transparency
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

// Variables to store the GeoJSON layers
let geojsonLayer; // Full dataset (Sheet Map)
let parcelLayer;  // Filtered dataset (Parcel Map)
let mbtilesLayer; // MBTiles layer

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
      if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }

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

      if (parcelLayer.getLayers().length > 0) {
        map.fitBounds(parcelLayer.getBounds());
      } else {
        alert('No parcels found matching your query.');
      }
    };

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
        <label><input type="checkbox" id="parcelMapCheckbox" checked> Parcel Map</label><br>
        <label><input type="checkbox" id="mbtilesLayerCheckbox" checked> MBTiles Layer</label>
      `;
      return div;
    };

    legend.addTo(map);

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
      } else if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }
    });

    document.getElementById('mbtilesLayerCheckbox').addEventListener('change', function () {
      if (this.checked && mbtilesLayer) {
        map.addLayer(mbtilesLayer);
      } else if (mbtilesLayer) {
        map.removeLayer(mbtilesLayer);
      }
    });

    // Load the MBTiles layer
    const mbtilesUrl = 'data/kolvi1.mbtiles';
    fetch(mbtilesUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => {
        mbtilesLayer = L.tileLayer.mbTiles(buffer, {
          attribution: 'MBTiles Layer',
          opacity: 0.8
        }).addTo(map);
      })
      .catch(error => console.error('Error loading MBTiles:', error));

  / Add scale bar
L.control.scale({
  position: 'bottomleft',
  metric: true,
  imperial: true
}).addTo(map);

// Add distance measurement tool using Leaflet.pm
map.pm.addControls({
  position: 'topleft',
  drawMarker: false,
  drawPolygon: false,
  drawPolyline: true, // Enable polyline drawing
  drawRectangle: false,
  drawCircle: false,
  editMode: false,
  dragMode: false,
  cutPolygon: false,
  removalMode: false
});

// Listen for distance measurement events
map.on('pm:drawstart', (e) => {
  if (e.shape === 'Line') {
    console.log('Started measuring distance');
  }
});

map.on('pm:create', (e) => {
  if (e.layer instanceof L.Polyline) {
    const latlngs = e.layer.getLatLngs();
    let totalDistance = 0;

    for (let i = 0; i < latlngs.length - 1; i++) {
      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    alert(`Total distance: ${totalDistance.toFixed(2)} meters (${(totalDistance * 3.28084).toFixed(2)} feet)`);
    map.removeLayer(e.layer); // Remove the measurement layer after showing the result
  }
});

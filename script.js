// Initialize the map
const map = L.map('map',{
   crs: L.CRS.EPSG4326 // Adjust to match data's CRS
}).setView([27.7, 85.4], 14);

// Add a base layer with transparency
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  opacity: 0.7,
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Variables to store the GeoJSON layers
let geojsonLayer; // Full dataset (Sheet Map)
let parcelLayer;  // Filtered dataset (Parcel Map)

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
      // Clear the previous parcelLayer from the map
      if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }

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
      } else if (parcelLayer) {
        map.removeLayer(parcelLayer);
      }
    });
  })
  .catch(error => console.error('Error loading GeoJSON:', error));


  L.control.polylineMeasure({
            position: 'bottomright',
            unit: 'feet', // Set unit to feet
            measureControlTitle: 'Open/close control', // Mouse-over text for the control
            measureControlLabel: '&#x1F4CF;', // Unicode ruler icon for the control button
            measureControlClasses: [], // Style classes to apply to the control
            showMeasurementsClearControl: true,  // Show a control to clear measurements
            clearControlTitle: 'Clear measurements', // Mouse-over text for the clear control
            clearControlLabel: '&times;', // Unicode 'times' icon for the clear control
            clearControlClasses: [], // Additional classes for the clear control
            showUnitControl: true, // Show unit control to allow user to change between feet and miles
            tempLine: { // Styling for the temporary line displayed when creating measurements
                color: '#00f', // Line color
                weight: 2 // Line weight
            },
            fixedLine: { // Styling for lines that are fixed on the map
                color: '#006', // Line color
                weight: 2 // Line weight
            }
        }).addTo(map);



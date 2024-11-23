// Initialize map
const map = L.map('map').setView([27.7, 85.4], 13); // Adjust based on your dataset

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load .kmz file
fetch('data/kolvi_1.kmz')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    return JSZip.loadAsync(buffer); // Extract KMZ using JSZip
  })
  .then(zip => {
    const kmlFile = Object.keys(zip.files).find(file => file.endsWith('.kml')); // Find the KML file
    return zip.files[kmlFile].async('string'); // Extract the KML content
  })
  .then(kmlText => {
    const kmlLayer = new L.KML(kmlText); // Parse the KML
    map.addLayer(kmlLayer);

    // Fit map bounds to KML layer
    map.fitBounds(kmlLayer.getBounds());

    // Optional: Query form functionality
    document.getElementById('query-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      kmlLayer.eachLayer(layer => {
        const props = layer.feature?.properties;
        if (
          props &&
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
  })
  .catch(err => {
    console.error('Error loading KMZ file:', err);
  });

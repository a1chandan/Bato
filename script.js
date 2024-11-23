// Initialize map
const map = L.map('map'); // Don't set view yet; we'll center based on the KMZ content

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Load .kmz file
fetch('data/kolvi_1.kmz')
  .then(response => response.arrayBuffer())
  .then(buffer => {
    // Extract KMZ using JSZip
    return JSZip.loadAsync(buffer);
  })
  .then(zip => {
    // Find and extract the KML file from the KMZ archive
    const kmlFile = Object.keys(zip.files).find(file => file.endsWith('.kml'));
    return zip.files[kmlFile].async('string');
  })
  .then(kmlText => {
    // Parse and add the KML to the map
    const kmlLayer = new L.KML(kmlText);
    map.addLayer(kmlLayer);

    // Fit the map to the bounds of the KML layer
    map.fitBounds(kmlLayer.getBounds());

    // Add query functionality for parcels
    document.getElementById('query-form').addEventListener('submit', (e) => {
      e.preventDefault();

      const vdc = document.getElementById('vdc').value;
      const wardno = document.getElementById('wardno').value;
      const parcelno = document.getElementById('parcelno').value;

      kmlLayer.eachLayer(layer => {
        const props = layer.feature?.properties || layer.options?.properties;

        if (
          props &&
          props.vdc === vdc &&
          props.wardno === wardno &&
          props.parcelno === parcelno
        ) {
          layer.setStyle({
            color: "#ff0000",
            weight: 3,
          });
          map.fitBounds(layer.getBounds()); // Zoom to the queried parcel
        } else {
          layer.setStyle({
            color: "#999",
            weight: 1,
          });
        }
      });
    });
  })
  .catch(err => {
    console.error('Error loading KMZ file:', err);
  });

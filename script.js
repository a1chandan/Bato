// Initialize the map
const map = L.map('map').setView([27.7, 85.3], 10); // Adjust to your preferred location and zoom level

// Add a basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom: 19
}).addTo(map);

// Load parcel data (ensure `kolvi_1.json` is in the correct directory and accessible)
let parcelsLayer;
fetch('data/kolvi_1.json')
  .then(response => {
    if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
    return response.json();
  })
  .then(data => {
    // Add GeoJSON to the map
    parcelsLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        // Bind popup to each parcel
        layer.bindPopup(
          `<b>VDC:</b> ${feature.properties.VDC}<br>` +
          `<b>Ward:</b> ${feature.properties.WARDNO}<br>` +
          `<b>Parcel:</b> ${feature.properties.PARCELNO}`
        );
      }
    }).addTo(map);

    // Fit the map to the GeoJSON layer bounds
    map.fitBounds(parcelsLayer.getBounds());
  })
  .catch(error => {
    console.error('Error loading GeoJSON:', error);
    alert('Could not load parcel data.');
  });

// Form submission handler
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const vdc = document.getElementById('vdcInput').value.trim();
  const wardNo = document.getElementById('wardNoInput').value.trim();
  const parcelNo = document.getElementById('parcelNoInput').value.trim();

  // Search for the parcel
  let parcelFound = false;
  parcelsLayer.eachLayer(layer => {
    if (
      String(layer.feature.properties.VDC) === vdc &&
      String(layer.feature.properties.WARDNO) === wardNo &&
      String(layer.feature.properties.PARCELNO) === parcelNo
    ) {
      parcelFound = true;
      map.fitBounds(layer.getBounds());
      layer.openPopup();
      showSplitOption(layer.feature);
    }
  });

  if (!parcelFound) {
    alert('Parcel not found. Please check your inputs.');
  }
});

// Show split dialog
function showSplitOption(parcel) {
  const splitDialog = confirm("Do you want to split this parcel?");
  if (splitDialog) {
    const area = parseFloat(prompt("Enter the area to split:"));
    const direction = prompt("Enter the direction (north, south, east, west, etc.):");
    splitParcel(parcel, area, direction);
  }
}

// Split the parcel
function splitParcel(parcel, area, direction) {
  const totalArea = turf.area(parcel);
  if (area >= totalArea) {
    alert("Area to split exceeds or equals the parcel area.");
    return;
  }

  const bbox = turf.bbox(parcel);
  let splitLine;

  // Create the split line based on direction
  if (['north', 'south', 'east', 'west'].includes(direction)) {
    splitLine = createSplitLine(bbox, direction);
  } else {
    alert("Diagonal splitting not yet implemented.");
    return;
  }

  const splitPolygon = turf.intersect(parcel, splitLine);
  const remainingPolygon = turf.difference(parcel, splitPolygon);

  // Add layers to the map
  const splitLayer = L.geoJSON(splitPolygon, { style: { color: 'blue' } });
  const remainingLayer = L.geoJSON(remainingPolygon, { style: { color: 'green' } });
  map.addLayer(splitLayer);
  map.addLayer(remainingLayer);

  // Add legend toggle
  const legend = L.control.layers({}, {
    "Original Parcel": parcelsLayer,
    "Split Parcels": L.layerGroup([splitLayer, remainingLayer])
  }).addTo(map);
}

// Create a split line based on direction
function createSplitLine(bbox, direction) {
  const [minX, minY, maxX, maxY] = bbox;
  switch (direction) {
    case 'north':
      return turf.lineString([[minX, maxY], [maxX, maxY]]);
    case 'south':
      return turf.lineString([[minX, minY], [maxX, minY]]);
    case 'east':
      return turf.lineString([[maxX, minY], [maxX, maxY]]);
    case 'west':
      return turf.lineString([[minX, minY], [minX, maxY]]);
    default:
      return null;
  }
}

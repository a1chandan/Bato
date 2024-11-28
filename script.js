// Initialize the map
const map = L.map('map').setView([27.7, 85.3], 10); // Adjust to your location

// Add a basemap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19
}).addTo(map);

// Load parcel data
let parcelsLayer;
fetch('kolvi_1.json')
  .then(response => response.json())
  .then(data => {
    parcelsLayer = L.geoJSON(data, {
      onEachFeature: (feature, layer) => {
        layer.bindPopup(`VDC: ${feature.properties.VDC}, Ward: ${feature.properties.WARDNO}, Parcel: ${feature.properties.PARCELNO}`);
      }
    }).addTo(map);
  });

// Form submission handler
document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const vdc = document.getElementById('vdcInput').value.trim();
  const wardNo = document.getElementById('wardNoInput').value.trim();
  const parcelNo = document.getElementById('parcelNoInput').value.trim();

  parcelsLayer.eachLayer(layer => {
    // Compare VDC, WARDNO, and PARCELNO as strings
    if (String(layer.feature.properties.VDC) === vdc &&
        String(layer.feature.properties.WARDNO) === wardNo &&
        String(layer.feature.properties.PARCELNO) === parcelNo) {
      map.fitBounds(layer.getBounds());
      showSplitOption(layer.feature);
    }
  });
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

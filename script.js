// Initialize the map
const map = L.map('map').setView([27.7, 85.3], 12); // Default view

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

let geojsonLayer; // For all parcels
let parcelLayer; // For the selected parcel
let parcelData = []; // Array to store GeoJSON feature properties

// Load the GeoJSON file
fetch('data/kolvi_1.json')
    .then(response => response.json())
    .then(data => {
        // Add GeoJSON layer
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#3d3d3d',
                weight: 0.4,
            },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`Parcel No: ${feature.properties.PARCELNO}`);
                // Store feature properties for search
                parcelData.push({ ...feature.properties, bounds: layer.getBounds(), feature });
            },
        }).addTo(map);

        // Zoom to the extent of all parcels
        map.fitBounds(geojsonLayer.getBounds());
    });

// Function to highlight a parcel
function highlightParcel(parcel) {
    // Reset the previous selection if any
    if (parcelLayer) {
        map.removeLayer(parcelLayer);
    }

    // Highlight the selected parcel with black outline
    parcelLayer = L.geoJSON(parcel.feature, {
        style: {
            color: '#570101',
            weight: 3,
        },
    }).addTo(map);

    // Add a label with parcel number at the center of the parcel
    const center = parcel.bounds.getCenter();
    L.marker(center, {
        icon: L.divIcon({
            className: 'parcel-label',
            html: `<strong>${parcel.PARCELNO}</strong>`,
            iconSize: [50, 20],
        }),
    }).addTo(map);

    // Zoom to the selected parcel
    map.fitBounds(parcel.bounds);
}

// Fuse.js configuration
const fuseOptions = {
    keys: ['VDC', 'WARDNO', 'PARCELNO'],
    threshold: 0.4, // Adjust threshold for fuzzy matching
};
let fuse;

// Initialize Fuse.js when data is loaded
document.addEventListener('DOMContentLoaded', () => {
    fuse = new Fuse(parcelData, fuseOptions);
});

// Search button click event
document.getElementById('search-btn').addEventListener('click', () => {
    const vdc = document.getElementById('VDC').value.trim();
    const wardno = document.getElementById('WARDNO').value.trim();
    const parcelno = document.getElementById('PARCELNO').value.trim();

    const searchQuery = { vdc, wardno, parcelno };
    const results = fuse.search(searchQuery);

    if (results.length > 0) {
        // Highlight the first matching parcel
        highlightParcel(results[0].item);
    } else {
        alert('Parcel not found. Please check your input.');
    }
});

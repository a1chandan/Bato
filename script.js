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
                color: '#cccccc',
                weight: 1,
            },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`ParcelNo: ${feature.properties.PARCELNO}`);
                // Store feature properties for search
                parcelData.push({ 
                    vdc: feature.properties.VDC.toString().toLowerCase(),
                    wardno: feature.properties.WARDNO.toString().toLowerCase(),
                    parcelno: feature.properties.PARCELNO.toString().toLowerCase(),
                    bounds: layer.getBounds(), 
                    feature 
                });
            },
        }).addTo(map);

        // Zoom to the extent of all parcels
        map.fitBounds(geojsonLayer.getBounds());

        // Initialize Fuse.js after data is loaded
        initializeFuse();
    });

// Function to highlight a parcel
function highlightParcel(parcel) {
    // Reset the previous selection if any
    if (parcelLayer) {
        map.removeLayer(parcelLayer);
    }

    // Remove existing parcel labels
    document.querySelectorAll('.parcel-label').forEach(label => label.remove());

    // Highlight the selected parcel with black outline
    parcelLayer = L.geoJSON(parcel.feature, {
        style: {
            color: '#000000',
            weight: 3,
        },
    }).addTo(map);

    // Add a label with parcel number at the center of the parcel
    const center = parcel.bounds.getCenter();
    L.marker(center, {
        icon: L.divIcon({
            className: 'parcel-label',
            html: `<strong>${parcel.PARCELNO.toUpperCase()}</strong>`,
            iconSize: [50, 20],
        }),
    }).addTo(map);

    // Zoom to the selected parcel
    map.fitBounds(parcel.bounds);
}

// Fuse.js configuration
let fuse;
function initializeFuse() {
    const fuseOptions = {
        keys: ['VDC', 'WARDNO', 'PARCELNO'],
        threshold: 0.4, // Adjust threshold for fuzzy matching
        includeScore: true,
    };
    fuse = new Fuse(parcelData, fuseOptions);
}

// Search button click event
document.getElementById('search-btn').addEventListener('click', () => {
    const vdcInput = document.getElementById('VDC').value.trim().toLowerCase();
    const wardnoInput = document.getElementById('WARDNO').value.trim().toLowerCase();
    const parcelnoInput = document.getElementById('PARCELNO').value.trim().toLowerCase();

    // Build search query
    const searchQuery = [];
    if (vdcInput) searchQuery.push(vdcInput);
    if (wardnoInput) searchQuery.push(wardnoInput);
    if (parcelnoInput) searchQuery.push(parcelnoInput);

    if (searchQuery.length === 0) {
        alert('Please enter at least one search criterion.');
        return;
    }

    // Perform search using Fuse.js
    const results = fuse.search({
        vdc: vdcInput,
        wardno: wardnoInput,
        parcelno: parcelnoInput
    });

    if (results.length > 0) {
        // Highlight the first matching parcel
        highlightParcel(results[0].item);
    } else {
        alert('Parcel not found. Please check your input.');
    }
});

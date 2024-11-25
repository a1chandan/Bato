// Initialize the map
const map = L.map('map').setView([27.7, 85.3], 12); // Default view

// Add a tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    opacity = 0.5
}).addTo(map);

let geojsonLayer; // For all parcels
let parcelLayer; // For the selected parcel

// Load the GeoJSON file
fetch('data/kolvi_1.json')
    .then(response => response.json())
    .then(data => {
        // Add GeoJSON layer
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#403e3e',
                weight: 0.4,
            },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`ParcelNo- ${feature.properties.PARCELNO}`);
            },
        }).addTo(map);

        // Zoom to the extent of all parcels
        map.fitBounds(geojsonLayer.getBounds());
    });

// Search button click event
document.getElementById('search-btn').addEventListener('click', () => {
    const vdc = document.getElementById('VDC').value.trim();
    const wardno = document.getElementById('WARDNO').value.trim();
    const parcelno = document.getElementById('PARCELNO').value.trim();

    let found = false; // To track if the parcel is found

    // Reset the previous selection if any
    if (parcelLayer) {
        map.removeLayer(parcelLayer);
    }

    // Search for the specific parcel
    geojsonLayer.eachLayer(layer => {
        const props = layer.feature.properties;

        if (props.VDC === vdc && props.WARDNO === wardno && props.PARCELNO === parcelno) {
            found = true;

            // Highlight the selected parcel with black outline
            parcelLayer = L.geoJSON(layer.feature, {
                style: {
                    color: '#000000',
                    weight: 2,
                },
            }).addTo(map);

            // Add a label with parcel number at the center of the parcel
            const center = layer.getBounds().getCenter();
            L.marker(center, {
                icon: L.divIcon({
                    className: 'parcel-label',
                    html: `<strong>${PARCELNO}</strong>`,
                    iconSize: [50, 20],
                }),
            }).addTo(map);

            // Zoom to the selected parcel
            map.fitBounds(layer.getBounds());
        }
    });

    if (!found) {
        alert('Parcel not found. Please check your input.');
    }
});

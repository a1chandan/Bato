let map = L.map('map').setView([27.7, 85.3], 12); // Default view
let geojsonLayer, parcelLayer;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Fetch GeoJSON and add to the map
fetch('data/kolvi_1.json')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#cccccc',
                weight: 1,
            },
            onEachFeature: (feature, layer) => {
                layer.bindTooltip(`Parcel No: ${feature.properties.parcelno}`);
            },
        }).addTo(map);

        // Zoom to the GeoJSON layer extent at the start
        map.fitBounds(geojsonLayer.getBounds());
    });

document.getElementById('search-btn').addEventListener('click', () => {
    const vdc = document.getElementById('vdc').value.trim();
    const wardno = document.getElementById('wardno').value.trim();
    const parcelno = document.getElementById('parcelno').value.trim();

    let found = false;

    geojsonLayer.eachLayer(layer => {
        const props = layer.feature.properties;

        if (props.vdc === vdc && props.wardno === wardno && props.parcelno === parcelno) {
            found = true;

            // Highlight the selected parcel
            if (parcelLayer) {
                map.removeLayer(parcelLayer); // Remove previous highlight
            }

            parcelLayer = L.geoJSON(layer.feature, {
                style: {
                    color: '#000000', // Black outline
                    weight: 3,
                },
            }).addTo(map);

            // Add a label for the parcelno at the center of the parcel
            const center = layer.getBounds().getCenter();
            L.marker(center, {
                icon: L.divIcon({
                    className: 'parcel-label',
                    html: `<strong>${parcelno}</strong>`,
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

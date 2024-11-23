let map = L.map('map').setView([27.7, 85.3], 12); // Default view
let geojsonLayer;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

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
    });

document.getElementById('search-btn').addEventListener('click', () => {
    const vdc = document.getElementById('vdc').value.trim();
    const wardno = document.getElementById('wardno').value.trim();
    const parcelno = document.getElementById('parcelno').value.trim();

    geojsonLayer.eachLayer(layer => {
        const props = layer.feature.properties;

        if (props.vdc === vdc && props.wardno === wardno && props.parcelno === parcelno) {
            map.fitBounds(layer.getBounds());

            geojsonLayer.setStyle({
                color: '#cccccc',
                weight: 1,
            });

            layer.setStyle({
                color: '#ff0000',
                weight: 3,
            });

            layer.bringToFront();
        }
    });
});

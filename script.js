let map = L.map('map').setView([27.7, 85.3], 12); // Default map view
let geojsonLayer;

// URL parameters for sharing
const params = new URLSearchParams(window.location.search);

// Store unique VDCs and Ward Nos
const vdcSet = new Set();
const wardnoSet = new Set();

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
}).addTo(map);

// Load the GeoJSON data
fetch('data/kolvi_1.json')
    .then(response => response.json())
    .then(data => {
        // Add GeoJSON layer to map
        geojsonLayer = L.geoJSON(data, {
            style: {
                color: '#cccccc',
                weight: 1,
            },
            onEachFeature: (feature, layer) => {
                // Tooltip for parcel number
                layer.bindTooltip(`Parcel No: ${feature.properties.parcelno}`);

                // Collect unique VDCs and Ward Nos
                vdcSet.add(feature.properties.vdc.trim());
                wardnoSet.add(feature.properties.wardno.trim());
            },
        }).addTo(map);

        // Populate dropdowns
        populateDropdown('vdc', Array.from(vdcSet));
        populateDropdown('wardno', Array.from(wardnoSet));

        // Handle URL parameters
        const vdcParam = params.get('vdc');
        const wardnoParam = params.get('wardno');
        const parcelnoParam = params.get('parcelno');

        if (vdcParam && wardnoParam && parcelnoParam) {
            highlightFeature(vdcParam, wardnoParam, parcelnoParam);
        }

        // Zoom to GeoJSON bounds on load
        const geojsonBounds = geojsonLayer.getBounds();
        map.fitBounds(geojsonBounds);
    });

// Populate dropdowns dynamically
function populateDropdown(elementId, options) {
    const select = document.getElementById(elementId);
    options.sort();
    options.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

// Highlight a feature based on search
function highlightFeature(vdc, wardno, parcelno) {
    let parcelFound = false;

    geojsonLayer.eachLayer(layer => {
        const props = layer.feature.properties;

        if (
            props.vdc.trim().toLowerCase() === vdc.trim().toLowerCase() &&
            props.wardno.trim() === wardno.trim() &&
            props.parcelno.trim() === parcelno.trim()
        ) {
            map.fitBounds(layer.getBounds());
            map.setView(layer.getBounds().getCenter(), 18);

            // Highlight the selected feature
            layer.setStyle({
                color: '#ff0000',
                weight: 3,
            });

            layer.bringToFront();
            parcelFound = true;
        } else {
            // Reset style for other features
            layer.setStyle({
                color: '#cccccc',
                weight: 1,
            });
        }
    });

    if (!parcelFound) {
        alert('No parcel found with the given query!');
    }
}

// Add search functionality
document.getElementById('search-btn').addEventListener('click', () => {
    const vdc = document.getElementById('vdc').value.trim();
    const wardno = document.getElementById('wardno').value.trim();
    const parcelno = document.getElementById('parcelno').value.trim();

    if (!vdc || !wardno || !parcelno) {
        alert('Please fill in all fields!');
        return;
    }

    // Update URL with search parameters
    const newParams = new URLSearchParams({ vdc, wardno, parcelno });
    history.pushState({}, '', `?${newParams.toString()}`);

    // Highlight the feature
    highlightFeature(vdc, wardno, parcelno);
});

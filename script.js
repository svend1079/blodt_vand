// box that the map stays within
var southWest = L.latLng(55.54, 12);
var northEast = L.latLng(55.84, 13);
var bounds = L.latLngBounds(southWest, northEast);

// Initialize the map
var map = L.map('map', {
    minZoom: 11,
    maxBounds: bounds,
    scrollWheelZoom: false, // disable original zoom function
    smoothWheelZoom: true,  // enable smooth zoom 
    smoothSensitivity: 1,
})
.setView([55.6625, 12.4937], 12);

// Add OpenStreetMap to the map
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '<a href="https://www.openstreetmap.org/copyright">&#169 OpenStreetMap</a>'
}).addTo(map);

// Stripe pattern
var stripes = new L.StripePattern({
    angle: 45,
    weight: 2,
    spaceWeight: 9999,
    color: '#c6ef75',
    opacity: 1,
    spaceColor: '#0f464b',
    spaceOpacity: 1,
    height: 20
});
stripes.addTo(map);

// Opacity slider
var opacityControl = L.control({ position: 'topright' });

opacityControl.onAdd = function () {
    var div = L.DomUtil.create('div', 'leaflet-control-slider');
    div.innerHTML = '<label>Gennemsigtighed</label><input type="range" min="0" max="1" step="0.01" value="0.7" id="opacity-slider">';
    L.DomEvent.disableClickPropagation(div);
    return div;
};
opacityControl.addTo(map);

// Event listener for opacity slider
document.getElementById('opacity-slider').addEventListener('input', function (e) {
    var opacityValue = parseFloat(e.target.value);
    updateOpacity(opacityValue);
});

// Load municipality layer file and add it to the map as a clickable polygon
var geojsonLayer;
fetch('hovedstadsområde_WGS.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonLayer = L.geoJSON(data, {
            style: function (feature) {
                var status = feature.properties.status;
                var styleOptions = {
                    weight: 1,
                    opacity: 1,
                    color: 'white',
                    fillOpacity: 0.7
                };
                if (status === "1") {
                    styleOptions.fillColor = '#c6ef75';
                } else if (status === "2") {
                    styleOptions.fillPattern = stripes;
                } else if (status === "3") {
                    styleOptions.fillColor = '#0f464b';
                } else {
                    styleOptions.fillColor = '#e5e4dc';
                }
                return styleOptions;
            },
            onEachFeature: function (feature, layer) {
                layer.on('click', function (event) {
                    var properties = feature.properties;
                    var popupContent;
                    if (properties.status === "4") {
                        popupContent = '<div class="custom-popup">' +
                            '<div class="popup-title">' + properties.navn + '</div><br>' +
                            '<div class="popup-description">Uden for HOFORs forsyning</div>' +
                            '</div>';
                    } else if (properties.status === "1") {
                        popupContent = '<div class="custom-popup">' +
                            '<div class="popup-title">' + properties.navn + '</div><br>' +
                            '<div class="popup-description">Blødere vand</div><br>' +
                            '<div class="popup-description">' + properties.hårdhed + ' &degdH</div><br>' +
                            '</div>';
                    } else if (properties.status === "2") {
                        popupContent = '<div class="custom-popup">' +
                            '<div class="popup-title">' + properties.navn + '</div><br>' +
                            '<div class="popup-description">Varierende hårdhed</div><br>' +
                            '<div class="popup-description">' + properties.hårdhed + ' &degdH</div><br>' +
                            '</div>';
                    } else {
                        popupContent = '<div class="custom-popup">' +
                            '<div class="popup-title">' + properties.navn + '</div><br>' +
                            '<div class="popup-description">Hårdt vand</div><br>' +
                            '<div class="popup-description">' + properties.hårdhed + ' &degdH</div>' +
                            '</div>';
                    }
                    L.popup().setLatLng(event.latlng).setContent(popupContent).openOn(map);
                });
            }
        }).addTo(map).bringToBack();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Load municpality boarders as a line shapefile and add it to the map
fetch('kom_omrids.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    weight: 2,
                    color: 'white'
                };
            }
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

fetch('ocean.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: function (feature) {
                return {
                    weight: 3,
                    color: '#99d6ff',
                    fillColor: '#99d6ff',
                    fillOpacity: '1'
                };
            }
        }).addTo(map).bringToFront();
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// Function to update opacity
function updateOpacity(opacity) {
    if (geojsonLayer) {
        geojsonLayer.eachLayer(function (layer) {
            layer.setStyle({ fillOpacity: opacity });
        });
    }
}

// Add Geocoder control
L.Control.geocoder({ defaultMarkGeocode: false })
    .on('markgeocode', function (e) {
        var bbox = e.geocode.bbox;
        var poly = L.polygon([
            bbox.getSouthEast(),
            bbox.getNorthEast(),
            bbox.getNorthWest(),
            bbox.getSouthWest()
        ])
        map.fitBounds(poly.getBounds());
    })
    .addTo(map);

var legend = L.control({ position: "bottomleft" });

legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "legend");
    div.innerHTML += '<i style="background: #c6ef75"></i><span>Blødere vand</span><br>';
    div.innerHTML += '<i style="background: linear-gradient(45deg, #0f464b calc(50% - 3px), #c6ef75 50%, #0f464b calc(50% + 1px) );"></i><span>Varierende hårdhed</span><br>';
    div.innerHTML += '<i style="background: #0f464b; border: 1px solid white;"></i><span>Hårdt vand</span><br>';

    return div;
};

legend.addTo(map);
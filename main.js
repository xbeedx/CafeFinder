const mapContainer = document.getElementById("map-container");
const placeSearch = document.querySelector("gmp-place-search");
const placeSearchQuery = document.querySelector("gmp-place-nearby-search-request");
const placeDetails = document.querySelector("gmp-place-details-compact");
const placeRequest = document.querySelector("gmp-place-details-place-request");
const autocompleteInput = document.getElementById("autocomplete-input");

let markers = {};
let gMap;
let placeDetailsPopup;
let spherical;
let AdvancedMarkerElement;
let LatLngBounds;
let LatLng;
let autocomplete;

async function init() {
    ({ spherical } = await google.maps.importLibrary('geometry'));
    const {Map} = await google.maps.importLibrary("maps");
    await google.maps.importLibrary("places");
    ({AdvancedMarkerElement} = await google.maps.importLibrary("marker"));
    ({LatLngBounds, LatLng} = await google.maps.importLibrary("core"));
    gMap = new Map(mapContainer, {
        center: {lat: -37.813, lng: 144.963},
        zoom: 16,
        mapTypeControl: false,
        clickableIcons: false,
        mapId: 'DEMO_MAP_ID'
    });
    placeDetailsPopup = new AdvancedMarkerElement({
        map: null,
        content: placeDetails,
        zIndex: 100
    });
    findCurrentLocation();
    gMap.addListener('click', hidePlaceDetailsPopup);
    const { Autocomplete } = await google.maps.importLibrary("places");
    autocomplete = new Autocomplete(autocompleteInput, {
        types: ["geocode", "establishment"],
        fields: ["geometry", "name", "place_id"]
    });
    autocomplete.addListener("place_changed", onPlaceSelected);
}

async function onPlaceSelected() {
    const place = autocomplete.getPlace();
    if (!place.geometry || !place.geometry.location) return;
    gMap.panTo(place.geometry.location);
    gMap.setZoom(16);
    searchCafesNear(place.geometry.location);
}

async function searchCafesNear(location) {
    const bounds = gMap.getBounds();
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const diameter = spherical.computeDistanceBetween(ne, sw);
    const cappedRadius = Math.min((diameter / 2), 50000);
    placeDetailsPopup.map = null;
    for(const markerId in markers){
        if (Object.prototype.hasOwnProperty.call(markers, markerId)) {
            markers[markerId].map = null;
        }
    }
    markers = {};
    placeSearch.style.display = 'block';
    placeSearchQuery.locationRestriction = { center: location, radius: cappedRadius };
    placeSearchQuery.includedTypes = ["cafe"];
    placeSearch.addEventListener('gmp-load', addMarkers, { once: true });
    placeSearch.addEventListener("gmp-select", ({ place }) => {
        if (markers[place.id]) markers[place.id].click();
    });
}

async function addMarkers(){
    const bounds = new LatLngBounds();
    placeSearch.style.display = 'block';
    if(placeSearch.places.length > 0){
        placeSearch.places.forEach((place) => {
            let marker = new AdvancedMarkerElement({
                map: gMap,
                position: place.location
            });
            marker.metadata = {id: place.id};
            markers[place.id] = marker;
            bounds.extend(place.location);
            marker.addListener('click',() => {
                placeRequest.place = place;
                placeDetails.style.display = 'block';
                placeDetailsPopup.position = place.location;
                placeDetailsPopup.map = gMap;
                gMap.fitBounds(place.viewport, {top: 0, left: 400});
                placeDetails.addEventListener('gmp-load',() => {
                    gMap.fitBounds(place.viewport, {top: 0, right: 450});
                }, { once: true });
            });
            gMap.setCenter(bounds.getCenter());
            gMap.fitBounds(bounds);
        });
    }
}

async function findCurrentLocation(){
    const { LatLng } = await google.maps.importLibrary("core");
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const pos = new LatLng(position.coords.latitude,position.coords.longitude);
            gMap.panTo(pos);
            gMap.setZoom(16);
          },
          () => {
            gMap.setZoom(16);
          },
        );
      } else {
        gMap.setZoom(16);
      }
}

function hidePlaceDetailsPopup() {
    if (placeDetailsPopup.map) {
        placeDetailsPopup.map = null;
        placeDetails.style.display = 'none';
    }
}

init();

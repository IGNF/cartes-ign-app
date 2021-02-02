const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);

/* global: layer display state */
let layerDisplayed = localStorage.getItem("lastLayerDisplayed") || 'photos';

/* global: back button state */
let backButtonState = 'default';

/* global: last text in search bar */
let lastTextInSearch = '';

let gpsMarkerLayer;
let adressMarkerLayer;

export default {
  map,
  layerDisplayed,
  backButtonState,
  lastTextInSearch,
  gpsMarkerLayer,
  adressMarkerLayer
};

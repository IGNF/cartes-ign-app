const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);

/* global: layer display state */
let layerDisplayed = localStorage.getItem("lastLayerDisplayed") || 'photos';

let gpsMarkerLayer;
let adressMarkerLayer;

export default {
  map,
  layerDisplayed,
};

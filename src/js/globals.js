// Leaflet map
const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);

/* global: layer display state */
let layerDisplayed = localStorage.getItem("lastLayerDisplayed") || 'photos';

/* global: back button state */
let backButtonState = 'default';

/* global: last text in search bar */
let lastTextInSearch = '';

/* global: current map rotation */
let currentRotation = 0;

/* global: flag to check if map move fired by code */
let movedFromCode = false;

let gpsMarkerLayer;
let adressMarkerLayer;

// Pour l'annulation de fetch
let controller = new AbortController();
let signal = controller.signal;

// Autocompletion
let autocompletion_results = []

// Markers
let gpMarkerIcon;
let gpMarkerIcon2;
let positionBearing = 0;

let currentScrollIndex = 0;

export default {
  map,
  layerDisplayed,
  backButtonState,
  lastTextInSearch,
  currentRotation,
  gpsMarkerLayer,
  adressMarkerLayer,
  controller,
  signal,
  gpMarkerIcon,
  gpMarkerIcon2,
  autocompletion_results,
  movedFromCode,
  positionBearing,
  currentScrollIndex,
};

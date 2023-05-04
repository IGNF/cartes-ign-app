// Leaflet map
const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);
let baseLayers;
let dataLayers;

/* global: layer display state */
let baseLayerDisplayed = localStorage.getItem("lastBaseLayerDisplayed") || 'plan-ign';
let dataLayerDisplayed = localStorage.getItem("lastDataLayerDisplayed") || '';

/* global: back button state */
let backButtonState = 'default';

/* global: last text in search bar */
let lastTextInSearch = '';

/* global: current map rotation */
let currentRotation = 0;

/* global: flag to check if map move fired by code */
let movedFromCode = false;

/* global: flag to check if scoll fired by code */
let ignoreNextScrollEvent = false;

/* global: flag to check if first click needed for route */
let firstClickNeeded = true;

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

let polygonLayer;

// Scroll
let maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
let anchors = [0, maxScroll / 2.5, maxScroll];
let currentScrollIndex = 0;
let currentScroll = window.scrollY;

export default {
  map,
  baseLayers,
  dataLayers,
  baseLayerDisplayed,
  dataLayerDisplayed,
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
  ignoreNextScrollEvent,
  positionBearing,
  currentScrollIndex,
  maxScroll,
  anchors,
  polygonLayer,
  currentScroll,
  firstClickNeeded,
};

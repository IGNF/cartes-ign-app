// Maplibrz map
const map2 = new maplibregl.Map({
  container: "map",
  zoom: 5,
  center: [2.0, 47.33],
  attributionControl: false,
  locale: "fr",
  maxPitch: 0,
  touchPitch: false,
});
// REMOVEME
const map = new L.map('map2', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5);
let baseLayer;
let dataLayers;
let compareLayer;

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

// REMOVEME
let gpsMarkerLayer;
let adressMarkerLayer;

let myPositionIcon;
let searchResultIcon;

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

// Flag to check if side by side conparison is on
let sideBySideOn = false;

// Scroll
let maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
let anchors = [0, maxScroll / 2.5, maxScroll];
let currentScrollIndex = 0;
let currentScroll = window.scrollY;

export default {
  map,
  map2,
  baseLayer,
  dataLayers,
  baseLayerDisplayed,
  dataLayerDisplayed,
  backButtonState,
  lastTextInSearch,
  currentRotation,
  gpsMarkerLayer,
  adressMarkerLayer,
  myPositionIcon,
  searchResultIcon,
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
  sideBySideOn,
};

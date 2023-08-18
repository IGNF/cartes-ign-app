import * as syncMaps from '@mapbox/mapbox-gl-sync-move'

// Main map
const map = new maplibregl.Map({
  container: "map",
  zoom: 5,
  center: [2.0, 47.33],
  attributionControl: false,
  locale: "fr",
  maxPitch: 0,
  touchPitch: false,
});
map.scrollZoom.setWheelZoomRate(1);
// Secondary map for RLT
const mapRLT = new maplibregl.Map({
  container: "mapRLT",
  zoom: 5,
  center: [2.0, 47.33],
  attributionControl: false,
  locale: "fr",
  maxPitch: 0,
  touchPitch: false,
});
mapRLT.scrollZoom.setWheelZoomRate(1);

// syncMaps(map, mapRLT);

let baseLayer;
let dataLayers;

/* global: layer display state */
let baseLayerDisplayed = localStorage.getItem("lastBaseLayerDisplayed") || 'plan-ign';
let dataLayerDisplayed = localStorage.getItem("lastDataLayerDisplayed") || '';

/* global: back button state */
let backButtonState = 'default';

/* global: last text in search bar */
let lastTextInSearch = '';

/* global: flag to check if map move fired by code */
let movedFromCode = false;

/* global: flag to check if scoll fired by code */
let ignoreNextScrollEvent = false;

/* global: flag to check if first click needed for route */
let firstClickNeeded = true;

let myPositionMarker;
let searchResultMarker;

let myPositionIcon;
let searchResultIcon;

// Pour l'annulation de fetch
let controller = new AbortController();
let signal = controller.signal;

// Autocompletion
let autocompletion_results = []

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
  mapRLT,
  baseLayer,
  dataLayers,
  baseLayerDisplayed,
  dataLayerDisplayed,
  backButtonState,
  lastTextInSearch,
  myPositionMarker,
  searchResultMarker,
  myPositionIcon,
  searchResultIcon,
  controller,
  signal,
  autocompletion_results,
  movedFromCode,
  ignoreNextScrollEvent,
  currentScrollIndex,
  maxScroll,
  anchors,
  polygonLayer,
  currentScroll,
  firstClickNeeded,
  sideBySideOn,
};

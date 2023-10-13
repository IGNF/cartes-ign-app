import maplibregl from "maplibre-gl";

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

/* global: layer display state */
let baseLayerDisplayed = localStorage.getItem("lastBaseLayerDisplayed") || 'plan-ign';
let dataLayerDisplayed = localStorage.getItem("lastDataLayerDisplayed") || '';

/* global: back button state */
/* is one of: 'default' 'search' 'mainMenu' 'params' 'legal' 'privacy' 'plusLoin' 'infos' 'legend' 'layerManagerWindow' 'route'*/
let backButtonState = 'default';

/* global: map state */
/* is one of: 'default' 'drawRoute' 'compare' */
let mapState = 'default';

/* global: last text in search bar */
let lastTextInSearch = '';

/* global: flag to check if map move fired by code */
let movedFromCode = false;

/* global: flag to check if scoll fired by code */
let ignoreNextScrollEvent = false;

let myPositionMarker = null;
let searchResultMarker;

let myPositionIcon;
let searchResultIcon;

// Pour l'annulation de fetch
let controller = new AbortController();
let signal = controller.signal;

// Global Search plugin
let search = null;

// Global Route plugin
let directions = null;

// Global Isochrone plugin
let isochrone = null;

// Global MyPosition plugin
let myposition = null;

// Global Compare Plugin
let compare = null;

// Global Menu navigation
let menu = null;

// Scroll
let maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
let anchors = [0, maxScroll / 2.5, maxScroll];
let currentScrollIndex = 0;
let currentScroll = window.scrollY;

export default {
  map,
  mapRLT,
  baseLayerDisplayed,
  dataLayerDisplayed,
  backButtonState,
  mapState,
  lastTextInSearch,
  myPositionMarker,
  searchResultMarker,
  myPositionIcon,
  searchResultIcon,
  controller,
  signal,
  movedFromCode,
  ignoreNextScrollEvent,
  currentScrollIndex,
  maxScroll,
  anchors,
  currentScroll,
  directions,
  isochrone,
  myposition,
  search,
  compare,
  menu
};

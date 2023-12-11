/** global: map */
let map = null;
let mapRLT = null;

/**
 * global: layer display state
 * @todo gerer une liste de couches
 */
let baseLayerDisplayed = localStorage.getItem("lastBaseLayerDisplayed") || 'ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS';
let dataLayerDisplayed = localStorage.getItem("lastDataLayerDisplayed") || '';

/**
 * global: back button state
 * is one of: 'default' 'search' 'mainMenu' 'params' 'legal' 'privacy' 'infos' 'legend' 'layerManagerWindow' 'route' ...
 */
let backButtonState = 'default';

/**
 * global: map state
 * is one of: 'default' 'drawRoute' 'compare' ...
 */
let mapState = 'default';

/** global: last text in search bar */
let lastTextInSearch = '';

/** global: flag to check if map move fired by code */
let movedFromCode = false;

/** global: flag to check if scoll fired by code */
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

// Global Layer Manager
let manager = null;

// Global POI filters
let poi = null;

// Global route draw
let routeDraw = null;

// Global interactivity
let interactivity = null;

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
  menu,
  manager,
  poi,
  routeDraw,
  interactivity,
};

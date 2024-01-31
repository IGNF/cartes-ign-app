/** global: map */
let map = null;
let mapRLT1 = null;
let mapRLT2 = null;

/**
 * global: layer display state
 */
let layersDisplayed;
if (!localStorage.getItem("lastLayersDisplayed")) {
  layersDisplayed = ["PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS"];
} else {
  layersDisplayed = JSON.parse(localStorage.getItem("lastLayersDisplayed"));
}

/**
 * global: back button state
 * is one of: 'default' 'search' 'params' 'legal' 'privacy' 'infos' 'layerManagerWindow' 'route' ...
 */
let backButtonState = "default";

/**
 * global: map state
 * is one of: 'default' 'drawRoute' 'compare' ...
 */
let mapState = "default";

/** global: last text in search bar */
let lastTextInSearch = "";

/** global: flag to check if map move fired by code */
let movedFromCode = false;

let myPositionMarker = null;
let searchResultMarker = null;

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

// Global Position plugin
let position = null;

// Global Compare Plugin
let compare = null;
let comparedLayers = ["ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS", "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965$GEOPORTAIL:OGC:WMTS"];

// Global Menu navigation
let menu = null;

// Global Layer Manager
let manager = null;

// Global POI filters
let poi = null;

// Global route draw
let routeDraw = null;

// Global interactivity
let interactivityIndicator = null;

// Global control mapInteractivity
let mapInteractivity = null;

// Global control my account
let myaccount = null;

// Global control compare Poi
let comparePoi = null;

// Global control signalement
let signalement = null;

// Scroll
let maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
let anchors = [0, maxScroll / 2.5, maxScroll];
let currentScrollIndex = 0;
let currentScroll = window.scrollY;

export default {
  map,
  mapRLT1,
  mapRLT2,
  layersDisplayed,
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
  currentScrollIndex,
  maxScroll,
  anchors,
  currentScroll,
  directions,
  isochrone,
  position,
  search,
  compare,
  comparedLayers,
  menu,
  manager,
  poi,
  routeDraw,
  interactivityIndicator,
  mapInteractivity,
  myaccount,
  comparePoi,
  signalement,
};

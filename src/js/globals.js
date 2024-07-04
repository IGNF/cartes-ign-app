/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/** global: map */
let map = null;
let mapRLT1 = null;
let mapRLT2 = null;

/**
 * global: layer display state
 */
let layersDisplayed;
if (!localStorage.getItem("lastLayersDisplayed")) {
  layersDisplayed = [
    {
      id: "PLAN.IGN.INTERACTIF$GEOPORTAIL:GPP:TMS",
      opacity: 100,
      visible: true,
      gray: false,
    }
  ]
  ;
} else {
  layersDisplayed = JSON.parse(localStorage.getItem("lastLayersDisplayed"));
}

/**
 * global: back button state
 * is one of: 'default' 'search' 'params' 'legal' 'privacy' 'infos' 'layerManagerWindow' 'route' ...
 */
let backButtonState = "default";

/** global: last text in search bar */
let lastTextInSearch = "";

let myPositionMarker = null;
let searchResultMarker = null;

let myPositionIcon;
let myPositionIconGrey;
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
let comparedLayers = ["ORTHOIMAGERY.ORTHOPHOTOS.1950-1965$GEOPORTAIL:OGC:WMTS", "ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS"];

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
let signalementOSM = null;

// Global control 3d
let threeD = null;

// Global flag: is the device connected to the internet?
let online = true;

// Scroll
let maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
let anchors = [0, maxScroll / 2.5, maxScroll];
let currentScrollIndex = 0;

let mapLoaded = false;

export default {
  map,
  mapRLT1,
  mapRLT2,
  layersDisplayed,
  backButtonState,
  lastTextInSearch,
  myPositionMarker,
  searchResultMarker,
  myPositionIcon,
  myPositionIconGrey,
  searchResultIcon,
  controller,
  signal,
  currentScrollIndex,
  maxScroll,
  anchors,
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
  signalementOSM,
  online,
  mapLoaded,
  threeD,
};

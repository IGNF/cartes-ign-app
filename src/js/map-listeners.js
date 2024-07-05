/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";

import DOM from "./dom";
import Globals from "./globals";
import Location from "./services/location";

/**
 * Ecouteurs sur la carte
 */
const addListeners = () => {
  const map = Globals.map;
  // Rotation de la carte avec le mutlitouch
  map.on("rotate", () => {
    DOM.$compassBtn.style.transform = "rotate(" + (map.getBearing() * -1) + "deg)";
    if (map.getBearing() !== 0) {
      DOM.$compassBtn.classList.remove("d-none");
    } else {
      DOM.$compassBtn.classList.add("d-none");
    }
  });

  let lastMapCenter = null;
  // Désactivation du tracking au déplacement non programmatique de la carte
  map.on("dragstart", () => {
    if (Location.isTrackingActive()){
      lastMapCenter = map.getCenter();
    }
  });
  map.on("dragend", () => {
    if (Location.isTrackingActive() && lastMapCenter){
      if (lastMapCenter.distanceTo(map.getCenter()) > 100) {
        // De tracking a simple suivi de position
        Location.disableTracking();
      }
    }
    lastMapCenter = null;
  });

  // l'event contextmenu n'est pas enclenché par clic long sur la carte... https://github.com/maplibre/maplibre-gl-js/issues/373
  // map.on("contextmenu", ...) serait mieux
  // utilisation du HACK https://stackoverflow.com/questions/43459539/mapbox-gl-js-long-tap-press
  let contextMenuTimeout = null;
  const clearContextMenuTimeout = () => { clearTimeout(contextMenuTimeout); };
  map.on("touchstart", (evt) => {
    if (evt.originalEvent.touches.length > 1) {
      return;
    }
    // Repère placé uniquement en mode défaut, position, informations, couches ou filtres POI
    if (
      Globals.backButtonState !== "default" &&
      Globals.backButtonState.split("-")[0] !== "position" &&
      Globals.backButtonState !== "informations" &&
      Globals.backButtonState !== "layerManager" &&
      Globals.backButtonState !== "poi"
    ) {
      return;
    }
    contextMenuTimeout = setTimeout(() => {
      if (Globals.backButtonState.split("-")[0] === "position") {
        Globals.menu.close("position");
      }
      Globals.position.compute({ lngLat: evt.lngLat }).then(() => {
        Globals.menu.open("position");
      });
      Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
        .setLngLat(evt.lngLat)
        .addTo(Globals.map);
    }, 500);
    map.on("touchend", clearContextMenuTimeout);
    map.on("touchcancel", clearContextMenuTimeout);
    map.on("touchmove", clearContextMenuTimeout);
    map.on("pointerdrag", clearContextMenuTimeout);
    map.on("pointermove", clearContextMenuTimeout);
    map.on("moveend", clearContextMenuTimeout);
    map.on("gesturestart", clearContextMenuTimeout);
    map.on("gesturechange", clearContextMenuTimeout);
    map.on("gestureend", clearContextMenuTimeout);
  });

  // map.on("data", (e) => {
  //   if (!e.isSourceLoaded)  {
  //     return;
  //   }
  //   if (!e.tile) {
  //     return;
  //   }
  //   console.debug("data", e);
  // });
};

export default {
  addListeners
};

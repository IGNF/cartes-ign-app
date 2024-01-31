import maplibregl from "maplibre-gl";

import DOM from "./dom";
import Globals from "./globals";
import Location from "./services/location";

/**
 * Ecouteurs sur la carte
 */
const addListeners = () => {
  const map = Globals.map;

  // TODO pour des zooms à niveaux entiers uniquement (utilie si POI toujouts limités à zoom 16)
  // map.on('zoom', function() {
  //   var currentZoom = map.getZoom();
  //   var roundedZoom = Math.round(currentZoom); // Round the zoom level to the nearest whole number

  //   if (currentZoom !== roundedZoom) {
  //       // Set the map's zoom level to the rounded value
  //       map.once('moveend', function() {
  //           map.setZoom(roundedZoom);
  //       });
  //   }
  // });

  // Rotation de la carte avec le mutlitouch
  map.on("rotate", () => {
    DOM.$compassBtn.style.transform = "rotate(" + (map.getBearing() * -1) + "deg)";
    DOM.$compassBtn.classList.remove("d-none");
  });

  // Désactivation du tracking au déplacement non programmatique de la carte
  map.on("movestart", function () {
    if (Globals.movedFromCode) {
      return;
    } else if (Location.isTrackingActive()){
      // De tracking a simple suivi de position
      Location.disableTracking();
    }
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
    if (
      Globals.backButtonState !== "default" &&
      Globals.backButtonState !== "position" &&
      Globals.backButtonState !== "informations" &&
      Globals.backButtonState !== "layerManager" &&
      Globals.backButtonState !== "poi"
    ) {
      return;
    }
    contextMenuTimeout = setTimeout(() => {
      if (Globals.backButtonState === "position") {
        Globals.menu.close("position");
      }
      Globals.position.compute(evt.lngLat).then(() => {
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

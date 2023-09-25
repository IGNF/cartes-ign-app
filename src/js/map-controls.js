import maplibregl from "maplibre-gl";
import MapLibreGlCompare from "@maplibre/maplibre-gl-compare";

import Globals from './globals';
import LayerSwitch from './layer-switch';
import Directions from "./directions/directions";
import Isochron from "./isochron/isochron";
import Position from "./my-position";
import MenuDisplay from './menu-display';

let sideBySide;

const map = Globals.map;
const mapRLT = Globals.mapRLT;

let prevDataLayerDisplayed = '';

/**
 * Ajout des contrôle à la fin du chargement de la carte
 * @see maplibregl.ScaleControl
 * @see Directions
 * @see Isochron
 */
const addMapControls = () => {
  // on ajoute les contrôles à la fin du chargement de la carte
  map.on("load", () => {

    // contrôle de calcul d'itineraire
    Globals.directions = new Directions(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { MenuDisplay.openSearchDirections(); },
      closeSearchControlCbk : () => { MenuDisplay.closeSearchDirections(); }
    });

    // contrôle de calcul d'isochrone
    Globals.isochron = new Isochron(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { MenuDisplay.openSearchIsochron(); },
      closeSearchControlCbk : () => { MenuDisplay.closeSearchIsochron(); }
    });

    // contrôle "Où suis-je ?"
    Globals.myposition = new Position(map, {
        // callback sur l'ouverture / fermeture du panneau
        openMyPositionCbk : () => { MenuDisplay.openMyPosition(); },
        closeMyPositionCbk : () => { MenuDisplay.closeMyPosition(); },
        openIsochronCbk : () => { MenuDisplay.openIsochron(); }
    });

    // échelle graphique
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 80,
      unit: 'metric'
    }), "top-left");
  });
}

/**
 * Ajout du contrôle de comparaison de carte
 */
const addSideBySide = () => {
  const container = "#cartoContainer";
  mapRLT.setCenter(map.getCenter());
  mapRLT.setZoom(map.getZoom());
  sideBySide = new MapLibreGlCompare(map, mapRLT, container);

  Globals.mapState = "compare";
  document.querySelector(".baseLayer:not(.selectedLayer)").click();

  prevDataLayerDisplayed = Globals.dataLayerDisplayed;
  LayerSwitch.displayDataLayer(Globals.dataLayerDisplayed);
  document.querySelector("#dataLayers").classList.add("d-none");
  document.querySelector("#dataLayersLabel").classList.add("d-none");
  document.querySelector("#sideBySideOff").classList.remove("d-none");
  document.querySelector("#sideBySideOn").classList.add("d-none");
  document.querySelector(".selectedLayer").style.pointerEvents = "none";
  MenuDisplay.openCat();
}

/**
 * Suppression du contrôle de comparaison de carte
 */
const removeSideBySide = () => {
  document.querySelectorAll(".baseLayer").forEach(elem => {
    elem.classList.remove('comparedLayer');
  });
  document.querySelector(".selectedLayer").style.pointerEvents = "";
  if (sideBySide) {
    sideBySide.remove();
  }
  Globals.mapState = "default";
  document.querySelector("#dataLayers").classList.remove("d-none");
  document.querySelector("#dataLayersLabel").classList.remove("d-none");
  document.querySelector("#sideBySideOff").classList.add("d-none");
  document.querySelector("#sideBySideOn").classList.remove("d-none");
  LayerSwitch.displayDataLayer(prevDataLayerDisplayed);
}

/** ... */
const startDrawRoute = () => {
  Globals.mapState = "drawRoute";
}

export default {
  addMapControls,
  addSideBySide,
  removeSideBySide,
  startDrawRoute,
}

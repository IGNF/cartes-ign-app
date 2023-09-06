import maplibregl from "maplibre-gl";
import MapLibreGlCompare from "@maplibre/maplibre-gl-compare";

import Globals from './globals';
import LayerSwitch from './layer-switch';
import Directions from "./directions/directions";
import MenuDisplay from './menu-display';

let sideBySide;

const map = Globals.map;
const mapRLT = Globals.mapRLT;

let prevDataLayerDisplayed = '';

function addMapControls() {
  // Échelle graphique
  const scale = new maplibregl.ScaleControl({
    maxWidth: 80,
    unit: 'metric'
  });
  map.addControl(scale, "top-left");

  // Calcul d'itinéraire
  map.on("load", () => {
    Globals.directions = new Directions(map, {});
  });
}

function addSideBySide() {
  const container = "#cartoContainer";
  mapRLT.setCenter(map.getCenter());
  mapRLT.setZoom(map.getZoom());
  sideBySide = new MapLibreGlCompare(map, mapRLT, container);

  Globals.sideBySideOn = true;
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

function removeSideBySide() {
  document.querySelectorAll(".baseLayer").forEach(elem => {
    elem.classList.remove('comparedLayer');
  });
  document.querySelector(".selectedLayer").style.pointerEvents = "";
  if (sideBySide) {
    sideBySide.remove();
  }
  document.querySelector("#dataLayers").classList.remove("d-none");
  document.querySelector("#dataLayersLabel").classList.remove("d-none");
  document.querySelector("#sideBySideOff").classList.add("d-none");
  document.querySelector("#sideBySideOn").classList.remove("d-none");
  LayerSwitch.displayDataLayer(prevDataLayerDisplayed);
}

export default {
  addMapControls,
  addSideBySide,
  removeSideBySide,
}

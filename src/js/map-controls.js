import Globals from './globals';
import LayerSwitch from './layer-switch';
import MenuDisplay from './menu-display';

import MapLibreGlDirections from "@maplibre/maplibre-gl-directions";

let sideBySide;
let directions;
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
  directions = new MapLibreGlDirections(map);
}

function addSideBySide() {
  const container = "#cartoContainer";
  mapRLT.setCenter(map.getCenter());
  mapRLT.setZoom(map.getZoom());
  sideBySide = new maplibregl.Compare(map, mapRLT, container);

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
  sideBySide.remove();
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

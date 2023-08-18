import Globals from './globals';
import * as LayerSwitch from './layer-switch';
import * as MenuDisplay from './menu-display';

let sideBySide = L.control.sideBySide();
const map = Globals.map;

let prevDataLayerDisplayed = '';

function addMapControls() {
  // Échelle graphique
  L.control.scale({
    imperial: false,
    maxWidth: 150,
    position: "topleft",
  }).addTo(map);
}

function addSideBySide() {
  sideBySide.addTo(map);
  sideBySide.setLeftLayers(Globals.baseLayer.getLayers()[0]);
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
  map.removeControl(sideBySide);
  document.querySelectorAll(".baseLayer").forEach(elem => {
    elem.classList.remove('comparedLayer');
  });
  Globals.compareLayer.clearLayers();
  document.querySelector(".selectedLayer").style.pointerEvents = "";
  Globals.sideBySideOn = false;
  document.querySelector("#dataLayers").classList.remove("d-none");
  document.querySelector("#dataLayersLabel").classList.remove("d-none");
  document.querySelector("#sideBySideOff").classList.add("d-none");
  document.querySelector("#sideBySideOn").classList.remove("d-none");
  LayerSwitch.displayDataLayer(prevDataLayerDisplayed);
}

export {
  addMapControls,
  sideBySide,
  addSideBySide,
  removeSideBySide,
}

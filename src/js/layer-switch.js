import * as MapControls from './map-controls';
import Globals from './globals';
import Layers from './layers';

// Fonctions de changements d'affichages de couches
/* Base Layers */
function displayBaseLayer(layerName) {
  /**
   * Affiche la couche de fond correspondant à l'id de l'objet baseLayers, en comparaison si
   * le contrôle de comparaison est activé
   */
  if (Globals.sideBySideOn) {
    document.querySelectorAll(".baseLayer").forEach(elem => {
      elem.classList.remove('comparedLayer');
    });
    document.getElementById(layerName).classList.add("comparedLayer");

    Globals.compareLayer.clearLayers();
    Globals.compareLayer.addLayer(Layers.baseLayers[layerName]);
    MapControls.sideBySide.setRightLayers(Globals.compareLayer.getLayers()[0]);

  } else {
    document.querySelectorAll(".baseLayer").forEach(elem => {
      elem.classList.remove('selectedLayer');
    });
    document.getElementById(layerName).classList.add("selectedLayer");

    Globals.baseLayer.clearLayers();
    Globals.baseLayer.addLayer(Layers.baseLayers[layerName]);
    Globals.baseLayerDisplayed = layerName;
  }
}

/* Data Layers */
function displayDataLayer(layerName, force=false) {
  /**
   * Affiche la couche de données correspondant à l'id de l'objet baseLayers
   */
  if (layerName == '') {
    return
  }
  document.querySelectorAll(".dataLayer").forEach(elem => {
    elem.classList.remove('selectedLayer');
  });
  if (Globals.dataLayerDisplayed !== layerName || force) {
    document.getElementById(layerName).classList.add("selectedLayer");
  }

  Globals.dataLayers.clearLayers();

  if (Globals.dataLayerDisplayed === layerName && !force) {
    Globals.dataLayerDisplayed = '';
  } else {
    Globals.dataLayers.addLayer(Layers.dataLayers[layerName]);
    Globals.dataLayerDisplayed = layerName;
  }
}

export {
  displayBaseLayer,
  displayDataLayer,
};

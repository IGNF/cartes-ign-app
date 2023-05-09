import * as MenuDisplay from './menu-display';
import * as UpdateLegend from './update-legend';
import Globals from './globals';
import Layers from './layers';

// Fonctions de changements d'affichages de couches
/* Base Layers */
function displayBaseLayer(layerName) {
  /**
   * Affiche la couche de fond correspondant à l'id de l'objet baseLayers
   */
  document.querySelectorAll("#baseLayers img").forEach(elem => {
    elem.classList.remove('selectedLayer');
  });
  document.getElementById(layerName).classList.add("selectedLayer");

  Globals.baseLayers.clearLayers();
  Globals.baseLayers.addLayer(Layers.baseLayers[layerName]);

  UpdateLegend.updateLegend();

  Globals.baseLayerDisplayed = layerName;
  MenuDisplay.midScroll();
}

/* Data Layers */
function displayDataLayer(layerName, force=false) {
  /**
   * Affiche la couche de données correspondant à l'id de l'objet baseLayers
   */
  if (layerName == '') {
    return
  }
  document.querySelectorAll("#dataLayers img").forEach(elem => {
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
  UpdateLegend.updateLegend();
}

export {
  displayBaseLayer,
  displayDataLayer,
};

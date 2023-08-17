import * as MapControls from './map-controls';
import Globals from './globals';
import Layers from './layers';

const map2 = Globals.map2

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

    setLayerSource(layerName, "basemap");
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

  setLayerSource("", "data-layer");

  if (Globals.dataLayerDisplayed === layerName && !force) {
    Globals.dataLayerDisplayed = '';
  } else {
    setLayerSource(layerName, "data-layer");
    Globals.dataLayerDisplayed = layerName;
  }
}

function setLayerSource (source, layerType="basemap") {
  const oldLayers = map2.getStyle().layers;
  const layerIndex = oldLayers.findIndex(l => l.id === layerType);
  const layerDef = oldLayers[layerIndex];
  const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
  if (source !== "") {
    layerDef.source = source;
    layerDef.type = "raster";
    delete layerDef.paint;
  } else {
    delete layerDef.source;
    layerDef.type = "background",
    layerDef.paint = {
      "background-opacity": 0,
    }
  }
  map2.removeLayer(layerType);
  map2.addLayer(layerDef, before);
}

export {
  displayBaseLayer,
  displayDataLayer,
};

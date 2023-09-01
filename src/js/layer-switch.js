import Globals from './globals';

const map = Globals.map
const mapRLT = Globals.mapRLT

// Fonctions de changements d'affichages de couches
/* Base Layers */
function displayBaseLayer(layerName) {
  /**
   * Affiche la couche de fond correspondant à l'id de l'objet baseLayers, en comparaison si
   * le contrôle de comparaison est activé
   */
  if (Globals.mapState === "compare") {
    document.querySelectorAll(".baseLayer").forEach(elem => {
      elem.classList.remove('comparedLayer');
    });
    document.getElementById(layerName).classList.add("comparedLayer");

    setLayerSource(layerName, "basemap", "mapRLT");
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

function setLayerSource (source, layerType="basemap", glMap="map") {
  let oldLayers;
  if (glMap === "map") {
    oldLayers = map.getStyle().layers;
  } else if (glMap === "mapRLT") {
    oldLayers = mapRLT.getStyle().layers;
  }

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
  if (glMap === "map") {
    map.removeLayer(layerType);
    map.addLayer(layerDef, before);
  } else if (glMap === "mapRLT") {
    mapRLT.removeLayer(layerType);
    mapRLT.addLayer(layerDef, before);
  }
}

export default {
  displayBaseLayer,
  displayDataLayer,
};

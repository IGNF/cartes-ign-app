import Globals from "./globals";

let buildingsLayers = [];

async function _fetch3dBuildingsLayers() {
  const response = await fetch("data/bati-3d.json");
  const data = await response.json();
  buildingsLayers = data.layers;
}

async function add3dBuildings() {
  if (buildingsLayers.length === 0) {
    await _fetch3dBuildingsLayers();
  }
  // HACK
  // on positionne toujours le style avant ceux du calcul d'itineraires (directions)
  // afin que le calcul soit toujours la couche visible du dessus !
  var layerIndexBefore = Globals.map.getStyle().layers.findIndex((l) => l.source === "maplibre-gl-directions");
  var layerIdBefore = (layerIndexBefore !== -1) ? Globals.map.getStyle().layers[layerIndexBefore].id : null;
  buildingsLayers.forEach((layer) => {
    Globals.map.addLayer(layer, layerIdBefore);
  })
  Globals.interactivityIndicator.hardDisable();
}

function remove3dBuildings() {
  buildingsLayers.forEach((layer) => {
    Globals.map.removeLayer(layer.id);
  })
  Globals.interactivityIndicator.enable();
}

export default {
  add3dBuildings,
  remove3dBuildings,
}

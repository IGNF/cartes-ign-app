/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

/**
 * API de configuration des couches :
 * - couches de base (fonds de carte)
 * - couches de données
 * - couches thématiques
 * @description
 * Les propriétés des couches sont issues de "l'autoconf",
 * et elles sont transformées en configuration de couches Raster et Vector pour MapLibre.
 * La liste des couches de fonds et thématiques est definie dans un fichier de configuration.
 * @todo prévoir le multi couche pour les couches vecteurs tuilés
 */
import BaseLayers from "../data-layer/base-layer-config.json";
import ThematicLayers from "../data-layer/thematics-layer-config.json";
import ConfigLayers from "../data-layer/layers-config.json";

let baseLayers;
let thematicLayers;
let configLayers;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/base-layer-config.json");
  baseLayers = await resp.json();
} catch (e) {
  baseLayers = BaseLayers;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/thematics-layer-config.json");
  thematicLayers = await resp.json();
} catch (e) {
  thematicLayers = ThematicLayers;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/layers-config.json");
  configLayers = await resp.json();
} catch (e) {
  configLayers = ConfigLayers;
}

/**
 * Obtenir la liste des propriétés d'une couche
 * @param {*} id
 * @returns
 */
const getLayerProps = (id) => {
  var props = configLayers.layers[id];
  var isVector = id.split("$")[1] === "TMS" ? true : false;
  var style;
  if (isVector) {
    style = props.styles[0];
  } else {
    style = props.style || "normal";
  }
  var fallbackStyle = "";
  if (isVector) {
    fallbackStyle = props.styles[1];
  }
  var format = props.format;
  var minNativeZoom = props.minNativeZoom || 0;
  var maxNativeZoom = props.maxNativeZoom || 20;
  var interactive = !(props.interactive === false);
  return {
    layer: id.split("$")[0],
    base: getBaseLayers().includes(id), // couche de fonds ou autre
    title: props.title,
    desc: props.description,
    source: props.source || "",
    maj: props.maj || "",
    type: (isVector) ? "vector" : "raster",
    style: (isVector) ? style : style || "normal",
    fallbackStyle: (isVector) ? fallbackStyle : style || "normal",
    format: format || "",
    url: props.serverUrl,
    minNativeZoom: minNativeZoom,
    maxNativeZoom: maxNativeZoom,
    interactive: interactive,
  };
};

/**
 * Liste des couches de fonds
 * @returns
 */
const getBaseLayers = () => {
  return baseLayers["base-layers"];
};

/**
 * Liste des couches RLT
 * @returns
 */
const getRLTLayers = () => {
  return baseLayers["rlt-layers"];
};

/**
 * Liste des couches thématiques
 * (le tri alpha est realisé)
 * @returns
 */
const getThematicLayers = () => {
  var arrays = thematicLayers.map((o) => { return o.layers; });
  return arrays.flat();
};

/**
 * Liste des thémes
 * (l'ordre est defini dans le json)
 * @returns
 */
const getThematics = () => {
  return thematicLayers.map((o) => { return o.name; });
};

/**
 * Liste des couches pour un théme
 * (le tri alpha est realisé)
 * @param {*} name
 * @returns
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayersByThematic = (name) => {
  var data = thematicLayers.find((element) => { return element.name === name; });
  if (data.settings && data.settings.generic) {
    return getThematicLayers();
  }
  return data.layers;
};

/**
 * Obtenir le thème d'une couche
 * @param {*} id
 * @returns
 */
const getThematicByLayerID = (id) => {
  var data = thematicLayers.find((element) => { return element.layers.includes(id); });
  return data.name;
};

/**
 * Creer les propriétés d'une couche (source) pour la librairie MapLibre
 * @param {*} id
 */
const createSource = (id) => {
  // ex. "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950$WMTS"
  var name = id.split("$")[0];
  var service = id.split("$")[1];

  var fxt;
  switch (service) {
  case "WMTS":
    fxt = createRasterTileSource;
    break;
  case "WMS":
    fxt = createRasterSource;
    break;
  case "TMS":
    // INFO
    // les couches tuiles vectorielles ne devrait pas être pré chargées car
    // on ne connait pas encore la liste exhaustive des sources contenues
    // dans le fichier de style.
    fxt = createVectorSource;
    break;
  default:
    throw new Error(`LayerConfig : ID layer service (${name}) is not conforme : ${service}`);
  }
  return fxt(id);
};

/**
 * Creer les propriétés d'une couche de type Tile Raster pour la librairie MapLibre
 * @param {*} id
 * @returns
 */
const createRasterTileSource = (id) => {
  var props = getLayerProps(id);
  var url = `${props.url}?` +
    "REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&" +
    `STYLE=${props.style}&` +
    "TILEMATRIXSET=PM&" +
    `FORMAT=${props.format}&`+
    `LAYER=${props.layer}&`+
    "TILEMATRIX={z}&" +
    "TILEROW={y}&" +
    "TILECOL={x}";
  if (props.url.includes("/private/")) {
    // Ajout de la clef d'API de l'appli si l'URL est privée
    url += `&apikey=${process.env.GPF_key}`;
  }
  return {
    type: "raster",
    tiles: [url],
    tileSize: 256,
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  };
};

/**
 * Creer les propriétés d'une couche de type Vector pour la librairie MapLibre
 * @param {*} id
 */
const createVectorSource = (id) => {
  var props = getLayerProps(id);
  var url = props.url + props.layer + "/{z}/{x}/{y}.pbf";
  return {
    type: "vector",
    tiles: [url],
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  };
};

/**
 * Creer les propriétés d'une couche de type Raster pour la librairie MapLibre
 * @param {*} id
 */
const createRasterSource = (id) => {
  var props = getLayerProps(id);
  var url = `${props.url}` +
    "REQUEST=GetMap&VERSION=1.3.0&" +
    "BBOX={bbox-epsg-3857}&" +
    "SRS=EPSG:3857&" +
    `FORMAT=${props.format}&`+
    `LAYERS=${props.layer}&`+
    "TRANSPARENT=true&" +
    "WIDTH=256&" +
    "HEIGHT=256";
  if (props.url.includes("/private/")) {
    // Ajout de la clef d'API de l'appli si l'URL est privée
    url += `&apikey=${process.env.GPF_key}`;
  }
  return {
    type: "raster",
    tiles: [url],
    tileSize: 256,
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  };
};

export default {
  getLayerProps,
  getBaseLayers,
  getRLTLayers,
  getThematicLayers,
  getThematics,
  getLayersByThematic,
  getThematicByLayerID,
  baseLayerSources: Object.fromEntries(
    getBaseLayers().map( (id) => [id, createSource(id)] )
  ),
  rltLayerSources: Object.fromEntries(
    getRLTLayers().map( (id) => [id, createSource(id)] )
  ),
  thematicLayerSources: Object.fromEntries(
    getThematicLayers().map( (id) => [id, createSource(id)] )
  )
};

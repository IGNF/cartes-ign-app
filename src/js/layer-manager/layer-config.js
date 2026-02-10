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

import { config } from "../utils/config-utils";

/**
 * Obtenir la liste des propriétés d'une couche
 * @param {*} id
 * @returns
 */
const getLayerProps = (id) => {
  var props = config.configLayers.layers[id];
  var isVector = false;
  if (id.split("$")[1] === "TMS" || id.split("$")[1] === "PMTILES") {
    isVector = true;
  }
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
  var defaultOpacity = props.defaultOpacity || 100;
  var quickLookUrl = props.quickLookUrl || "data/img/layers/" + id.split("$")[0] + ".jpg";
  var legendUrl = props.legendUrl || "data/img/legends/" + id.split("$")[0] + ".png";

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
    defaultOpacity: defaultOpacity,
    quickLookUrl: quickLookUrl,
    legendUrl: legendUrl,
  };
};

/**
 * Obtenir la liste des propriétés d'une couche temporaire
 * @param {*} id
 * @returns
 */
const getTempLayerProps = (id) => {
  var props = JSON.parse(JSON.stringify(config.tempLayers)).filter(elem => elem.id === id)[0];
  return {
    layer: props.id,
    base: false, // couche de fonds ou autre
    title: props.name,
    desc: props.description,
    source: props.source || "",
    maj: props.maj || "",
    type: props.layerSourceType,
    style: "",
    fallbackStyle: "",
    format: "",
    url: props.layerUrl,
    minNativeZoom: 0,
    maxNativeZoom: 20,
    interactive: true,
    quickLookUrl: props.quickLookUrl,
    layerType: props.layerType,
    layerDef: props.layer,
  };
};

/**
 * Liste des couches de fonds
 * @returns
 */
const getBaseLayers = () => {
  return config.baseLayers["base-layers"];
};

/**
 * Liste des couches RLT
 * @returns
 */
const getRLTLayers = () => {
  return config.baseLayers["rlt-layers"];
};

/**
 * Liste des couches thématiques
 * (le tri alpha est realisé)
 * @returns
 */
const getThematicLayers = () => {
  var arrays = config.thematicLayers.filter(o => o.name !== "Évènements").map((o) => { return o.layers; });
  return arrays.flat();
};

/**
 * Liste des couches temporaires
 * @returns
 */
const getTempLayers = () => {
  return JSON.parse(JSON.stringify(config.tempLayers));
};

/**
 * Liste des thémes
 * (l'ordre est defini dans le json)
 * @returns
 */
const getThematics = () => {
  return config.thematicLayers.map((o) => { return o.name; });
};

/**
 * Liste des couches pour un théme
 * (le tri alpha est realisé)
 * @param {*} name
 * @returns
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayersByThematic = (name) => {
  var data = config.thematicLayers.find((element) => { return element.name === name; });
  if (data.settings && data.settings.generic) {
    return getThematicLayers().concat(getTempLayers().map((layer) => layer.id));
  }
  return data.layers;
};

/**
 * Obtenir le thème d'une couche
 * @param {*} id
 * @returns
 */
const getThematicByLayerID = (id) => {
  var data = config.thematicLayers.find((element) => { return element.layers.includes(id); });
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
  case "PMTILES":
    fxt = createVectorPMTilesSource;
    break;
  default:
    throw new Error(`LayerConfig : ID layer service (${name}) is not conforme : ${service}`);
  }
  return fxt(id);
};

/**
 * Creer les propriétés d'une couche (source) pour la librairie MapLibre
 * @param {*} layer
 */
const createTempSource = (layer) => {
  var name = layer.id;
  var type = layer.layerSourceType;

  var fxt;
  switch (type) {
  case "raster":
    fxt = createTempRasterSource;
    break;
  case "vector":
    fxt = createTempVectorSource;
    break;
  case "geojson":
    fxt = createTempGeojsonSource;
    break;
  default:
    throw new Error(`LayerConfig : ID layer service (${name}) is not conforme : ${type}`);
  }
  return fxt(layer);
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
 * Creer les propriétés d'une couche de type Vector au format PMTiles pour la librairie MapLibre
 * @param {*} id
 */
const createVectorPMTilesSource = (id) => {
  var props = getLayerProps(id);
  return {
    type: "vector",
    url: props.url,
  };
};

/**
 * Creer les propriétés d'une couche de type Vector pour la librairie MapLibre
 * @param {*} layer
 */
const createTempVectorSource = (layer) => {
  // PM tiles uniquement pour les temp layers @see https://docs.protomaps.com/pmtiles/maplibre#installation
  return {
    type: "vector",
    url: layer.layerUrl,
  };
};

/**
 * Creer les propriétés d'une couche de type geojson pour la librairie MapLibre
 * @param {*} layer
 */
const createTempGeojsonSource = (layer) => {
  return {
    type: "geojson",
    data: layer.layerUrl,
    maxzoom: layer.maxNativeZoom || 20,
  };
};

/**
 * Creer les propriétés d'une couche de type geojson pour la librairie MapLibre
 * @param {*} layer
 */
const createTempRasterSource = (layer) => {
  return {
    type: "raster",
    tiles: [layer.layerUrl],
    tileSize: layer.tileSize || 256,
    maxzoom: layer.maxNativeZoom || 20,
    minzoom: layer.minNativeZoom || 0,
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
  getTempLayers,
  getTempLayerProps,
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
  ),
  tempLayerSources: Object.fromEntries(
    getTempLayers().map( (layer) => [layer.id, createTempSource(layer)] )
  ),
};

/**
 * API de configuration des couches :
 * - couches de base (fonds de carte)
 * - couches de données
 * - couches thématiques
 * @description
 * Les propriétés des couches sont issues de "l'autoconf",
 * et elles sont transformées en configuration de couches Raster et Vector pour MapLibre.
 * La liste des couches de fonds et thématiques est definie dans un fichier de configuration.
 */
import BaseLayers from "./data-layer/base-layer-config.json";
import ThematicLayers from "./data-layer/thematics-layer-config.json";
import ConfigLayers from "./data-layer/geoportal-configuration.json";

/**
 * Obtenir le zoom à partir de l'échelle
 * @param {*} scaleDenominator 
 * @returns 
 */
const getZoomLevelFromScaleDenominator = (scaleDenominator) => {
  // par defaut, on utilise la projection WebMercator (EPSG:3857 = PM)
  var resolutionsNatives = {
    0 : 156543.033928041,
    1 : 78271.51696402048,
    2 : 39135.758482010235,
    3 : 19567.87924100512,
    4 : 9783.93962050256,
    5 : 4891.96981025128,
    6 : 2445.98490512564,
    7 : 1222.99245256282,
    8 : 611.49622628141,
    9 : 305.7481131407048,
    10 : 152.8740565703525,
    11 : 76.43702828517624,
    12 : 38.21851414258813,
    13 : 19.10925707129406,
    14 : 9.554628535647032,
    15 : 4.777314267823516,
    16 : 2.388657133911758,
    17 : 1.194328566955879,
    18 : 0.5971642834779395,
    19 : 0.2985821417389697,
    20 : 0.1492910708694849,
    21 : 0.0746455354347424
  };

  var resolution = scaleDenominator * 0.00028;

  for (var index in resolutionsNatives) {
    if (resolutionsNatives.hasOwnProperty(index)) {
      if (resolutionsNatives[index] <= resolution) {
        index = parseInt(index, 10);
        return index;
      }
    }
  }
  
  return 0;
};

/**
 * Obtenir la liste des propriétés d'une couche
 * @param {*} id 
 * @returns 
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayerProps = (id) => {
  var props = ConfigLayers.layers[id];
  return {
    layer: props.name,
    title: props.title,
    desc: props.description,
    style: (props.styles.lenght > 0) ? props.styles[0].name : "normal",
    format: props.formats[0].name,
    minNativeZoom: getZoomLevelFromScaleDenominator(props.globalConstraint.maxScaleDenominator) || 0,
    maxNativeZoom: getZoomLevelFromScaleDenominator(props.globalConstraint.minScaleDenominator) || 21,
  }
};

/**
 * Liste des couches de fonds
 * @returns 
 */
const getBaseLayers = () => {
  return BaseLayers["base-layer"];
};

/**
 * Liste des couches de données
 * @returns 
 */
const getDataLayers = () => {
  return BaseLayers["data-layer"];
};

/**
 * Liste des thémes
 * @returns
 */
const getThematics = () => {
  return ThematicLayers.map((o) => {o.name});
};

/**
 * Liste des couches pour un théme
 * @param {*} name
 * @returns 
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayersByThematic = (name) => {
  var layers = {};
  var thematics = getThematics();
  for (let i = 0; i < thematics.length; i++) {
    const element = thematics[i];
    if (element.name === name) {
      // on parcours les clefs thématiques pour trouver toutes les couches
      for (let j = 0; j < element.keys.length; j++) {
        const key = element.keys[j];
        var lstLayersByKey = ConfigLayers.generalOptions.apiKeys[key];
        for (let k = 0; k < lstLayersByKey.length; k++) {
          const layer = lstLayersByKey[k];
          if (layer.split("$")[1] === "GEOPORTAIL:OGC:WMTS") {
            layers[layer] = 1;
          }
        }
      }
      // on parcours la liste des couches
      for (let n = 0; n < element.layers.length; n++) {
        const layer = element.layers[n];
        if (layer.split("$")[1] === "GEOPORTAIL:OGC:WMTS") {
          layers[layer] = 1;
        }
      }
    }
  }
  return layers.map((id) => [id]);
};

/**
 * Creer le template URL pour une couche
 * @param {*} id 
 * @returns 
 */
const createWmtsUrlFromId = (id) => {
  var props = getLayerProps(id);
  return `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
  `REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&` +
  `STYLE=${props.style}&` +
  `TILEMATRIXSET=PM&` +
  `FORMAT=${props.format}&`+
  `LAYER=${props.layer}&`+
  `TILEMATRIX={z}&` +
  `TILEROW={y}&` +
  `TILECOL={x}`
};

/**
 * Creer les propriétés d'une couche de type Raster pour la librairie MapLibre
 * @param {*} id 
 * @returns 
 */
const createRasterSource = (id) => {
  var props = getLayerProps(id);
  return {
    type: "raster",
    tiles: [createWmtsUrlFromId(id)],
    tileSize: 256,
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  }
};

/**
 * Creer les propriétés d'une couche de type Vector pour la librairie MapLibre
 * @param {*} id 
 * @todo
 */
const createVectorSource = (id) => {};

export default {
  getLayerProps,
  getBaseLayers,
  getDataLayers,
  getThematics,
  getLayersByThematic,
  baseLayerSources: Object.fromEntries(
    getBaseLayers().map( (id) => [id, createRasterSource(id)] )
  ),
  dataLayerSources: Object.fromEntries(
    getDataLayers().map( (id) => [id, createRasterSource(id)] )
  )
};

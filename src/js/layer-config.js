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
import ConfigLayers from "./data-layer/layers-config.json";

/**
 * Clef API pour toutes les couches
 */
const key = "epi5gbeldn6mblrnq95ce0mc";

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
 */
const getLayerProps = (id) => {
  var props = ConfigLayers.layers[id];
  var isVector = (props.serviceParams.id === "GPP:TMS") ? true : false;
  return {
    layer: props.name,
    title: props.title,
    desc: props.description,
    style: (props.styles.length > 0) ? (isVector) ? props.styles[0].url : props.styles[0].name : "normal",
    format: props.formats[0].name,
    url: props.serviceParams.serverUrl[key],
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
 * Liste des couches thématiques
 * (le tri alpha est realisé)
 * @returns 
 */
const getThematicLayers = () => {
  var arrays = ThematicLayers.map((o) => { return o.layers });
  return arrays.flat().sort();
};

/**
 * Liste des thémes
 * (l'ordre est defini dans le json)
 * @returns
 */
const getThematics = () => {
  return ThematicLayers.map((o) => { return o.name });
};

/**
 * Liste des couches pour un théme 
 * (le tri alpha est realisé)
 * @param {*} name
 * @returns 
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayersByThematic = (name) => {
  var data = ThematicLayers.find((element) => { return element.name === name });
  if (data.settings && data.settings.generic) {
    return getThematicLayers();
  }
  return data.layers.sort();
};

/**
 * Creer les propriétés d'une couche (source) pour la librairie MapLibre
 * @param {*} id 
 */
const createSource = (id) => {
  // ex. "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950$GEOPORTAIL:OGC:WMTS"
  var name = id.split("$")[0];
  var params = id.split("$")[1].split(":");
  if (params.length !== 3) {
    throw new Error("LayerConfig : ID layer name is not conforme");
  }

  var register = params[0]; // GEOPORTAIL ou INSPIRE
  var norme = params[1]; // OGC ou GPP
  var service = params[2]; // WMTS, WMS ou TMS

  var fxt;
  switch (service) {
    case "WMTS":
      fxt = createRasterTileSource;
      break;
    case "WMS":
      fxt = createRasterSource;
      break;
    case "TMS":
      fxt = createVectorSource;
      break;
    default:
      throw new Error(`LayerConfig : ID layer service (${name}) is not conforme : ${register} - ${norme} - ${service}`);
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
    `REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&` +
    `STYLE=${props.style}&` +
    `TILEMATRIXSET=PM&` +
    `FORMAT=${props.format}&`+
    `LAYER=${props.layer}&`+
    `TILEMATRIX={z}&` +
    `TILEROW={y}&` +
    `TILECOL={x}`;
  return {
    type: "raster",
    tiles: [url],
    tileSize: 256,
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  }
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
  }
};

/**
 * Creer les propriétés d'une couche de type Raster pour la librairie MapLibre
 * @param {*} id 
 */
const createRasterSource = (id) => {
  var props = getLayerProps(id);
  var url = `${props.url}` +
    `REQUEST=GetMap&VERSION=1.3.0&` +
    `BBOX={bbox-epsg-3857}&` +
    `SRS=EPSG:3857&` +
    `FORMAT=${props.format}&`+
    `LAYERS=${props.layer}&`+
    `TRANSPARENT=true&` +
    `WIDTH=256&` +
    `HEIGHT=256`;
  return {
    type: "raster",
    tiles: [url],
    tileSize: 256,
    maxzoom: props.maxNativeZoom,
    minzoom: props.minNativeZoom,
  }
};

export default {
  getLayerProps,
  getBaseLayers,
  getDataLayers,
  getThematicLayers,
  getThematics,
  getLayersByThematic,
  baseLayerSources: Object.fromEntries(
    getBaseLayers().map( (id) => [id, createSource(id)] )
  ),
  dataLayerSources: Object.fromEntries(
    getDataLayers().map( (id) => [id, createSource(id)] )
  ),
  thematicLayerSources: Object.fromEntries(
    getThematicLayers().map( (id) => [id, createSource(id)] )
  )
};

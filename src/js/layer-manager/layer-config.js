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

/**
 * Clef API (epi5gbeldn6mblrnq95ce0mc) pour toutes les couches (Oshimae)
 */
const key = Object.keys(ConfigLayers.generalOptions.apiKeys)[0]; // une seule clef !

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
    if (Object.prototype.hasOwnProperty.call(resolutionsNatives, index)) {
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
  var style = (props.styles.length) ? props.styles.find((s) => { return s.current === true; }) : "normal";
  if (!style) {
    style = props.styles[0];
  }
  var format = props.formats.length ? props.formats.find((f) => { return f.current === true; }) : "";
  if (!format) {
    format = props.formats[0];
  }
  var minNativeZoom = getZoomLevelFromScaleDenominator(props.globalConstraint.maxScaleDenominator) || 0;
  var maxNativeZoom = getZoomLevelFromScaleDenominator(props.globalConstraint.maxScaleDenominator) || 21;
  if (props.wmtsOptions) {
    var zoomLevels = Object.keys(props.wmtsOptions.tileMatrixSetLimits);
    minNativeZoom = Math.min(...zoomLevels);
    maxNativeZoom = Math.max(...zoomLevels);
  }
  return {
    layer: props.name,
    base: getBaseLayers().includes(id), // couche de fonds ou autre
    title: props.title,
    desc: props.description,
    type: (isVector) ? "vector" : "raster",
    style: (isVector) ? style.url : style.name || "normal",
    format: format.name || "",
    url: props.serviceParams.serverUrl[key],
    minNativeZoom: minNativeZoom,
    maxNativeZoom: maxNativeZoom,
  };
};

/**
 * Liste des couches de fonds
 * @returns
 */
const getBaseLayers = () => {
  return BaseLayers["base-layers"];
};

/**
 * Liste des couches RLT
 * @returns
 */
const getRLTLayers = () => {
  return BaseLayers["rlt-layers"];
};

/**
 * Liste des couches thématiques
 * (le tri alpha est realisé)
 * @returns
 */
const getThematicLayers = () => {
  var arrays = ThematicLayers.map((o) => { return o.layers; });
  return arrays.flat();
};

/**
 * Liste des thémes
 * (l'ordre est defini dans le json)
 * @returns
 */
const getThematics = () => {
  return ThematicLayers.map((o) => { return o.name; });
};

/**
 * Liste des couches pour un théme
 * (le tri alpha est realisé)
 * @param {*} name
 * @returns
 * @todo prévoir les couches vecteurs tuilées
 */
const getLayersByThematic = (name) => {
  var data = ThematicLayers.find((element) => { return element.name === name; });
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
  var data = ThematicLayers.find((element) => { return element.layers.includes(id); });
  return data.name;
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
    // INFO
    // les couches tuiles vectorielles ne devrait pas être pré chargées car
    // on ne connait pas encore la liste exhaustive des sources contenues
    // dans le fichier de style.
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

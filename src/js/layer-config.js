/**
 * Configuration des couches :
 * - liste des couches thematiques à selectionner
 * - properties techniques des couches à utiliser
 * @description
 * On part de la configuration complète (local) des couches du Portail.
 * On filtre ensuite les informations avec les paramètres de ce fichier.
 * ex. liste de thematiques souhaitée
 */
const layerProps = {
  "photos": {
    layer: "ORTHOIMAGERY.ORTHOPHOTOS",
    style: "normal",
    format: "image/jpeg",
    minNativeZoom: 0,
    maxNativeZoom: 19,
  },
  "plan-ign": {
    layer: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
    style: "normal",
    format: "image/png",
    minNativeZoom: 1,
    maxNativeZoom: 19,
  },
  "topo": {
    layer: "GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR.CV",
    style: "normal",
    format: "image/jpeg",
    minNativeZoom: 6,
    maxNativeZoom: 16,
  },
  "etat-major": {
    layer: "GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40",
    style: "normal",
    format: "image/jpeg",
    minNativeZoom: 6,
    maxNativeZoom: 15,
  },
  "ortho-histo": {
    layer: "ORTHOIMAGERY.ORTHOPHOTOS.1950-1965",
    style: "normal",
    format: "image/png",
    minNativeZoom: 3,
    maxNativeZoom: 18,
  },
  "cadastre": {
  layer: "CADASTRALPARCELS.PARCELLAIRE_EXPRESS",
    style: "PCI%20vecteur",
    format: "image/png",
    minNativeZoom: 0,
    maxNativeZoom: 19,
  },
  "drones": {
    layer: "TRANSPORTS.DRONES.RESTRICTIONS",
    style: "normal",
    format: "image/png",
    minNativeZoom: 3,
    maxNativeZoom: 15,
  },
  "routes": {
    layer: "TRANSPORTNETWORKS.ROADS",
    style: "normal",
    format: "image/png",
    minNativeZoom: 6,
    maxNativeZoom: 18,
  },
}

const baseLayerList = [
  "photos",
  "ortho-histo",
  "etat-major",
  "topo",
  "plan-ign",
];

const dataLayerList = [
  "cadastre",
  "drones",
  "routes",
]

function createWmtsUrlFromId (layerId) {
  return `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
  `&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0` +
  `&STYLE=${layerProps[layerId].style}` +
  `&TILEMATRIXSET=PM` +
  `&FORMAT=${layerProps[layerId].format}`+
  `&LAYER=${layerProps[layerId].layer}`+
  `&TILEMATRIX={z}` +
    `&TILEROW={y}` +
    `&TILECOL={x}`
}

function createRasterSource(layerId) {
  return {
    type: "raster",
    tiles: [createWmtsUrlFromId(layerId)],
    tileSize: 256,
    maxzoom: layerProps[layerId].maxNativeZoom,
    minzoom: layerProps[layerId].minNativeZoom,
  }
}

export default {
  layerProps,
  baseLayerSources: Object.fromEntries(
    baseLayerList.map( layerId => [layerId, createRasterSource(layerId)] )
  ),
  dataLayerSources: Object.fromEntries(
    dataLayerList.map( layerId => [layerId, createRasterSource(layerId)] )
  ),
}

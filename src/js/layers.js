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
    minNativeZoom: 3,
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

// REMOVEME
function createTileLayer(layerId, zIndex=0) {
  return L.tileLayer.fallback(
    createWmtsUrlFromId(layerId),
    {
      minZoom : 0,
      maxZoom : 19,
      minNativeZoom : layerProps[layerId].minNativeZoom,
      maxNativeZoom : layerProps[layerId].maxNativeZoom,
      tileSize : 256, // les tuiles du Géooportail font 256x256px
      zIndex: zIndex,
      useCache: true,
    }
  )
}

export default {
  layerProps,
  baseLayerSources: Object.fromEntries(
    baseLayerList.map( layerId => [layerId, createRasterSource(layerId)] )
  ),
  dataLayerSources: Object.fromEntries(
    dataLayerList.map( layerId => [layerId, createRasterSource(layerId)] )
  ),
  // REMOVEME
  baseLayers: Object.fromEntries(
    baseLayerList.map( layerId => [layerId, createTileLayer(layerId)] )
  ),
  // REMOVEME
  dataLayers: Object.fromEntries(
    dataLayerList.map( layerId => [layerId, createTileLayer(layerId, 1)] )
  ),
}

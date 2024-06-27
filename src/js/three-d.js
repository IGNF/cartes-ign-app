/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";
import maplibregl from "maplibre-gl";

let buildingsLayers = [];

async function _fetch3dBuildingsLayers() {
  const response = await fetch("data/bati-3d.json");
  const data = await response.json();
  buildingsLayers = data.layers;
}

// Function to fetch and parse x-bil tile data
async function _fetchAndParseXBil(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  const width = Math.sqrt(dataView.byteLength / 4); // Assuming square tiles
  const height = width;
  const elevations = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    elevations[i] = dataView.getFloat32(i * 4, true);
  }
  return { elevations, width, height };
}

function add3dTerrain() {
  if (!Globals.map.getSource("bil-terrain")) {
    Globals.map.addSource("bil-terrain", {
      type: "raster-dem",
      tiles: [
        "dem://data.geopf.fr/wms-r/wms?bbox={bbox-epsg-3857}&format=image/x-bil;bits=32&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&styles=normal&layers=ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES"
      ],
      minzoom: 6,
      maxzoom: 14,
      tileSize: 256
    });

    maplibregl.addProtocol("dem", async (params, abortController) => {
      try {
        const { elevations, width, height } = await _fetchAndParseXBil(`https://${params.url.split("://")[1]}`);
        const data = new Uint8ClampedArray(width * height * 4);
        for (let i = 0; i < elevations.length; i++) {
          const elevation = Math.round(elevations[i] * 10) / 10;
          // reverse https://docs.mapbox.com/data/tilesets/reference/mapbox-terrain-dem-v1/#elevation-data
          const baseElevationValue = 10 * (elevation + 10000);
          const red = Math.floor(baseElevationValue / (256 * 256)) % 256;
          const green = Math.floor((baseElevationValue - red * 256 * 256) / 256) % 256;
          const blue = baseElevationValue - red * 256 * 256 - green * 256;
          data[4 * i] = red;
          data[4 * i + 1] = green;
          data[4 * i + 2] = blue;
          data[4 * i + 3] = 255;
        }
        const imageData = new ImageData(data, width, height);
        const imageBitmap = await createImageBitmap(imageData);
        return {
          data: imageBitmap
        };
    } catch (error) {
      throw error;
    }
    });
  }

  // Set terrain using the custom source
  Globals.map.setTerrain({ source: 'bil-terrain', exaggeration: 1.5 });
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
  add3dTerrain,
}

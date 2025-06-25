/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";
import maplibregl from "maplibre-gl";

import PopupUtils from "./utils/popup-utils";

const hillsLayer = {
  id: "hills",
  type: "hillshade",
  source: "bil-terrain",
  layout: {visibility: "visible"},
  paint: {"hillshade-shadow-color": "#473B24"},
  metadata: {group: "PLAN.IGN.INTERACTIF$TMS"},
};

/**
 * Interface sur le contrôle 3d
 * @module ThreeD
 */
class ThreeD {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      // callback
      openSearchControlCbk: null,
      closeSearchControlCbk: null
    };

    this.map = map;

    this.buildingsLayers = [];
    this.terrainOn = false;
    this.buildingsOn = false;

    this.popup = {
      popup: null
    };

    return this;
  }

  async #fetch3dBuildingsLayers() {
    if (!Globals.map.getSource("plan_ign")) {
      Globals.map.addSource("plan_ign", {
        "type": "vector",
        "maxzoom": 18,
        "tiles": [
          "https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf"
        ]
      });
    }
    let data;
    try {
      const response = await fetch("https://ignf.github.io/cartes-ign-app/bati-3d.json");
      data = await response.json();
    } catch (err) {
      const response = await fetch("data/bati-3d.json");
      data = await response.json();
    }

    this.buildingsLayers = data.layers;
  }

  // Function to fetch and parse x-bil tile data
  async #fetchAndParseXBil(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const dataView = new DataView(arrayBuffer);
    const width = Math.sqrt(dataView.byteLength / 4); // Assuming square tiles
    const height = width;
    const elevations = new Float32Array(width * height);
    for (let i = 0; i < width * height; i++) {
      elevations[i] = dataView.getFloat32(i * 4, true);
      if (elevations[i] < -10 || elevations[i] > 4900) {
        elevations[i] = 0;
      }
    }
    return { elevations, width, height };
  }

  add3dTerrain() {
    if (!Globals.map.getSource("bil-terrain")) {
      Globals.map.addSource("bil-terrain", {
        type: "raster-dem",
        tiles: [
          `dem://data.geopf.fr/private/wms-r/wms?apikey=${process.env.GPF_key}&bbox={bbox-epsg-3857}&format=image/x-bil;bits=32&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&styles=normal&layers=ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.LINEAR`
        ],
        minzoom: 6,
        maxzoom: 14,
        tileSize: 256
      });

      maplibregl.addProtocol("dem", async (params) => {
        try {
          const { elevations, width, height } = await this.#fetchAndParseXBil(`https://${params.url.split("://")[1]}`);
          const data = new Uint8ClampedArray(width * height * 4);
          for (let i = 0; i < elevations.length; i++) {
            let elevation = Math.round(elevations[i] * 10) / 10;
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
          console.error(error);
          throw error;
        }
      });
    }

    // Set terrain using the custom source
    Globals.map.setTerrain({ source: "bil-terrain", exaggeration: 1.5 });
    this.addHillShadeToPlanIgn();
    if (!this.buildingsOn) {
      this.showPopup();
    }
    if (Globals.map.getPitch() < 20) {
      Globals.map.flyTo({pitch: 45, zoom: Math.min(Globals.map.getZoom(), 14)});
      if (!this.buildingsOn) {
        Globals.map.once("moveend", () => {
          this.showPopup();
        });
      }
    }
    this.terrainOn = true;
  }

  addHillShadeToPlanIgn() {
    if (Globals.map.getLayer(hillsLayer.id)) {
      return;
    }
    // HACK
    // on positionne toujours le  layer après la dernière couche de PLAN IGN
    var beforeId = "detail_hydrographique$$$PLAN.IGN.INTERACTIF$TMS";
    if (!Globals.map.getLayer(beforeId)) {
      return;
    }
    var layerIndexBefore = Globals.map.getStyle().layers.findIndex((l) => l.id === beforeId) + 1;
    var layerIdBefore = (layerIndexBefore !== -1) ? Globals.map.getStyle().layers[layerIndexBefore].id : null;
    if (layerIdBefore) {
      Globals.map.addLayer(hillsLayer, layerIdBefore);
    }
  }

  async add3dBuildings() {
    if (this.buildingsLayers.length === 0) {
      await this.#fetch3dBuildingsLayers();
    }
    // HACK
    // on positionne toujours le style avant ceux du calcul d'itineraires (directions)
    // afin que le calcul soit toujours la couche visible du dessus !
    var layerIndexBefore = Globals.map.getStyle().layers.findIndex((l) => l.source === "maplibre-gl-directions") + 1;
    var layerIdBefore = (layerIndexBefore !== -1) ? Globals.map.getStyle().layers[layerIndexBefore].id : null;
    this.buildingsLayers.forEach((layer) => {
      Globals.map.addLayer(layer, layerIdBefore);
    });
    if (!this.terrainOn) {
      this.showPopup();
    }
    if (Globals.map.getPitch() < 20) {
      Globals.map.flyTo({pitch: 45});
      if (!this.terrainOn) {
        Globals.map.once("moveend", () => {
          this.showPopup();
        });
      }
    }
    this.buildingsOn = true;
  }

  remove3dBuildings() {
    this.buildingsLayers.forEach((layer) => {
      Globals.map.removeLayer(layer.id);
    });
    this.buildingsOn = false;
    if (!this.terrainOn) {
      Globals.map.flyTo({pitch: 0});
    }
  }

  remove3dTerrain() {
    Globals.map.setTerrain();
    if (Globals.map.getLayer(hillsLayer.id)) {
      Globals.map.removeLayer(hillsLayer.id);
    }
    this.terrainOn = false;
    if (!this.buildingsOn) {
      Globals.map.flyTo({pitch: 0});
    }
  }

  showPopup() {
    if (localStorage.getItem("dontShowThreeDPopupAgain") === "true") {
      return;
    }
    PopupUtils.showPopup(
      `
      <div id="threeDPopup">
          <div class="divPositionTitle">Profitez des vues 3D en toute conscience !</div>
          <div class="divPopupClose" onclick="onClosethreeDPopup(event)"></div>
          <div class="divPopupContent">
          Les vues 3D sont immersives mais elles demandent un peu d’effort à votre téléphone. Sur certains appareils, cela peut faire baisser la batterie plus vite ou rendre l’affichage moins fluide.
          </div>
          <div id="threeDConfirm" class="form-submit">J'ai compris</div>
      </div>
      `,
      this.map,
      "threeDPopup",
      "onClosethreeDPopup",
      this.popup
    );
    document.querySelector("#threeDConfirm").addEventListener("click", () => {
      localStorage.setItem("dontShowThreeDPopupAgain", "true");
      window.onClosethreeDPopup();
    });
  }
}

export default ThreeD;

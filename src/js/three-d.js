/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";

import PopupUtils from "./utils/popup-utils";

const hillsLayer = {
  id: "hills",
  type: "hillshade",
  source: "terrain",
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

  add3dTerrain() {
    if (!Globals.map.getSource("terrain")) {
      Globals.map.addSource("terrain", {
        type: "raster-dem",
        tiles: [
          `https://data.geopf.fr/private/wms-r/wms?apikey=${process.env.GPF_key}&bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.3.0&request=GetMap&crs=EPSG:3857&width=256&height=256&styles=terrainrgb0&layers=ELEVATION.ELEVATIONGRIDCOVERAGE.HIGHRES.LINEAR`
        ],
        minzoom: 6,
        maxzoom: 14,
        tileSize: 256
      });
    }

    // Set terrain using the custom source
    Globals.map.setTerrain({ source: "terrain", exaggeration: 1.5 });
    this.addHillShadeToPlanIgn();
    if (!this.buildingsOn) {
      this.showPopup();
    }
    if (Globals.map.getPitch() < 20) {
      Globals.map.flyTo({pitch: 45, zoom: Math.min(Globals.map.getZoom(), 14)});
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

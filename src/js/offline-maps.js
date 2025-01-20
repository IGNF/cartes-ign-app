/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Network } from "@capacitor/network";
import { openDB } from "idb";

import Globals from "./globals";
import Geocode from "./services/geocode";
import Location from "./services/location";
import gisUtils from "./utils/gis-utils";
import DOM from "./dom";

/**
 * Average size of vector tiles (plan IGN) by zoom level in MB
 */
const averageSizeByZoomLevel = {
  0: .462,
  1: .26,
  2: .2,
  3: .2,
  4: .1,
  5: .08,
  6: .02,
  7: .1,
  8: .04,
  9: .01,
  10: .075,
  11: .023,
  12: .017,
  13: .065,
  14: .05,
  15: .065,
  16: .016,
  17: .007,
  18: .006,
}

/**
 * Contrôle pour le téléchargement et la gestion de cartes hors ligne
 * @description
 */
class OfflineMaps {
  /**
   * constructeur
   * @param {*} map
   * @param {*} options
   * @returns
   */
  constructor(map, options) {
    this.options = options || {
      openSearchControlCbk : null,
      closeSearchControlCbk : null,
      container : null,
    };

    this.map = map;

    this.urlTemplates = {
      "PLAN.IGN": "https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf",
    };

    if (!Capacitor.isNativePlatform()) {
      this.dbPromise = openDB("tile-store", 1, {
        upgrade(db) {
          db.createObjectStore("tiles");
        }
      });
    }

    maplibregl.addProtocol("local", this.#loadTile.bind(this));
    this.map.addSource(
      "offline-plan-ign",
      {
        type: "vector",
        tiles: ["local://PLAN.IGN/{z}/{x}/{y}"],
        maxzoom: 18,
      }
    );

    if (!Globals.online) {
      this.#setOfflineSource();
    }
    const container = this.options.container || document.getElementById("offlineMapsWindow");
    this.dom = {
      selectOnMapScreen: container.querySelector("#offlineMapsWindowSelectOnMap"),
      locationSelectBtn: container.querySelector("#offlineMapsLocationSelect"),
      startDownloadScreen : container.querySelector("#offlineMapsWindowStartDownload"),
      estimatedWeight : container.querySelector("#offlineMapsEstimatedWeight"),
      startDownloadBtn : container.querySelector("#offlineMapsDownload"),
      downloadingScreen : container.querySelector("#offlineMapsWindowDownloading"),
      currentWeight : container.querySelector("#offlineMapsCurrentWeight"),
      DLPercent : container.querySelector("#offlineMapsDLPercent"),
      ETAMin : container.querySelector("#offlineMapsETAMin"),
      ETASec : container.querySelector("#offlineMapsETASec"),
      progress : container.querySelector("#offlineMapsProgress"),
      cancelBtn : container.querySelector("#offlineMapsCancel"),
      nameScreen : container.querySelector("#offlineMapsWindowName"),
      confirmNameBtn : container.querySelector("#offlineMapsSave"),
    };

    // pour stopper la boucle for de téléchargement en cas d'annulation
    this.downloadCanceled = false;
    this.abortController = new AbortController();

    // nombre total de tuiles poids estimé, et poids réel pour la sélection en cours
    this.totalTileNumber = 0;
    this.estimatedSize = 0; // en Mo
    this.totalSize = 0; // en Mo

    // coordonnées des coins de la sélection en cours
    this.minLat = 0;
    this.minLng = 0;
    this.maxLat = 0;
    this.maxLng = 0;
    // niveaux de zoom de la sélection en cours
    this.zoomLevels = [];

    this.currentOfflineMapID = 0;
    this.offlineMapsList = [];
    this.loadOfflineMapMetadata();

    this.currentName = `Carte téléchargée ${this.currentOfflineMapID + 1}`;

    this.#listeners();
    return this;
  }

  /**
   * Opens the interface to download a map
   */
  show() {
    this.dom.selectOnMapScreen.classList.remove("d-none");
  }

  /**
   * Hide the offline maps interface
   */
  hide() {
    this.dom.selectOnMapScreen.classList.add("d-none");
    this.dom.startDownloadScreen.classList.add("d-none");
  }

  /**
   * Listeners...
   */
  #listeners() {
    Network.addListener("networkStatusChange", (status) => {
      let newStatus = status.connected;
      if (newStatus) {
        this.#setOnlineSource();
      } else {
        this.#setOfflineSource();
      }
    });

    this.dom.locationSelectBtn.addEventListener("click", this.#lockView.bind(this));
    this.dom.startDownloadBtn.addEventListener("click", this.#startDownload.bind(this));
    this.dom.cancelBtn.addEventListener("click", this.#cancelDownload.bind(this));
    this.dom.confirmNameBtn.addEventListener("click", this.#confirmDownload.bind(this));
  }

  /**
   * Confirms download and closes the menu
   */
  #confirmDownload() {
    // TODO
    this.dom.nameScreen.classList.add("d-none");
    this.unlockView();
    Globals.menu.close("offlineMaps");
  }

  /**
   * Starts map downloading
   */
  #startDownload() {
    DOM.$backTopLeftBtn.classList.add("d-none");
    DOM.$tabClose.classList.add("d-none");
    Globals.backButtonState = "offlineMapsDownloading";

    this.dom.startDownloadScreen.classList.add("d-none");
    this.dom.downloadingScreen.classList.remove("d-none");

    this.downloadCanceled = false;
    this.#downloadTiles(this.minLng, this.minLat, this.maxLng, this.maxLat, this.zoomLevels, this.totalTileNumber).then( () => {
      if (!this.downloadCanceled) {
        this.#openSuccessWindow();
      }
    });
  }

  /**
   * Cancels current map download
   */
  #cancelDownload() {
    DOM.$backTopLeftBtn.classList.remove("d-none");
    DOM.$tabClose.classList.remove("d-none");
    Globals.backButtonState = "offlineMaps";

    this.dom.downloadingScreen.classList.add("d-none");
    this.unlockView();

    this.downloadCanceled = true;
    this.abortController.abort();
    this.abortController = new AbortController();

    this.deleteOfflineMap(this.currentOfflineMapID);
  }

  /**
   * Locks the map view before downloading
   */
  #lockView() {
    this.dom.selectOnMapScreen.classList.add("d-none");
    this.dom.startDownloadScreen.classList.remove("d-none");
    this.map.getContainer().style.pointerEvents = "none";
    Globals.backButtonState = "offlineMapsLocked";
    this.#getOfflineMapsBbox();
    [this.totalTileNumber, this.estimatedSize] = this.#computeTileNumberAndTotalSize(this.minLng, this.minLat, this.maxLng, this.maxLat, this.zoomLevels);
    this.dom.estimatedWeight.innerText = this.estimatedSize;
  }

  /**
   * Unlocks the map view
   * @see #lockView()
   */
  unlockView() {
    this.dom.selectOnMapScreen.classList.remove("d-none");
    this.dom.startDownloadScreen.classList.add("d-none");
    this.map.getContainer().style.removeProperty("pointer-events");
    Globals.backButtonState = "offlineMaps";
  }

  /**
   * opens success and naming window
   */
  #openSuccessWindow() {
    this.dom.downloadingScreen.classList.add("d-none");
    this.dom.nameScreen.classList.remove("d-none");
    Globals.backButtonState = "offlineMapsName";
  }

  /**
   * Deletes offline map from id
   * @param {Number} offlineMapID
   */
  deleteOfflineMap(offlineMapID) {
    // TODO
  }

  /**
   * loads offline maps metadata from local files
   */
  loadOfflineMapMetadata() {
    // TODO
  }

  /**
   * Get the bbox and zoom levels of the locked view and saves it in the obect state
   */
  #getOfflineMapsBbox() {
    let bottomLeftPoint, topRightPoint;
    if (!window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      bottomLeftPoint = [(this.map.getContainer().offsetWidth / 2) - 100, (this.map.getContainer().offsetHeight / 2) + 100];
      topRightPoint = [(this.map.getContainer().offsetWidth / 2) + 100, (this.map.getContainer().offsetHeight / 2) - 100];
    } else {
      bottomLeftPoint = [(3 * this.map.getContainer().offsetWidth / 4) - 100, (this.map.getContainer().offsetHeight / 2) + 100];
      topRightPoint = [(3 * this.map.getContainer().offsetWidth / 4) + 100, (this.map.getContainer().offsetHeight / 2) - 100];
    }
    const bottomLeftLngLat = this.map.unproject(bottomLeftPoint);
    const topRightLngLat = this.map.unproject(topRightPoint);
    this.minLat = bottomLeftLngLat.lat;
    this.minLng = bottomLeftLngLat.lng;
    this.maxLat = topRightLngLat.lat;
    this.maxLng = topRightLngLat.lng;

    const minZoom = Math.min(18, Math.floor(this.map.getZoom()));
    this.zoomLevels = [minZoom];
    let zoom = minZoom + 1;
    while (zoom <= 16) {
      this.zoomLevels.push(zoom);
      zoom++;
    }
  }

  /**
   *
   * @param {Number} minLng
   * @param {Number} minLat
   * @param {Number} maxLng
   * @param {Number} maxLat
   * @param {Array[Number]} zoomLevels
   * @returns {Array[Number]} total tile number, estimated size in MB
   */
  #computeTileNumberAndTotalSize(minLng, minLat, maxLng, maxLat, zoomLevels) {
    let totalTileNumber = 0;
    let estimatedSize = 0;
    for (const zoom of zoomLevels) {
      const minTile = gisUtils.latlngToTilePixel(minLat, minLng, zoom)[0];
      const maxTile = gisUtils.latlngToTilePixel(maxLat, maxLng, zoom)[0];
      for (let x = minTile.x; x <= maxTile.x; x++) {
        for (let y = maxTile.y; y <= minTile.y; y++) {
          totalTileNumber++;
          estimatedSize += averageSizeByZoomLevel[zoom];
        }
      }
    }
    // estimated size x1.33 to account for base64 encoding (https://en.wikipedia.org/wiki/Base64)
    return [totalTileNumber, Math.round(estimatedSize * 133) / 100];
  }

  /**
   * Sets plan_ign layers to have the offline source
   */
  #setOfflineSource() {
    this.map.getStyle().layers.forEach((layer) => {
      if (layer.source === "plan_ign") {
        this.#setLayerSource(this.map, layer.id, "offline-plan-ign");
      }
    });
  }

  /**
   * Sets plan_ign layers to have the online source
   */
  #setOnlineSource() {
    this.map.getStyle().layers.forEach((layer) => {
      if (layer.source === "offline-plan-ign") {
        this.#setLayerSource(this.map, layer.id, "plan_ign");
      }
    });
  }

  /**
   * Download all pbf tiles inside bounds and for given zoom levels
   * @param {Number} minLng
   * @param {Number} minLat
   * @param {Number} maxLng
   * @param {Number} maxLat
   * @param {Array[Number]} zoomLevels
   * @param {Number} totalTileNumber
   */
  async #downloadTiles(minLng, minLat, maxLng, maxLat, zoomLevels, totalTileNumber) {
    let currentTileNumber = 0;
    const tileList = [];
    const startTime = new Date().getTime();
    for (const layer of Object.keys(this.urlTemplates)) {
      for (const zoom of zoomLevels) {
        const minTile = gisUtils.latlngToTilePixel(minLat, minLng, zoom)[0];
        const maxTile = gisUtils.latlngToTilePixel(maxLat, maxLng, zoom)[0];
        for (let x = minTile.x; x <= maxTile.x; x++) {
          for (let y = maxTile.y; y <= minTile.y && !this.downloadCanceled; y++) {
            currentTileNumber++;
            const url = this.urlTemplates[layer].replace("{z}", zoom).replace("{x}", x).replace("{y}", y);
            const response = await fetch(url, {signal: this.abortController.signal});
            if (response.ok) {
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const data = this.#arrayBufferToBase64(arrayBuffer);
              const tilePath = `${layer}/${zoom}/${x}/${y}`;
              await this.#storeVectorTile(tilePath, data);
              this.totalSize += data.length / 1e6;
              tileList.push(tilePath);
              // DOM update
              this.dom.currentWeight.innerText = Math.round(this.totalSize * 100) / 100;
              this.dom.DLPercent.innerText = Math.round((10000 * currentTileNumber / (totalTileNumber * Object.keys(this.urlTemplates).length)) / 100);
              const currentTime = new Date().getTime();
              const currentSpeed = currentTileNumber / (currentTime - startTime);
              const estimatedRemainingMs = (totalTileNumber / currentSpeed) - (currentTime - startTime);
              const estimatedRemainingMin = Math.floor(estimatedRemainingMs / 60000);
              const estimatedRemainingSec = Math.floor(estimatedRemainingMs / 1000) - estimatedRemainingMin * 60;
              this.dom.ETAMin.innerText = estimatedRemainingMin;
              this.dom.ETASec.innerText = estimatedRemainingSec;
              this.dom.progress.style.width = `${Math.round((10000 * currentTileNumber / (totalTileNumber * Object.keys(this.urlTemplates).length)) / 100)}%`;
            }
          }
        }
      }
    }
  }

  /**
   * Set a map layers source
   * @param {*} map
   * @param {*} layerId
   * @param {*} source
   */
  #setLayerSource (map, layerId, source) {
    const oldLayers = map.getStyle().layers;
    const layerIndex = oldLayers.findIndex(l => l.id === layerId);
    const layerDef = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    layerDef.source = source;
    map.removeLayer(layerId);
    map.addLayer(layerDef, before);
  }

  /**
   * Loads local vector tile (fallbacks to online)
   * @param {*} params
   * @returns
   */
  async #loadTile(params) {
    const url = params.url;
    const [layer, zoom, x, y] = url.replace("local://", "").split("/");
    const onlineTileUrl = this.urlTemplates[layer].replace("{x}", x).replace("{y}", y).replace("{z}", zoom);

    try {
      let tileData;
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.readFile({
          path: `tiles/${layer}/${zoom}/${x}/${y}.pbf`,
          directory: Directory.Data,
          encoding: Filesystem.Encoding.UTF8
        });
        tileData = result.data;
      } else {
        const db = await this.dbPromise;
        tileData = await db.get("tiles", `${layer}/${zoom}/${x}/${y}`);
      }

      if (tileData) {
        return {
          data: this.#base64ToArrayBuffer(tileData),
        };
      } else  {
        const response = await fetch(onlineTileUrl);
        if (!response.ok) {
          if (Globals.online) {
            console.warn(`Failed to fetch tile: ${response.statusText}`);
          }
          return {data: []};
        }
        const arrayBuffer = await response.arrayBuffer();
        return {
          data: arrayBuffer,
        };
      }
    } catch (error) {
      console.error(error);
      return {data: []};
    }
  }

  /**
   * Stores vector tile as a file (mobile) or in indexed DB (web, for testing)
   * @param {Number} zoom
   * @param {Number} x
   * @param {Number} y
   * @param {string} data base64 string representing the data
   */
  async #storeVectorTile(tilePath, data) {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor FileSystem on mobile
      const path = `tiles/${tilePath}.pbf`;
      await Filesystem.writeFile({
        path: path,
        data: data,
        directory: Directory.Data,
        encoding: Filesystem.Encoding.UTF8
      });
    } else {
      // Use IndexedDB in web
      const db = await this.dbPromise;
      await db.put("tiles", data, tilePath);
    }
  }

  /**
   *  Util: converts Array Buffer to base64 string
   * @param {ArrayBuffer} buffer
   * @returns {String}
   */
  #arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   *  Util: converts base64String to arrayBuffer
   * @param {String} base64
   * @returns {ArrayBuffer}
   */
  #base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }


  /**
   * listener issu du dom sur l'interface du menu 'search'
   * @param {*} e
   * @see MenuDisplay.openSearchDownload
   * @see MenuDisplay.closeSearchDownload
   * @see Geocode
   */
  openSearchLocation () {
    // contexte
    var self = this;

    // on ouvre le menu
    if (this.options.openSearchControlCbk) {
      this.options.openSearchControlCbk();
    }

    // les handler sur
    // - le geocodage
    // - la fermeture du menu
    // - le nettoyage des ecouteurs
    function setLocation (e) {
      // on ferme le menu
      if (e.type !== "geolocation" && self.options.closeSearchControlCbk) {
        self.options.closeSearchControlCbk();
      }
      self.currentName = `Carte téléchargée : ${e.detail.text}`;
      // on supprime les écouteurs
      cleanListeners();
    }
    function cleanListeners () {
      Geocode.target.removeEventListener("search", setLocation);
      Location.target.removeEventListener("geolocation", setLocation);
    }

    // abonnement au geocodage
    Geocode.target.addEventListener("search", setLocation);

    // abonnement à la geolocalisation
    Location.target.addEventListener("geolocation", setLocation);

    window.addEventListener("closesearch", cleanListeners);
  }
}

export default OfflineMaps;

/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Network } from "@capacitor/network";
import { openDB } from 'idb';

import Globals from "../globals";
import gisUtils from "../utils/gis-utils";

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
    };

    this.map = map;

    this.urlTemplates = {
      "PLAN.IGN": "https://data.geopf.fr/tms/1.0.0/PLAN.IGN/{z}/{x}/{y}.pbf",
      // "BDTOPO": "https://data.geopf.fr/tms/1.0.0/BDTOPO/{z}/{x}/{y}.pbf",
    };

    this.dbPromise = openDB("tile-store", 1, {
      upgrade(db) {
          db.createObjectStore("tiles");
      }
    });

    maplibregl.addProtocol("local", this.#loadTile.bind(this));
    this.map.addSource(
      "offline-plan-ign",
      {
        type: "vector",
        tiles: ["local://{z}/{x}/{y}"],
        maxzoom: 19,
      }
    );

    if (!Globals.online) {
      this.#setOfflineSource();
    }

    this.#listeners();

    return this;
  }

  /**
   * Opens the interface to download a map
   */
  open() {
    console.log("Downloading map...");
    this.#downloadTiles(-0.63, 48.7, -0.58, 48.75, [16])
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
   */
  async #downloadTiles(minLng, minLat, maxLng, maxLat, zoomLevels) {
    for (const layer of Object.keys(this.urlTemplates)) {
      for (const zoom of zoomLevels) {
        const minTile = gisUtils.latlngToTilePixel(minLat, minLng, zoom)[0];
        const maxTile = gisUtils.latlngToTilePixel(maxLat, maxLng, zoom)[0];
        for (let x = minTile.x; x <= maxTile.x; x++) {
          for (let y = maxTile.y; y <= minTile.y; y++) {
            const url = this.urlTemplates[layer].replace('{z}', zoom).replace('{x}', x).replace('{y}', y);
            const response = await fetch(url);
            if (response.ok) {
              const blob = await response.blob();
              const arrayBuffer = await blob.arrayBuffer();
              const data = this.#arrayBufferToBase64(arrayBuffer);
              await this.#storeVectorTile(zoom, x, y, data);
              console.log(`Downloaded tile ${zoom}/${x}/${y}`);
            }
          }
        }
      }
    }
    console.log('All tiles downloaded');
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
    const [zoom, x, y] = url.replace('local://', '').split('/').map(Number);
    const onlineTileUrl = `https://data.geopf.fr/tms/1.0.0/PLAN.IGN/${zoom}/${x}/${y}.pbf`;

    try {
      let tileData;
      if (Capacitor.isNativePlatform()) {
        const result = await Filesystem.readFile({
          path: `tiles/${zoom}/${x}/${y}.pbf`,
          directory: Directory.Data,
          encoding: Filesystem.Encoding.UTF8
        });
        tileData = result.data;
      } else {
        const db = await this.dbPromise;
        tileData = await db.get('tiles', `${zoom}/${x}/${y}`);
      }

      if (tileData) {
        return {
          data: this.#base64ToArrayBuffer(tileData),
        };
      } else  {
        const response = await fetch(onlineTileUrl)
        if (!response.ok) {
          if (Globals.online) {
            console.error(`Failed to fetch tile: ${response.statusText}`);
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
  async #storeVectorTile(zoom, x, y, data) {
    if (Capacitor.isNativePlatform()) {
      // Use Capacitor FileSystem on mobile
      const path = `tiles/${zoom}/${x}/${y}.pbf`;
      await Filesystem.writeFile({
          path: path,
          data: data,
          directory: Directory.Data,
          encoding: Filesystem.Encoding.UTF8
      });
    } else {
      // Use IndexedDB in web
      const db = await this.dbPromise;
      await db.put('tiles', data, `${zoom}/${x}/${y}`);
    }
  }

  /**
   *  Util: converts Array Buffer to base64 string
   * @param {ArrayBuffer} buffer
   * @returns {String}
   */
  #arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
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

}

export default OfflineMaps;

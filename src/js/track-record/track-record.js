/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

import Globals from "../globals";
import Location from "../services/location";

import TrackRecordLayers from "./track-record-styles";

/**
 * Interface sur le tracé d'itinéraire
 * @module TrackRecord
 */
class TrackRecord {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      container: null,
      configuration: {},
    };
    // configuration
    this.configuration = this.options.configuration || {
      linesource: "track-record-line",
      pointsource: "track-record-point",
    };

    this.map = map;

    const container = this.options.container || document.getElementById("trackRecordWindow");

    this.dom = {
      startRecordBtn : container.querySelector(".startRecord"),
      stopRecordBtn : container.querySelector(".stopRecord"),
    };

    this.recording = false;
    this.onNewLocationCallback = this.#onNewLocation.bind(this);

    this.currentFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {},
    };

    this.currentPoints = {
      type: "FeatureCollection",
      features: [],
    };

    this.positionWatcherId = null;

    this.#addSourcesAndLayers();
    this.#listeners();
    return this;
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    this.dom.startRecordBtn.addEventListener("click", this.#startRecording.bind(this));
    this.dom.stopRecordBtn.addEventListener("click", this.#stopRecording.bind(this));
    App.addListener("appStateChange", (state) => {
      if (!state.isActive) {
        this.#startBgTracking();
      } else {
        this.#stopBgTracking();
      }
    });
  }

  /**
   * Start track recording
   */
  #startRecording() {
    if (this.recording) {
      return;
    }
    this.recording = true;
    if (!Location.isLocationActive()) {
      document.getElementById("geolocateBtn").click();
    }
    this.dom.startRecordBtn.classList.add("d-none");
    this.dom.stopRecordBtn.classList.remove("d-none");
    Location.target.addEventListener("geolocationWatch", this.onNewLocationCallback);

    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.on("moveend", this.onNewLocationCallback);
    }
    // END removeme
  }

  /**
   * Stop track recording
   */
  #stopRecording() {
    if (!this.recording) {
      return;
    }
    this.recording = false;
    this.dom.stopRecordBtn.classList.add("d-none");
    this.dom.startRecordBtn.classList.remove("d-none");
    Location.target.removeEventListener("geolocationWatch", this.onNewLocationCallback);
    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.off("moveend", this.onNewLocationCallback);
    }
    // END removeme
    Globals.myaccount.addTrack(this.currentFeature);
    this.currentFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {},
    };
    this.currentPoints = {
      type: "FeatureCollection",
      features: [],
    };
    this.#updateSources();
  }

  #onNewLocation(e) {
    // REMOVEME: testing
    if (!e.detail) {
      e.detail = {
        longitude: this.map.getCenter().lng,
        latitude:this.map.getCenter().lat,
      };
    }
    // END removeme
    this.currentPoints.features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [e.detail.longitude, e.detail.latitude],
      },
      properties: {
        order: this.currentPoints.length === 0 ? "departure" : "",
      },
    });
    this.currentFeature.geometry.coordinates.push([e.detail.longitude, e.detail.latitude, e.detail.altitude || 0, (new Date()).toISOString()]);
    this.#updateSources();
  }

  /**
   * Starts background location tracking
   */
  async #startBgTracking() {
    if (this.positionWatcherId !== null) {
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    this.positionWatcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Le suivi de position est activé pour l'enregistrement de la trace",
        backgroundTitle: "Cartes IGN : enregistrement de trace GPS",
        requestPermissions: true,
        distanceFilter: 10,
      },
      async (position, error) => {
        if (error) {
          console.error("Geolocation error:", error);
          return;
        }
        this.#onNewLocation({
          detail: position,
        });
      }
    );

  }

  /**
   * Stops background location tracking for notifications
   */
  async #stopBgTracking() {
    if (this.positionWatcherId === null) {
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    await BackgroundGeolocation.removeWatcher({ id: this.positionWatcherId });
    this.positionWatcherId = null;
  }

  /**
   * ajoute la source et le layer à la carte pour affichage du tracé
   */
  #addSourcesAndLayers() {
    this.map.addSource(this.configuration.linesource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [this.currentFeature],
      }
    });

    TrackRecordLayers["line-casing"].source = this.configuration.linesource;
    TrackRecordLayers["line"].source = this.configuration.linesource;
    this.map.addLayer(TrackRecordLayers["line-casing"]);
    this.map.addLayer(TrackRecordLayers["line"]);

    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": this.currentPoints,
    });

    TrackRecordLayers["point-casing"].source = this.configuration.pointsource;
    TrackRecordLayers["point"].source = this.configuration.pointsource;
    TrackRecordLayers["point-departure"].source = this.configuration.pointsource;
    TrackRecordLayers["point-destination"].source = this.configuration.pointsource;
    this.map.addLayer(TrackRecordLayers["point-casing"]);
    this.map.addLayer(TrackRecordLayers["point"]);
    this.map.addLayer(TrackRecordLayers["point-departure"]);
    this.map.addLayer(TrackRecordLayers["point-destination"]);
  }

  /**
   * met à jour les sources de données pour l'affichage
   */
  #updateSources() {
    var linesource = this.map.getSource(this.configuration.linesource);
    linesource.setData({
      type: "FeatureCollection",
      features: [this.currentFeature],
    });

    var pointsource = this.map.getSource(this.configuration.pointsource);
    pointsource.setData(this.currentPoints);
  }

}

export default TrackRecord;

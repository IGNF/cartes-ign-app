/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { Capacitor, registerPlugin } from "@capacitor/core";
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");
import { LocalNotifications } from "@capacitor/local-notifications";

import Globals from "../globals";
import DOM from "../dom";
import domUtils from "../utils/dom-utils";
import utils from "../utils/unit-utils";
import Location from "../services/location";
import RouteDrawDOM from "../route-draw/route-draw-dom";
import ActionSheet from "../action-sheet";

import turfLength from "@turf/length";

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
      whileRecordingBtn : container.querySelector(".whileRecording"),
      pauseRecordBtn : container.querySelector(".pauseRecord"),
      finishRecordBtn : container.querySelector(".finishRecord"),
      closeRecordBtn : container.querySelector(".closeRecord"),
      trackRecordContainer : container.querySelector("#trackRecordContainer"),
    };

    this.recording = false;
    this.activeRecord = false;
    this.onNewLocationCallback = this.#onNewLocation.bind(this);

    this.currentFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {},
      data: {
        elevationData: {
          elevationData: [],
          coordinates: [],
          profileLngLats: [],
          dplus: 0,
          dminus: 0,
          unit: "m",
        },
      },
    };

    this.duration = 0;
    this.startTime = null;

    this.routeToSave = this.currentFeature;
    this.trackName = "Mon itinéraire";
    this.currentPoints = {
      type: "FeatureCollection",
      features: [],
    };

    this.positionWatcherId = null;

    this.bgHasBeenLaunched = false;

    this.#addSourcesAndLayers();
    this.#listeners();
    return this;
  }

  /**
   * Ajout des listeners
   */
  #listeners() {
    this.dom.startRecordBtn.addEventListener("click", this.#startRecording.bind(this));
    this.dom.whileRecordingBtn.addEventListener("click", this.pauseRecording.bind(this));
    this.dom.pauseRecordBtn.addEventListener("click", this.#continueRecording.bind(this));
    this.dom.finishRecordBtn.addEventListener("click", this.#finishRecording.bind(this));
    this.dom.closeRecordBtn.addEventListener("click", this.#closeRecording.bind(this));
  }

  /**
   * Start track recording
   */
  #startRecording() {
    if (this.recording) {
      return;
    }
    if (Capacitor.getPlatform() === "android") {
      this.requestNotificationPermission();
    }
    this.recording = true;
    this.activeRecord = true;
    this.startTime = new Date().getTime();
    if (!Location.isLocationActive()) {
      document.getElementById("geolocateBtn").click();
    }
    this.dom.startRecordBtn.classList.add("d-none");
    this.dom.closeRecordBtn.classList.add("d-none");
    this.dom.whileRecordingBtn.classList.remove("d-none");
    this.dom.finishRecordBtn.classList.remove("d-none");
    const firstLocation = Location.getCurrentPosition();
    if (firstLocation) {
      this.#onNewLocation({
        detail : {
          longitude: firstLocation.coords.longitude,
          latitude: firstLocation.coords.latitude,
          altitude: firstLocation.coords.altitude || 0, // altitude can be null
        }
      });
    }
    this.#startBgTracking();

    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.on("moveend", this.onNewLocationCallback);
    }
    // END removeme
  }

  /**
   * Pause track recording
   */
  pauseRecording() {
    if (!this.recording) {
      return;
    }
    this.recording = false;
    this.map.getSource("track-record-current-line").setData({
      "type": "FeatureCollection",
      "features": []
    });
    this.dom.whileRecordingBtn.classList.add("d-none");
    this.dom.pauseRecordBtn.classList.remove("d-none");
    this.#stopBgTracking();

    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.off("moveend", this.onNewLocationCallback);
    }
    // END removeme
  }

  /**
   * Continue track recording
   */
  #continueRecording() {
    if (this.recording) {
      return;
    }
    this.startTime = new Date().getTime();
    this.recording = true;
    this.dom.whileRecordingBtn.classList.remove("d-none");
    this.dom.pauseRecordBtn.classList.add("d-none");

    this.#startBgTracking();

    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.on("moveend", this.onNewLocationCallback);
    }
  }

  /**
  * Pause track recording
  */
  #backToRecording() {
    this.#continueRecording();
    this.dom.trackRecordContainer.classList.remove("d-none");
    DOM.$tabHeader.classList.add("d-none");
  }


  /**
   * Stop track recording
   */
  #finishRecording() {
    if (!this.activeRecord) {
      return;
    }
    this.pauseRecording();
    if (this.currentPoints.features.length < 2) {
      this.#deleteRecording();
      return;
    }

    this.map.getSource("track-record-current-line").setData({
      "type": "FeatureCollection",
      "features": []
    });

    let bindedBackToRecording = this.#backToRecording.bind(this);
    ActionSheet.addEventListener("closeSheet", bindedBackToRecording);

    ActionSheet.show({
      title: "Vous avez terminé votre enregistrement",
      wrapperCustomClass : "centerHorizontally",
      options: [
        {
          class: "finish-track-subtitle",
          text: "Vous souhaitez",
          value: "subtitle",
        },
        {
          class: "trackRecordBtn saveRecord primary",
          text: "Terminer et enregistrer",
          value: "saveRecord",
        },
        {
          class: "trackRecordBtn backToRecord secondary",
          text: "Reprendre l’enregistrement",
          value: "backToRecord",
        },
        {
          class: "trackRecordBtn deleteRecord terciary",
          text: "Supprimer l’enregistrement",
          value: "deleteRecord",
        }
      ],
      timeToHide: 50,
    }).then( (value) => {
      if (value === "backToRecord") {
        this.#backToRecording();
      }
      if (value === "saveRecord") {
        this.#saveRecordingDOM();
      }
      if (value === "deleteRecord") {
        this.#confirmDeleteRecording();
      }
      ActionSheet.removeEventListener("closeSheet", bindedBackToRecording);
    });
  }

  /**
   * Close track recording menu
   */
  #closeRecording() {
    if (this.recording) {
      this.recording = false;
      this.map.getSource("track-record-current-line").setData({
        "type": "FeatureCollection",
        "features": []
      });
      this.dom.whileRecordingBtn.classList.add("d-none");
      this.dom.pauseRecordBtn.classList.add("d-none");
    }
    this.#stopBgTracking();

    // REMOVEME: testing
    if (!Capacitor.isNativePlatform()) {
      this.map.off("moveend", this.onNewLocationCallback);
    }
    // END removeme
    document.getElementById("backTopLeftBtn").click();

  }

  /**saveRecordingDOM
  * Save track
  */
  async #saveRecordingDOM() {
    const nameTrackDom = domUtils.stringToHTML(`<div id="nameTrack">
      <h3>Enregistrer l'itinéraire</h3>
      <input type="text" id="nameTrack-title" name="nameTrack-title" class="track-input-text" placeholder=" " title="Titre" value="${this.trackName}">
      <div class="trackResume">
        <span>Récap de votre parcours</span>
        <div id="trackResumeRoute">
        </div>
      </div>
      <div id="nameTrackSave" class="form-submit trackRecordBtn primary">Enregistrer</div>
      </div>`);
    const routeSummary = RouteDrawDOM.__addResultsSummaryContainerDOMElement("pedestrian", true);
    nameTrackDom.querySelector("#trackResumeRoute").appendChild(routeSummary);

    var labelDuration = routeSummary.querySelector(".routeDrawSummaryDuration");
    labelDuration.textContent = utils.convertSecondsToTime(Math.round(this.duration / 1000));
    var labelDistance = routeSummary.querySelector(".routeDrawSummaryDistance");
    labelDistance.textContent = utils.convertDistance(turfLength(this.currentFeature, {units: "meters"}));

    var labelDPlus = routeSummary.querySelector(".routeDrawSummaryDPlus");
    this.currentFeature.data.elevationData.dplus = Math.round(100 * this.currentFeature.data.elevationData.dplus) / 100;
    labelDPlus.textContent = `${this.currentFeature.data.elevationData.dplus} m`;

    var labelDMinus = routeSummary.querySelector(".routeDrawSummaryDMinus");
    this.currentFeature.data.elevationData.dminus = Math.round(100 * this.currentFeature.data.elevationData.dminus) / 100;
    labelDMinus.textContent = `- ${this.currentFeature.data.elevationData.dminus} m`;

    // Actionsheet Button Event
    nameTrackDom.querySelector("#nameTrackSave").addEventListener("click", () => {
      this.saveRecording();
      ActionSheet.dispatchEvent(
        new CustomEvent("optionSelect", {
          bubbles: true,
          detail: {
            value: "nameTrackSave"
          }
        })
      );
    });

    let bindedFinishRecording = this.#finishRecording.bind(this);
    ActionSheet.addEventListener("closeSheet", bindedFinishRecording);
    ActionSheet.show({
      style: "custom",
      content: nameTrackDom,
    }).then(() => {
      // After the ActionSheet is closed, we can remove the event listener
      ActionSheet.removeEventListener("closeSheet", bindedFinishRecording);
    });

    nameTrackDom.querySelector("#nameTrack-title").addEventListener("change", (e) => {
      this.trackName = e.target.value;
    });
  }
  /**saveRecording
  * Save track
  */
  saveRecording() {
    if (this.activeRecord) {
      this.currentFeature.data.name = this.trackName;
      this.currentFeature.data.distance = turfLength(this.currentFeature, {units: "meters"});
      this.currentFeature.data.duration = Math.round(this.duration / 1000);
      this.routeToSave = this.currentFeature;
      let id = Globals.myaccount.addTrack(this.routeToSave);
      this.dom.whileRecordingBtn.classList.add("d-none");
      this.dom.finishRecordBtn.classList.add("d-none");
      this.dom.pauseRecordBtn.classList.add("d-none");
      this.dom.startRecordBtn.classList.remove("d-none");
      this.dom.closeRecordBtn.classList.remove("d-none");
      this.recording = false;
      this.activeRecord = false;
      this.currentFeature = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [],
        },
        properties: {},
        data: {
          elevationData: {
            elevationData: [],
            coordinates: [],
            profileLngLats: [],
            dplus: 0,
            dminus: 0,
            unit: "m",
          },
        },
      };
      this.currentPoints = {
        type: "FeatureCollection",
        features: [],
      };
      this.#updateSources();
      this.#closeRecording();
      Globals.myaccount.showRouteDetailsFromID(id);
      ActionSheet.removeEventListener("closeSheet", this.saveRecording.bind(this));
    }
  }

  /**
   * Affiche une action sheet pour confirmer la suppression de l'enregistrement
   */
  #confirmDeleteRecording() {
    let bindedBackToRecording = this.#backToRecording.bind(this);
    ActionSheet.addEventListener("closeSheet", bindedBackToRecording);

    ActionSheet.show({
      title: "Supprimer votre enregistrement ?",
      wrapperCustomClass : "centerHorizontally",
      options: [
        {
          class: "finish-track-subtitle",
          text: "Vos données vont être supprimées. Souhaitez-vous continuer ?",
          value: "subtitle",
        },
        {
          class: "trackRecordBtn saveRecord primary",
          text: "Supprimer",
          value: "confirmDelete",
        },
        {
          class: "trackRecordBtn backToRecord secondary",
          text: "Annuler",
          value: "cancelDelete",
        }
      ],
      timeToHide: 50,
    }).then( (value) => {
      if (value === "confirmDelete") {
        this.#deleteRecording();
      }
      if (value === "cancelDelete") {
        this.#backToRecording();
      }
      ActionSheet.removeEventListener("closeSheet", bindedBackToRecording);
    });
  }

  /**deleteRecording
  * delete track
  */
  #deleteRecording() {
    this.dom.whileRecordingBtn.classList.add("d-none");
    this.dom.finishRecordBtn.classList.add("d-none");
    this.dom.pauseRecordBtn.classList.add("d-none");
    this.dom.startRecordBtn.classList.remove("d-none");
    this.dom.closeRecordBtn.classList.remove("d-none");
    this.activeRecord = false;
    this.currentFeature = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: [],
      },
      properties: {},
      data: {
        elevationData: {
          elevationData: [],
          coordinates: [],
          profileLngLats: [],
          dplus: 0,
          dminus: 0,
          unit: "m",
        },
      },
    };
    this.currentPoints = {
      type: "FeatureCollection",
      features: [],
    };
    this.#updateSources();
    this.#closeRecording();
  }

  #onNewLocation(e) {
    // REMOVEME: testing
    if (!e.detail) {
      e.detail = {
        longitude: this.map.getCenter().lng,
        latitude: this.map.getCenter().lat,
        altitude: Math.round(Math.random() * 1000), // Simulated altitude
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
    this.duration += (new Date()).getTime() - this.startTime;
    this.startTime = new Date().getTime();
    this.currentFeature.geometry.coordinates.push([e.detail.longitude, e.detail.latitude, e.detail.altitude || 0, (new Date()).toISOString()]);
    this.currentFeature.data.elevationData.elevationData.push({x: turfLength(this.currentFeature), y: e.detail.altitude || 0});
    this.currentFeature.data.elevationData.coordinates.push([e.detail.longitude, e.detail.latitude]);
    this.currentFeature.data.elevationData.profileLngLats.push([e.detail.longitude, e.detail.latitude]);
    if (this.currentPoints.features.length > 1) {
      const lastZ = this.currentFeature.data.elevationData.elevationData[this.currentFeature.data.elevationData.elevationData.length - 2].y;
      if (e.detail.altitude !== undefined && e.detail.altitude !== null) {
        if (lastZ < e.detail.altitude) {
          this.currentFeature.data.elevationData.dplus += e.detail.altitude - lastZ;
        } else {
          this.currentFeature.data.elevationData.dminus += lastZ - e.detail.altitude;
        }
      }
    }
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
        distanceFilter: 25,
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

    TrackRecordLayers["line"].source = this.configuration.linesource;
    this.map.addLayer(TrackRecordLayers["line"]);

    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": this.currentPoints,
    });

    TrackRecordLayers["point"].source = this.configuration.pointsource;
    this.map.addLayer(TrackRecordLayers["point"]);

    // Ajout de la source pour le pointillé vers position actuelle
    this.map.addSource("track-record-current-line", {
      "type": "geojson",
      "data": {
        "type": "FeatureCollection",
        "features": []
      },
    });
    TrackRecordLayers["currentLine"].source = "track-record-current-line";
    this.map.addLayer(TrackRecordLayers["currentLine"]);
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

  /**
   * Check and requests if needed the permission to send notifications
  */
  async requestNotificationPermission() {
    this.permissionStatus = await LocalNotifications.checkPermissions();

    if (["denied", "prompt", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
      this.permissionStatus = await LocalNotifications.requestPermissions();
      if (!["denied", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
        console.debug("Notification permission granted");
      } else {
        console.warn("Notification permission not granted");
      }
    }
  }

}

export default TrackRecord;

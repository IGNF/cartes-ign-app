/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");

import Globals from "../globals";
import DOM from "../dom";
import domUtils from "../utils/dom-utils";
import utils from "../utils/unit-utils";
import Location from "../services/location";
import RouteDrawDOM from "../route-draw/route-draw-dom";
import ActionSheet from "../action-sheet";

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
    };

    this.routeToSave = this.currentFeature;
    this.trackName = "Mon itinéraire";
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
    this.dom.whileRecordingBtn.addEventListener("click", this.pauseRecording.bind(this));
    this.dom.pauseRecordBtn.addEventListener("click", this.#continueRecording.bind(this));
    this.dom.finishRecordBtn.addEventListener("click", this.#finishRecording.bind(this));
    this.dom.closeRecordBtn.addEventListener("click", this.#closeRecording.bind(this));
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
    this.activeRecord = true;
    if (!Location.isLocationActive()) {
      document.getElementById("geolocateBtn").click();
    }
    this.dom.startRecordBtn.classList.add("d-none");
    this.dom.closeRecordBtn.classList.add("d-none");
    this.dom.whileRecordingBtn.classList.remove("d-none");
    this.dom.finishRecordBtn.classList.remove("d-none");
    Location.target.addEventListener("geolocationWatch", this.onNewLocationCallback);

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
    this.dom.whileRecordingBtn.classList.add("d-none");
    this.dom.pauseRecordBtn.classList.remove("d-none");
    Location.target.removeEventListener("geolocationWatch", this.onNewLocationCallback);

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
    this.recording = true;
    this.dom.whileRecordingBtn.classList.remove("d-none");
    this.dom.pauseRecordBtn.classList.add("d-none");

    Location.target.addEventListener("geolocationWatch", this.onNewLocationCallback);

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
    if (!this.activeRecord || this.currentPoints.features.length < 1) {
      return;
    }
    this.pauseRecording();
  
    this.recording = false;
  
    this.dom.trackRecordContainer.classList.add("d-none");
    DOM.$tabHeader.classList.remove("d-none");
    Globals.currentScrollIndex = 2;
    Globals.menu.updateScrollAnchors();

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
          class: "trackRecordBtn backToRecord primary",
          text: "Reprendre l’enregistrement",
          value: "backToRecord",
        },
        {
          class: "trackRecordBtn saveRecord secondary",
          text: "Terminer et enregistrer",
          value: "saveRecord",
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
        this.#deleteRecording();
      }
    });
  }

  /**
   * Close track recording menu
   */
  #closeRecording() {
    if (this.recording) {
      this.recording = false;
      this.dom.whileRecordingBtn.classList.add("d-none");
      this.dom.pauseRecordBtn.classList.remove("d-none");
    }
    document.getElementById("backTopLeftBtn").click();
  }

  /**saveRecordingDOM
  * Save track
  */ 
  async #saveRecordingDOM() {
    const nameTrackDom = domUtils.stringToHTML(`<div id="nameTrack">
      <h3>Enregistrer l'itinéraire</h3>
      <div class="dsign-form-element">
        <input type="text" id="nameTrack-title" name="nameTrack-title" class="landmark-input-text" placeholder=" " title="Titre" value="${this.trackName}">
      </div>
      <div class="trackResume">
        Recap de votre parcours
        <div id="trackResumeRoute">
        </div>
      </div>
      <div id="nameTrackSave" class="form-submit trackRecordBtn primary">Enregistrer</div>
      </div>`);
    const routeSummary = RouteDrawDOM.__addResultsSummaryContainerDOMElement("pedestrian");
    routeSummary.querySelector("#routeDrawMode").classList.add("d-none");
    nameTrackDom.querySelector("#trackResumeRoute").appendChild(routeSummary);

    let route = Globals.myaccount.geojsonToRoute(this.currentFeature);
    Globals.routeDraw.setTransport(route.transport);
    Globals.routeDraw.setData(JSON.parse(JSON.stringify(route.data)))
      .then(() => {
        var labelDuration = routeSummary.querySelector(".routeDrawSummaryDuration");
        labelDuration.textContent = utils.convertSecondsToTime(Globals.routeDraw.data.duration);
        var labelDistance = routeSummary.querySelector(".routeDrawSummaryDistance");
        labelDistance.textContent = utils.convertDistance(Globals.routeDraw.data.distance);

        if (!Globals.routeDraw.elevationLoading) {
          var labelDPlus = routeSummary.querySelector(".routeDrawSummaryDPlus");
          labelDPlus.textContent = `${Globals.routeDraw.data.elevationData.dplus} m`;
    
          var labelDMinus = routeSummary.querySelector(".routeDrawSummaryDMinus");
          labelDMinus.textContent = `- ${Globals.routeDraw.data.elevationData.dminus} m`;
        }
      });

    // Actionsheet Button Event
    nameTrackDom.querySelector("#nameTrackSave").addEventListener("click", () => {
      ActionSheet._closeElem.click();
    });
    ActionSheet.show({
      style: "custom",
      content: nameTrackDom,
    });

    nameTrackDom.querySelector("#nameTrack-title").addEventListener("change", (e) => {
      this.trackName = e.target.value;
    });
    ActionSheet.addEventListener("closeSheet", this.saveRecording.bind(this));
  }
  /**saveRecording
  * Save track
  */ 
  saveRecording() {
    if (this.activeRecord) {   
      this.currentFeature.data = {name : this.trackName};
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
        properties: {}
      };
      this.currentPoints = {
        type: "FeatureCollection",
        features: [],
      };
      this.#updateSources();
      this.#closeRecording();
      Globals.routeDraw.clear();
      Globals.myaccount.editRouteFromID(id);
      ActionSheet.removeEventListener("closeSheet", this.saveRecording.bind(this));
    }
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

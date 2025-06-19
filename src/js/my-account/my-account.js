/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "../globals";
import MyAccountDOM from "./my-account-dom";
import MyAccountLayers from "./my-account-styles";
import utils from "../utils/unit-utils";
import gisUtils from "../utils/gis-utils";
import jsUtils from "../utils/js-utils";
import domUtils from "../utils/dom-utils";
import ActionSheet from "../action-sheet";
import Location from "../services/location";
import DOM from "../dom";

import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import maplibregl from "maplibre-gl";
import Sortable from "sortablejs";
import { kml, gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import GeoJsonToGpx from "@dwayneparton/geojson-to-gpx";

import LineSlice from "@turf/line-slice";
import CleanCoords from "@turf/clean-coords";

import LandmarkIconSaved from "../../css/assets/landmark/landmark-saved-map.png";
import LandmarkIconFavourite from "../../css/assets/landmark/landmark-favourite-map.png";
import LandmarkIconTovisit from "../../css/assets/landmark/landmark-tovisit-map.png";
import CompareLandmarkBlue from "../../css/assets/compareLandmark/compare-landmark-blue.png";
import CompareLandmarkPurple from "../../css/assets/compareLandmark/compare-landmark-purple.png";
import CompareLandmarkOrange from "../../css/assets/compareLandmark/compare-landmark-orange.png";
import CompareLandmarkGreen from "../../css/assets/compareLandmark/compare-landmark-green.png";
import CompareLandmarkYellow from "../../css/assets/compareLandmark/compare-landmark-yellow.png";
import { Capacitor } from "@capacitor/core";

/**
 * Interface sur la fenêtre du compte
 * @module MyAccount
 * @todo ajouter les fonctionnalités : cf. DOM
 */
class MyAccount {
  /**
   * constructeur
   * @constructs
   * @param {*} map
   * @param {*} options
   */
  constructor(map, options) {
    this.options = options || {
      target: null,
      configuration: {},
    };

    // configuration
    // TODO client keycloak GPF
    this.configuration = this.options.configuration || {
      linesource: "my-account-line",
      pointsource: "my-account-point",
      landmarksource: "my-account-landmark",
      compareLandmarksource: "my-account-compare-landmark",
    };

    // target
    this.target = this.options.target;

    // carte
    this.map = map;

    // nom d'utilisateur
    this.accountName = null;

    // itinéraires
    this.routes = [];

    // points de repère
    this.landmarks = [];
    this.compareLandmarks = [];

    // cartes téléchargées
    this.offlineMaps = [];

    this.#addSourcesAndLayers();

    // Identifiant unique pour les itinéraires
    this.lastRouteId = 0;
    this.lastLandmarkId = 0;
    this.lastCompareLandmarkId = 0;

    // récupération des itinéraires enregistrés en local
    let promiseRoutes = Preferences.get( { key: "savedRoutes"} ).then( (resp) => {
      if (resp.value) {
        var localRoutes = JSON.parse(resp.value);
        this.routes = this.routes.concat(localRoutes.filter( route => !route.type));
        this.#updateSources();
      }
    });

    // récupération des points de repère enregistrés en local
    let promiseLandmarks = Preferences.get( { key: "savedLandmarks"} ).then( (resp) => {
      if (resp.value) {
        var localLandmarks = JSON.parse(resp.value);
        this.landmarks = this.landmarks.concat(localLandmarks);
        this.#updateSources();
      }
    });

    // récupération des points de repère comparer enregistrés en local
    let promiseCompareLandmarks = Preferences.get( { key: "savedCompareLandmarks"} ).then( (resp) => {
      if (resp.value) {
        var localCompareLandmarks = JSON.parse(resp.value);
        this.compareLandmarks = this.compareLandmarks.concat(localCompareLandmarks);
        this.#updateSources();
      }
    });

    this.map.loadImage(LandmarkIconSaved).then((image) => {
      this.map.addImage("landmark-icon-saved", image.data);
    });
    this.map.loadImage(LandmarkIconFavourite).then((image) => {
      this.map.addImage("landmark-icon-favourite", image.data);
    });
    this.map.loadImage(LandmarkIconTovisit).then((image) => {
      this.map.addImage("landmark-icon-tovisit", image.data);
    });
    this.map.loadImage(CompareLandmarkBlue).then((image) => {
      this.map.addImage("compare-landmark-blue", image.data);
    });
    this.map.loadImage(CompareLandmarkPurple).then((image) => {
      this.map.addImage("compare-landmark-purple", image.data);
    });
    this.map.loadImage(CompareLandmarkOrange).then((image) => {
      this.map.addImage("compare-landmark-orange", image.data);
    });
    this.map.loadImage(CompareLandmarkGreen).then((image) => {
      this.map.addImage("compare-landmark-green", image.data);
    });
    this.map.loadImage(CompareLandmarkYellow).then((image) => {
      this.map.addImage("compare-landmark-yellow", image.data);
    });

    // récupération des infos et rendu graphique
    Promise.all([this.compute(), promiseCompareLandmarks, promiseLandmarks, promiseRoutes, Globals.offlineMaps.loadPromise]).then(() => {
      // Ajout d'identifiant unique aux routes
      this.routes.forEach((route) => {
        route.id = this.lastRouteId;
        this.lastRouteId++;
      });
      // Ajout d'identifiant unique aux landmarks
      this.landmarks.forEach((landmark) => {
        landmark.id = this.lastLandmarkId;
        this.lastLandmarkId++;
      });
      // Ajout d'identifiant unique aux compareLandmarks
      this.compareLandmarks.forEach((compareLandmark) => {
        compareLandmark.id = this.lastCompareLandmarkId;
        this.lastCompareLandmarkId++;
      });
      this.render();
      this.#listeners();
      this.#updateSources();
      Preferences.set({
        key: "savedRoutes",
        value: JSON.stringify(this.routes),
      });
      Preferences.set({
        key: "savedLandmarks",
        value: JSON.stringify(this.landmarks),
      });
      Preferences.set({
        key: "savedCompareLandmarks",
        value: JSON.stringify(this.compareLandmarks),
      });
    });

    this.#importFileIfAppOpenedFromFile();

    return this;
  }

  /**
   * Ajoute les écouteurs d'évènements
   * @private
   */
  #listeners() {
    this.dom.tabsMenuBtn.addEventListener("click", () => {
      const selectOption = (e) => {
        let option = e.detail.value;
        let left = 0;
        if (option === "offline-maps") {
          this.dom.offlineMapTabHeader.click();
          left = 117;
        } else if (option === "landmarks") {
          this.dom.landmarkTabHeader.click();
          left = 300;
        } else if (option === "compare-landmarks") {
          this.dom.compareLandmarkTabHeader.click();
          left = 500;
        } else if (option === "routes") {
          this.dom.routeTabHeader.click();
        }
        this.dom.tabsHeaderWrapper.scrollTo({
          left: left,
          behavior: "smooth",
        });
      };
      ActionSheet.addEventListener("optionSelect", selectOption);
      ActionSheet.show({
        title: "",
        passive: true,
        options: [
          {
            text: "Itinéraires",
            value: "routes",
            class: "actionSheetTabOptionRoutes",
          },
          {
            text: "Cartes téléchargées",
            value: "offline-maps",
            class: "actionSheetTabOptionOfflineMaps",
          },
          {
            text: "Points de repère",
            value: "landmarks",
            class: "actionSheetTabOptionLandmarks",
          },
          {
            text: "Repères Comparer",
            value: "compare-landmarks",
            class: "actionSheetTabOptionCompareLandmarks",
          }
        ]
      }).then(() => {
        ActionSheet.removeEventListener("optionSelect", selectOption);
      });
    });

    this.map.on("click", MyAccountLayers["landmark-casing"].id, (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      const compareLayers = ["my-account-compare-landmark"];
      if (this.map.getLayer("comparepoi")) {
        compareLayers.push("comparepoi");
      }
      if (this.map.queryRenderedFeatures(e.point, {layers: compareLayers}).length > 0) {
        return;
      }
      if (DOM.$fullScreenBtn.querySelector("button").classList.contains("maplibregl-ctrl-shrink")) {
        return;
      }
      const landmarkMap = this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["landmark-casing"].id]})[0];
      const landmark = {
        type: "Feature",
        id: landmarkMap.id,
        geometry: landmarkMap.geometry,
        properties: landmarkMap.properties,
      };
      const title = `<div id="landmarkPositionTitle" class="divLegendContainer landmarkPosition-${landmark.id}">
        <label class="landmarkSummaryIcon landmarkSummaryIcon${landmark.properties.icon}"
        style="background-color:${landmark.properties.color};
          display: inline-block;
          margin-right: 5px;
          transform: translate(0, -2px);"></label>
        ${landmark.properties.title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")}
      </div>`;
      let intervalId = null;
      const deselectLandmarkCallback = () => {
        clearInterval(intervalId);
        landmark.properties.radiusRatio = 0;
        this.__updateAccountLandmarksContainerDOMElement(this.landmarks);
        this.#updateSources();
      };
      Globals.position.compute({
        lngLat: e.lngLat,
        text: title,
        html: `<div class="positionHtmlBefore">${landmark.properties.description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")}</div>`,
        html2: "",
        hideCallback: deselectLandmarkCallback,
        type: "landmark"
      }).then(() => {
        landmark.properties.radiusRatio = 0;
        intervalId = setInterval(() => {
          if (landmark.properties.radiusRatio >= 1) {
            clearInterval(intervalId);
          }
          landmark.properties.radiusRatio += 0.2;
          for (let i = 0; i < this.landmarks.length; i++) {
            if (this.landmarks[i].id == landmark.id) {
              this.landmarks[i] = landmark;
            }
          }
          this.#updateSources();
        }, 20);

        Globals.position.show();
      });
    });
    this.map.on("click", MyAccountLayers["line-casing"].id, (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      if (this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["landmark-casing"].id]}).length > 0) {
        return;
      }
      if (DOM.$fullScreenBtn.querySelector("button").classList.contains("maplibregl-ctrl-shrink")) {
        return;
      }
      const visibleRoutes = this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["line-casing"].id]}).filter((route) => route.properties.visible);
      if (visibleRoutes.length === 0) {
        return;
      }
      const routeId = visibleRoutes[0].properties.id;
      const route = this.routes.filter( route => route.id == routeId)[0];
      if (route.visible) {
        this.showRouteDetails(route);
      }
    });

    App.addListener("appUrlOpen", (data) => {
      this.#importFileFromUrl(data.url);
    });
  }

  /**
   * creation de l'interface
   * @public
   */
  render() {
    var target = this.target || document.getElementById("myaccountWindow");
    if (!target) {
      console.warn();
      return;
    }

    var container = this.getContainer(this.accountName, this.routes, this.landmarks, this.compareLandmarks, Globals.offlineMaps.getOfflineMapsOrderedList());
    if (!container) {
      console.warn();
      return;
    }

    // ajout du container
    target.appendChild(container);
    // dragn'drop !
    Sortable.create(this.dom.routeList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setRoutePosition(evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
    Sortable.create(this.dom.landmarkList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setLandmarkPosition(evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
    Sortable.create(this.dom.compareLandmarkList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setCompareLandmarkPosition(evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
    Sortable.create(this.dom.offlineMapList, {
      handle: ".handle-draggable-layer",
      draggable: ".draggable-layer",
      animation: 200,
      forceFallback: true,
      onEnd : (evt) => {
        this.setOfflineMapPosition(parseInt(evt.item.id.split("_")[2]), evt.oldDraggableIndex, evt.newDraggableIndex);
      }
    });
  }

  /**
   * récupération des informations
   * @public
   */
  async compute() {
    // TODO: patience
    // TODO: connection GPF
  }

  /**
   * importe le fichier si l'application a été ouverte via le clic au fichier et "ouvrir avec"
   */
  async #importFileIfAppOpenedFromFile() {
    const url = await App.getLaunchUrl();
    if (url) {
      this.#importFileFromUrl(url.url);
    }
  }

  /**
   * importe le fichier à partir de l'url
   */
  async #importFileFromUrl(url) {
    if (url.split("://")[0] === "content" || url.split("://")[0] === "file") {
      const fileData = await Filesystem.readFile({
        path: url,
      });
      let filename;
      try {
        filename = url.split("/").splice(-1)[0].split(".").splice(-2)[0];
      } catch (e) {
        filename = "Données importées";
      }
      let fileExtension = url.split(".").splice(-2)[1];
      this.#importData(fileData.data, filename, fileExtension);
    }
  }

  /**
   * Importe un fichier landmark ou route
   */
  async importFile() {
    const result = await FilePicker.pickFiles({
      limit: 0,
      readData: true,
    });
    result.files.forEach( (file) => {
      this.#importData(file.data, file.name.split(".")[0], file.name.split(".")[1]);
    });
  }

  /**
   * Importe la donnée d'un fichier
   * @param {String} data fichier sous forme base64
   */
  #importData(data, defaultName, extension = "json") {
    try {
      let imported;
      // UTF-8 decoding https://stackoverflow.com/a/64752311
      const rawData = decodeURIComponent(atob(data).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(""));
      if (rawData[0] === "<") {
        extension = "gpx";
      }
      if (extension === "gpx") {
        imported = gpx(new DOMParser().parseFromString(rawData));
        if (imported.features.length === 0) {
          imported = kml(new DOMParser().parseFromString(rawData));
        }
      } else if (extension === "kml") {
        imported = kml(new DOMParser().parseFromString(rawData));
      } else {
        imported = JSON.parse(rawData);
      }
      // Mode Landmark
      if (imported.type === "Feature" && imported.geometry.type === "Point") {
        if (!imported.properties) {
          imported.properties = {};
        }
        if (!imported.properties.title) {
          imported.properties.title = defaultName;
        }
        if (!imported.properties.description) {
          imported.properties.description = "";
        }
        if (!imported.properties.color) {
          imported.properties.color = "#3993F3";
        }
        if (!imported.properties.icon) {
          imported.properties.icon = "landmark-icon-saved";
        }
        if (!imported.properties.locationName) {
          imported.properties.locationName = "";
        }
        imported.properties.visible = true;
        imported.properties.radiusRatio = 0;
        imported.id = -1;
        this.addLandmark(imported);
        document.getElementById("myaccount-landmarks-tab").click();
        if (Location.isTrackingActive()) {
          Location.disableTracking();
        }
        this.map.flyTo({center: imported.geometry.coordinates});
        Toast.show({
          duration: "long",
          text: `Point de repère "${imported.properties.title}" ajouté à 'Enregistrés' et à la carte`,
          position: "bottom",
        });
      }
      // Mode Route
      if (imported.type === "FeatureCollection") {
        if (!imported.data) {
          imported.data = {};
        }
        if (!imported.data.name) {
          imported.data.name = imported.features[0].properties.name || defaultName;
        }
        this.addRoute(this.#geojsonToRoute(imported));
        Toast.show({
          duration: "long",
          text: `Itinéraire "${imported.data.name}" ajouté à 'Enregistrés' et à la carte`,
          position: "bottom",
        });
      }
    } catch (e) {
      console.warn(e);
      Toast.show({
        duration: "short",
        text: "Le fichier sélectionné n'est pas compatible",
        position: "bottom",
      });
    }
  }

  /**
   * Lance l'interface de téléchargement de carte hors ligne
   */
  downloadMap() {
    // Place le plan IGN au dessus de la pile des couches
    const planIgnLayerBtn = document.getElementById("PLAN.IGN.INTERACTIF$TMS");
    do {
      planIgnLayerBtn.click();
    } while (!planIgnLayerBtn.classList.contains("selectedLayer"));
    Globals.offlineMaps.openSearchLocation();
  }

  /**
   * Ajout d'un itinéraire tracé à l'espace utilisateur
   * @param {*} drawRouteSaveOptions
   */
  addRoute(drawRouteSaveOptions) {
    if (typeof drawRouteSaveOptions.id !== "undefined" && drawRouteSaveOptions.id >= 0) {
      for (let i = 0; i < this.routes.length; i++) {
        if (this.routes[i].id === drawRouteSaveOptions.id){
          this.routes[i] = drawRouteSaveOptions;
          break;
        }
      }
    } else {
      drawRouteSaveOptions.id = this.lastRouteId;
      this.lastRouteId++;
      this.routes.unshift(drawRouteSaveOptions);
    }
    this.__updateAccountRoutesContainerDOMElement(this.routes);
    this.#updateSources();
    let coordinates = [];
    drawRouteSaveOptions.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.fitBounds(bounds, {
      padding: 100,
    });
    Globals.map.once("resize", () => {
      setTimeout(() => {
        this.map.fitBounds(bounds, {
          padding: 100,
        });
      }, 100);
    });
  }

  /**
   * Ajout d'un point de repère à l'espace utilisateur
   * @param {*} landmarkGeojson
   */
  addLandmark(landmarkGeojson) {
    if (typeof landmarkGeojson.id !== "undefined" && landmarkGeojson.id >= 0) {
      for (let i = 0; i < this.landmarks.length; i++) {
        if (this.landmarks[i].id === landmarkGeojson.id){
          this.landmarks[i] = JSON.parse(JSON.stringify(landmarkGeojson));
          break;
        }
      }
    } else {
      const newlandmark = JSON.parse(JSON.stringify(landmarkGeojson));
      newlandmark.id = this.lastLandmarkId;
      this.lastLandmarkId++;
      this.landmarks.unshift(newlandmark);
    }
    this.__updateAccountLandmarksContainerDOMElement(this.landmarks);
    this.#updateSources();
  }

  /**
   * Ajout d'un point de repère Comparer à l'espace utilisateur
   * @param {*} compareLandmarkGeojson
   */
  addCompareLandmark(compareLandmarkGeojson) {
    if (typeof compareLandmarkGeojson.id !== "undefined" && compareLandmarkGeojson.id >= 0) {
      for (let i = 0; i < this.compareLandmarks.length; i++) {
        if (this.compareLandmarks[i].id === compareLandmarkGeojson.id){
          this.compareLandmarks[i] = JSON.parse(JSON.stringify(compareLandmarkGeojson));
          break;
        }
      }
    } else {
      const newlandmark = JSON.parse(JSON.stringify(compareLandmarkGeojson));
      newlandmark.id = this.lastCompareLandmarkId;
      this.lastCompareLandmarkId++;
      this.compareLandmarks.unshift(newlandmark);
    }
    this.__updateAccountCompareLandmarksContainerDOMElement(this.compareLandmarks);
    this.#updateSources();
  }

  /**
   * Met à jour l'affichage des cartes en ligne
   */
  updateOfflineMaps() {
    this.__updateAccountOfflineMapsContainerDOMElement(Globals.offlineMaps.getOfflineMapsOrderedList());
  }

  /**
   * Supprime un itinéraire de l'epace utilisateur
   */
  deleteRoute(routeId) {
    for (let i = 0; i < this.routes.length; i++) {
      let route = this.routes[i];
      if (route.id !== routeId) {
        continue;
      }
      this.routes.splice(i, 1);
      this.__updateAccountRoutesContainerDOMElement(this.routes);
      Preferences.set({
        key: "savedRoutes",
        value: JSON.stringify(this.routes),
      });
      this.#updateSources();
      break;
    }
  }

  /**
   * Supprime un point de repère de l'epace utilisateur
   */
  deleteLandmark(landmarkId) {
    for (let i = 0; i < this.landmarks.length; i++) {
      let landmark = this.landmarks[i];
      if (landmark.id !== landmarkId) {
        continue;
      }
      this.landmarks.splice(i, 1);
      this.__updateAccountLandmarksContainerDOMElement(this.landmarks);
      Preferences.set({
        key: "savedLandmarks",
        value: JSON.stringify(this.landmarks),
      });
      this.#updateSources();
      break;
    }
  }

  /**
   * Supprime un point de repère Comparer de l'epace utilisateur
   */
  deleteCompareLandmark(compareLandmarkId) {
    for (let i = 0; i < this.compareLandmarks.length; i++) {
      let compareLandmark = this.compareLandmarks[i];
      if (compareLandmark.id !== compareLandmarkId) {
        continue;
      }
      this.compareLandmarks.splice(i, 1);
      this.__updateAccountCompareLandmarksContainerDOMElement(this.compareLandmarks);
      Preferences.set({
        key: "savedCompareLandmarks",
        value: JSON.stringify(this.compareLandmarks),
      });
      this.#updateSources();
      break;
    }
  }

  /**
   * Supprime une carte téléchargée de l'epace utilisateur
   */
  deleteOfflineMap(offlineMapId) {
    Globals.offlineMaps.deleteOfflineMap(offlineMapId);
  }

  /**
   * Change l'ordre des routes dans l'objet
   * @param {*} oldIndex
   * @param {*} newIndex
   */
  setRoutePosition(oldIndex, newIndex) {
    const route = this.routes[oldIndex];
    this.routes.splice(oldIndex, 1);
    this.routes.splice(newIndex, 0, route);
    this.#updateSources();
  }

  /**
   * Change l'ordre des points de repère dans l'objet
   * @param {*} oldIndex
   * @param {*} newIndex
   */
  setLandmarkPosition(oldIndex, newIndex) {
    const landmark = this.landmarks[oldIndex];
    this.landmarks.splice(oldIndex, 1);
    this.landmarks.splice(newIndex, 0, landmark);
    this.#updateSources();
  }

  /**
   * Change l'ordre des points de repère Comparer dans l'objet
   * @param {*} oldIndex
   * @param {*} newIndex
   */
  setCompareLandmarkPosition(oldIndex, newIndex) {
    const compareLandmark = this.compareLandmarks[oldIndex];
    this.compareLandmarks.splice(oldIndex, 1);
    this.compareLandmarks.splice(newIndex, 0, compareLandmark);
    this.#updateSources();
  }

  /**
   * Change l'ordre des cartes hors ligne
   * @param {*} offlineMapId
   * @param {*} newIndex
   */
  setOfflineMapPosition(offlineMapId, oldIndex, newIndex) {
    Globals.offlineMaps.changeMapIndex(offlineMapId, oldIndex, newIndex);
  }

  /**
   * Ouvre l'outil de tracé d'itinéraire pour modifier un itinéraire
   * @param {*} route
   */
  editRoute(route) {
    if (!Globals.online) {
      Toast.show({
        text: "Fonctionnalité indisponible en mode hors ligne.",
        duration: "long",
        position: "bottom"
      });
      return;
    }
    if (route.visible) {
      route.visible = false;
      this.#updateSources();
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.fitBounds(bounds, {
      padding: 100,
    });
    this.hide();
    Globals.routeDraw.show();
    Globals.routeDraw.setTransport(route.transport);
    Globals.routeDraw.setData(JSON.parse(JSON.stringify(route.data)));
    Globals.routeDraw.setName(route.name);
    Globals.routeDraw.setId(route.id);
  }

  /**
   * Ouvre l'outil de tracé d'itinéraire pour modifier un itinéraire à partir de son ID
   * @param {Number} routeId
   */
  editRouteFromID(routeId) {
    try {
      this.editRoute(this.#getRouteFromID(routeId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Ouvre l'interface de téléchargement autour de l'itinéraire
   * @param {*} route
   */
  downloadRoute(route) {
    if (!Globals.online) {
      Toast.show({
        text: "Fonctionnalité indisponible en mode hors ligne.",
        duration: "long",
        position: "bottom"
      });
      return;
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

    const mapPadding = {};
    if (!window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      mapPadding.bottom = this.map.getContainer().offsetHeight / 2 - 85;
      mapPadding.top = this.map.getContainer().offsetHeight / 2 - 85;
      mapPadding.left = this.map.getContainer().offsetWidth / 2 - 85;
      mapPadding.right = this.map.getContainer().offsetWidth / 2 - 85;
    } else {
      mapPadding.bottom = (3 * this.map.getContainer().offsetWidth / 4) - 85;
      mapPadding.top = (3 * this.map.getContainer().offsetWidth / 4) - 85;
      mapPadding.left = (this.map.getContainer().offsetHeight / 2) - 85;
      mapPadding.right = (this.map.getContainer().offsetHeight / 2) - 85;
    }
    this.map.fitBounds(bounds, {
      padding: mapPadding,
    });
    this.map.once("moveend", () => { this.map.setPadding({top: 0, right: 0, bottom: 0, left: 0}); });
    this.hide();
    Globals.menu.open("offlineMaps");
    Globals.offlineMaps.currentName = route.name;
  }

  /**
  * Partage l'itinéraire sous forme de fichier à partir de son ID
  * @param {Number} routeId
  */
  downloadRouteFromID(routeId) {
    try {
      this.downloadRoute(this.#getRouteFromID(routeId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Ouvre l'outil de tracé d'itinéraire en mode consultation pour afficher les caractéristiques techniques
   * @param {*} route
   */
  showRouteDetails(route) {
    if (!route.visible) {
      route.visible = true;
      this.#updateSources();
      document.getElementById(`route-container_ID_${route.id}`).classList.remove("invisible");
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.fitBounds(bounds, {
      padding: 100,
    });
    this.hide();
    Globals.routeDraw.setTransport(route.transport);
    Globals.routeDraw.setData(JSON.parse(JSON.stringify(route.data)));
    Globals.routeDraw.setName(route.name);
    Globals.routeDraw.setId(route.id);
    Globals.routeDraw.showDetails();
  }

  /**
   * Ouvre le suivi d'itinéraire
   * @param {*} route
   */
  followRoute(route) {
    let steps = JSON.parse(JSON.stringify(route.data.steps));
    const coords = [];
    steps.forEach( (step) => {
      coords.push(step.geometry.coordinates);
    });
    const dissolvedCoords = gisUtils.geoJsonMultiLineStringCoordsToSingleLineStringCoords(coords);

    const routeLine = {
      type: "Feature",
      geometry: {
        type: "LineString",
        coordinates: dissolvedCoords,
      },
      properties: {
        distance: route.data.distance,
        duration: route.data.duration,
      },
    };
    Globals.routeFollow.setData({
      routeLine: routeLine,
      elevations: route.data.elevationData.elevationData,
    });
    this.hide();
    Globals.routeFollow.show();
  }

  /**
   * Ouvre le suivi d'itinéraire à partir de son ID
   * @param {Number} routeId
   */
  followRouteFromID(routeId) {
    try {
      this.followRoute(this.#getRouteFromID(routeId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Ouvre l'outil de création de point de repère pour le modifer
   * @param {*} landmark
   */
  editLandmark(landmark) {
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.flyTo({center: landmark.geometry.coordinates});
    this.hide();
    Globals.landmark.show();
    Globals.landmark.setData({
      title: landmark.properties.title,
      description: landmark.properties.description,
      location: landmark.geometry.coordinates,
      locationName: landmark.properties.locationName,
      color: landmark.properties.color,
      icon: landmark.properties.icon,
    });
    Globals.landmark.setId(landmark.id);
  }

  /**
   * Ouvre l'outil de création de point de repère pour le modifer
   * @param {*} compareLandmark
   */
  editCompareLandmark(compareLandmark) {
    if (Location.isTrackingActive()) {
      Location.disableTracking();
    }
    this.map.flyTo({center: compareLandmark.geometry.coordinates, zoom: compareLandmark.properties.zoom});
    this.hide();
    Globals.menu.open("compare");
    DOM.$tabContainer.classList.remove("compare");
    DOM.$bottomButtons.classList.remove("compare");
    Globals.currentScrollIndex = 2;
    Globals.menu.updateScrollAnchors();
    Globals.compare.setParams({
      // Zoom - 1 car décalage entre niveaux de zoom maplibre et autres libs carto
      zoom: compareLandmark.properties.zoom - 1,
      mode: compareLandmark.properties.mode,
      layer1: compareLandmark.properties.layer1,
      layer2: compareLandmark.properties.layer2,
      center: compareLandmark.geometry.coordinates,
    });
    Globals.compareLandmark.show();
    Globals.compareLandmark.setData({
      title: compareLandmark.properties.accroche,
      description: compareLandmark.properties.text,
      location: compareLandmark.geometry.coordinates,
      zoom: compareLandmark.properties.zoom,
      color: compareLandmark.properties.color,
      icon: compareLandmark.properties.icon,
      layer1: compareLandmark.properties.layer1,
      layer2: compareLandmark.properties.layer2,
      mode: compareLandmark.properties.mode,
    });
    Globals.compareLandmark.setId(compareLandmark.id);
  }

  /**
   * Ouvre la fenêtre de renommage de carte hors ligne
   * @param {*} offlineMap
   */
  renameOfflineMap(offlineMap) {
    const renameOfflineMapDom = domUtils.stringToHTML(`<div id="offlineMapsRenameDiv">
    <h3>Renommer la carte</h3>
    <div class="dsign-form-element">
      <input type="text" id="offlineMapsRename-title" name="offlineMapsRename-title" class="landmark-input-text" placeholder=" " title="Titre" value="${offlineMap.name}">
      <label class="dsign-form-label">Titre</label>
    </div>
    <div id="offlineMapsRenameSave" class="form-submit">Enregistrer</div>
    </div>`);

    renameOfflineMapDom.querySelector("#offlineMapsRenameSave").addEventListener("click", () => {
      if (renameOfflineMapDom.querySelector("#offlineMapsRename-title").value) {
        Globals.offlineMaps.changeOfflineMapName(offlineMap.id, renameOfflineMapDom.querySelector("#offlineMapsRename-title").value);
        Toast.show({
          text: "Votre carte a été rennomée",
          duration: "long",
          position: "bottom"
        });
      }
      ActionSheet._closeElem.click();
    });
    ActionSheet.show({
      style: "custom",
      content: renameOfflineMapDom,
    });
  }

  /**
   * Ouvre l'outil de création de point de repère pour le modifer à partir de son ID
   * @param {Number} landmarkId
   */
  editLandmarkFromID(landmarkId) {
    try {
      this.editLandmark(this.#getLandmarkFromID(landmarkId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "Le point de repère n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Partage le point de repère Comparer à partir de son ID
   * @param {Number} compareLandmarkId
   */
  editCompareLandmarkFromID(compareLandmarkId) {
    try {
      this.editCompareLandmark(this.#getCompareLandmarkFromID(compareLandmarkId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "Le point de repère Comparer n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Partage l'itinéraire sous forme de fichier
   * @param {*} route
   */
  async shareRoute(route) {
    const value = await ActionSheet.show({
      style: "buttons",
      title: "Choisissez votre format de partage",
      options: [
        {
          text: "JSON",
          value: "json",
          class: ""
        },
        {
          text: "GPX",
          value: "gpx",
          class: ""
        }
      ]
    });
    try {
      let result;
      if (value === "json") {
        result = await Filesystem.writeFile({
          path: `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.json`,
          data: JSON.stringify(this.#routeToGeojson(route)),
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
      } else if (value === "gpx") {
        const gpx = GeoJsonToGpx(this.#routeToGeojson(route, "gpx"), {
          metadata: {
            name: route.name,
          }
        });
        const gpxString = new XMLSerializer().serializeToString(gpx);
        result = await Filesystem.writeFile({
          path: `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.gpx`,
          data: gpxString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
      } else {
        Toast.show({
          text: "Annulation du partage",
          duration: "short",
          position: "bottom"
        });
        return;
      }
      Share.share({
        title: `${route.name}`,
        text: `${route.name}
Temps : ${utils.convertSecondsToTime(route.data.duration)}, Distance : ${utils.convertDistance(route.data.distance)}
Dénivelé positif : ${route.data.elevationData.dplus} m, Dénivelé négatif : ${route.data.elevationData.dminus} m`,
        dialogTitle: "Partager mon itinéraire",
        url: result.uri,
      });
    } catch (err) {
      Toast.show({
        text: "L'itinéraire n'a pas pu être partagé. Partage du résumé...",
        duration: "long",
        position: "bottom"
      });
      Share.share({
        title: `${route.name}`,
        text: `${route.name}
Temps : ${utils.convertSecondsToTime(route.data.duration)}, Distance : ${utils.convertDistance(route.data.distance)}
Dénivelé positif : ${route.data.elevationData.dplus} m, Dénivelé négatif : ${route.data.elevationData.dminus} m`,
        dialogTitle: "Partager mon itinéraire (résumé)",
      });
    }
  }

  /**
  * Partage l'itinéraire sous forme de fichier à partir de son ID
  * @param {Number} routeId
  */
  shareRouteFromID(routeId) {
    try {
      this.shareRoute(this.#getRouteFromID(routeId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Partage le point de repère
   * @param {*} landmark
   */
  shareLandmark(landmark) {
    Share.share({
      title: `${landmark.properties.title}`,
      text: `${landmark.properties.title}
${landmark.properties.locationName}
Latitude : ${Math.round(landmark.geometry.coordinates[1] * 1e6) / 1e6}
Longitude : ${Math.round(landmark.geometry.coordinates[0] * 1e6) / 1e6}
${landmark.properties.description}
https://cartes-ign.ign.fr?lng=${landmark.geometry.coordinates[0]}&lat=${landmark.geometry.coordinates[1]}&z=15&titre=${encodeURI(landmark.properties.title)}&description=${encodeURI(landmark.properties.description)}`,
      dialogTitle: "Partager mon point de repère",
    });
  }

  /**
   * Partage le point de repère à partir de son ID
   * @param {Number} landmarkId
   */
  shareLandmarkFromID(landmarkId) {
    try {
      this.shareLandmark(this.#getLandmarkFromID(landmarkId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "Le point de repère n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Partage le point de repère Comparer
   * @param {*} compareLandmark
   */
  shareCompareLandmark(compareLandmark) {
    let props = compareLandmark.properties;
    let url = encodeURI(`https://cartes-ign.ign.fr?lng=${compareLandmark.geometry.coordinates[0]}&lat=${compareLandmark.geometry.coordinates[1]}&z=${props.zoom}&l1=${props.layer1}&l2=${props.layer2}&m=${props.mode}&title=${props.accroche}&text=${props.text}&color=${props.color}`).replace(/ /g, "%20");
    Share.share({
      title: `${props.accroche}`,
      text: `${props.accroche}
${props.text}`,
      url: url,
      dialogTitle: "Partager mon point de repère Comparer",
    });
  }

  /**
   * Partage le point de repère Comparer à partir de son ID
   * @param {Number} compareLandmarkId
   */
  shareCompareLandmarkFromID(compareLandmarkId) {
    try {
      this.shareCompareLandmark(this.#getCompareLandmarkFromID(compareLandmarkId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "Le point de repère Comparer n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Exporte l'itinéraire sous forme d'un fichier
   * @param {*} route
   */
  async exportRoute(route) {
    let documentsName = "Documents";
    if (Capacitor.getPlatform() === "ios") {
      documentsName = "Fichiers";
    }
    const value = await ActionSheet.show({
      style: "buttons",
      title: "Choisissez votre format d'export",
      options: [
        {
          text: "JSON",
          value: "json",
          class: ""
        },
        {
          text: "GPX",
          value: "gpx",
          class: ""
        }
      ]
    });
    try {
      let formatName;
      const existingFileNames = (await Filesystem.readdir({
        path: "",
        directory: Directory.Documents,
      })).files.map(file => file.name);
      if (value === "json") {
        formatName = "JSON";
        let fileName = `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.geojson`;
        let number = 0;
        while (existingFileNames.includes(fileName)) {
          number++;
          fileName = `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}_${number}.geojson`;
        }
        await Filesystem.writeFile({
          path: fileName,
          data: JSON.stringify(this.#routeToGeojson(route)),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
        // For testing purposes
        if (!Capacitor.isNativePlatform()) {
          jsUtils.download(`${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.geojson`, JSON.stringify(this.#routeToGeojson(route)));
        }
      } else if (value === "gpx") {
        formatName = "GPX";
        const gpx = GeoJsonToGpx(this.#routeToGeojson(route, "gpx"), {
          metadata: {
            name: route.name,
          }
        });
        const gpxString = new XMLSerializer().serializeToString(gpx);
        let fileName = `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.gpx`;
        let number = 0;
        while (existingFileNames.includes(fileName)) {
          number++;
          fileName = `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}_${number}.gpx`;
        }
        await Filesystem.writeFile({
          path: fileName,
          data: gpxString,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } else {
        Toast.show({
          text: "Annulation de l'export",
          duration: "short",
          position: "bottom"
        });
        return;
      }
      Toast.show({
        text: `Fichier enregistré dans ${documentsName} au format ${formatName}.`,
        duration: "long",
        position: "bottom"
      });
    } catch (err) {
      console.error(err);
      Toast.show({
        text: "L'itinéraire n'a pas pu être savegardé. Partage...",
        duration: "long",
        position: "bottom"
      });
      this.shareRoute(route);
    }
  }

  /**
  * Exporte l'itinéraire sous forme d'un fichier à partir de son ID
  * @param {Number} routeId
  */
  exportRouteFromID(routeId) {
    try {
      this.exportRoute(this.#getRouteFromID(routeId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Exporte le point de repère sous forme d'un ficheir geojson
   * @param {*} route
   */
  async exportLandmark(landmark) {
    let documentsName = "Documents";
    if (Capacitor.getPlatform() === "ios") {
      documentsName = "Fichiers";
    }
    // For testing purposes
    if (!Capacitor.isNativePlatform()) {
      jsUtils.download(`${landmark.properties.title.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.geojson`, JSON.stringify({
        type: "Feature",
        geometry: landmark.geometry,
        properties: landmark.properties,
      }));
    }
    const existingFileNames = (await Filesystem.readdir({
      path: "",
      directory: Directory.Documents,
    })).files.map(file => file.name);
    try  {
      let fileName = `${landmark.properties.title.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.geojson`;
      let number = 0;
      while (existingFileNames.includes(fileName)) {
        number++;
        fileName = `${landmark.properties.title.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}_${number}.geojson`;
      }
      await Filesystem.writeFile({
        path: fileName,
        data: JSON.stringify({
          type: "Feature",
          geometry: landmark.geometry,
          properties: landmark.properties,
        }),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      Toast.show({
        text: `Fichier enregistré dans ${documentsName}.`,
        duration: "long",
        position: "bottom"
      });
    } catch {
      Toast.show({
        text: "Le point de repère n'a pas pu être savegardé.",
        duration: "long",
        position: "bottom"
      });
    }
  }

  /**
   * Exporte le point de repère à partir de son ID
   * @param {Number} landmarkId
   */
  exportLandmarkFromID(landmarkId) {
    try {
      this.exportLandmark(this.#getLandmarkFromID(landmarkId));
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "Le point de repère n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }
  }

  /**
   * Affiche l'itinéraire s'il est caché, ou le cache s'il est affiché
   * @param {*} route
   */
  toggleShowRoute(route) {
    if (route.visible) {
      route.visible = false;
    } else {
      route.visible = true;
      this.hide();
      let coordinates = [];
      route.data.steps.forEach((step) => {
        coordinates = coordinates.concat(step.geometry.coordinates);
      });
      const bounds = coordinates.reduce((bounds, coord) => {
        return bounds.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
      if (Location.isTrackingActive()) {
        Location.disableTracking();
      }
      this.map.fitBounds(bounds, {
        padding: 100,
      });
    }
    this.#updateSources();
  }

  /**
  * Affiche l'itinéraire s'il est caché à partir de son ID
  * @param {Number} routeId
  */
  showRouteFromID(routeId) {
    try {
      const route = this.#getRouteFromID(routeId);
      if (!route.visible) {
        this.toggleShowRoute(route);
      }
    } catch (e) {
      console.warn(e);
      Toast.show({
        text: "L'itinéraire n'a pas pu être ouvert.",
        duration: "short",
        position: "bottom"
      });
    }

  }

  /**
   * Affiche le point de repère s'il est caché, ou le cache s'il est affiché
   * @param {*} landmark
   */
  toggleShowLandmark(landmark) {
    if (landmark.properties.visible) {
      landmark.properties.visible = false;
    } else {
      landmark.properties.visible = true;
      this.hide();
      if (Location.isTrackingActive()) {
        Location.disableTracking();
      }
      this.map.flyTo({center: landmark.geometry.coordinates, zoom: 14});
    }
    this.#updateSources();
  }

  /**
   * Récupère un itinéraire via son ID
   * @param {Number} routeId
   * @returns route
   */
  #getRouteFromID(routeId) {
    if (routeId === null) {
      throw new Error("Null route ID");
    }
    let route;
    for (let i = 0; i < Globals.myaccount.routes.length; i++) {
      route = Globals.myaccount.routes[i];
      if (route.id === routeId) {
        break;
      }
    }
    if (route.id === routeId) {
      return route;
    } else {
      throw new Error("Unknown route ID");
    }
  }

  /**
   * Récupère un PR via son ID
   * @param {Number} landmarkId
   * @returns landmark
   */
  #getLandmarkFromID(landmarkId) {
    if (landmarkId === null) {
      throw new Error("Null landmark ID");
    }
    let landmark;
    for (let i = 0; i < Globals.myaccount.landmarks.length; i++) {
      landmark = Globals.myaccount.landmarks[i];
      if (landmark.id === landmarkId) {
        break;
      }
    }
    if (landmark.id === landmarkId) {
      return landmark;
    } else {
      throw new Error("Unknown landmark ID");
    }
  }

  /**
   * Récupère un PR RLT via son ID
   * @param {Number} compareLandmarkId
   * @returns compare landmark
   */
  #getCompareLandmarkFromID(compareLandmarkId) {
    if (compareLandmarkId === null) {
      throw new Error("Null compareLandmark ID");
    }
    let compareLandmark;
    for (let i = 0; i < Globals.myaccount.compareLandmarks.length; i++) {
      compareLandmark = Globals.myaccount.compareLandmarks[i];
      if (compareLandmark.id === compareLandmarkId) {
        break;
      }
    }
    if (compareLandmark.id === compareLandmarkId) {
      return compareLandmark;
    } else {
      throw new Error("Unknown compareLandmark ID");
    }
  }

  /**
   * Convertit une route telle qu'enregistrée dans le compte en geojson valide
   * @param {*} route
   * @returns
   */
  #routeToGeojson(route, linesStyle="default") {
    let steps = JSON.parse(JSON.stringify(route.data.steps));
    if (linesStyle === "gpx") {
      const coords = [];
      steps.forEach( (step) => {
        coords.push(step.geometry.coordinates);
      });
      const dissolvedCoords = gisUtils.geoJsonMultiLineStringCoordsToSingleLineStringCoords(coords);

      steps = [{
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: dissolvedCoords,
        },
        properties: {},
      }];
    }
    return {
      type: "FeatureCollection",
      features: route.data.points.concat(steps),
      data: {
        name: route.name,
        transport: route.transport,
        distance: route.data.distance,
        duration: route.data.duration,
        elevationData: route.data.elevationData,
      },
    };
  }

  /**
   * Convertit une route au format geojson en route telle qu'enregistrée dans le compte
   * @param {*} route
   * @returns
   */
  #geojsonToRoute(routeJson) {
    routeJson.features.forEach(feature => {
      if (feature.geometry.type === "MultiLineString") {
        feature.geometry.coordinates.forEach(linestringCoords => {
          const newFeature = {
            type: "Feature",
            properties: feature.properties,
            geometry: {
              type: "LineString",
              coordinates: linestringCoords
            }
          };
          routeJson.features.push(newFeature);
        });
      }
    });
    routeJson.features = routeJson.features.filter(feature => ["LineString", "Point"].includes(feature.geometry.type));
    let steps = routeJson.features.filter(feature => feature.geometry.type === "LineString");
    const points = routeJson.features.filter(feature => feature.geometry.type === "Point");
    let stepId, pointId = -1;
    steps.forEach((step) => {
      step.properties.id = stepId;
      stepId--;
      step.properties.mode = 1;
    });
    for(let i = 0; i < points.length; i++) {
      const point = points[i];
      point.properties.id = pointId;
      point.properties.order = i === 0 ? "departure" : i === points.length - 1 ? "destination" : "";
      pointId--;
    }
    const lastLinePoint = steps[steps.length - 1].geometry.coordinates[steps[steps.length - 1].geometry.coordinates.length - 1];
    let lastPoint = lastLinePoint;
    if (points.length !== 0) {
      lastPoint = points[points.length - 1].geometry.coordinates;
    }
    // Cas rencontré lors de l'import de GeoJSON issu de la conversion à partir de GPX
    if (lastPoint[0] !== lastLinePoint[0] || lastPoint[1] !== lastLinePoint[1]) {
      points[points.length - 1].properties.order = "";
      points.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: lastLinePoint
        },
        properties: {
          order: "destination",
          id: pointId,
        },
      });
      pointId--;
    }
    // Si pas de points itermédiaires (souvent GPX)
    if (points.length === 0) {
      const newSteps = [];
      for (let i = 0; i < steps.length; i++) {
        const feature = steps[i];
        const lastIndex = feature.geometry.coordinates.length - 1;
        let pointIndexStep = 1;
        if (feature.geometry.coordinates.length > 50) {
          pointIndexStep = lastIndex / 50;
        }
        for (let j = 0; Math.floor(Math.round(j * 100) / 100) <= lastIndex; j += pointIndexStep) {
          let integerJ = Math.floor(Math.round(j * 100) / 100);
          let order = "";
          if (integerJ === 0 && i === 0) {
            order = "departure";
          }
          if (integerJ === lastIndex && i === steps.length - 1) {
            order = "destination";
          }
          // S'il y a plusieurs features, ne pas ajouter le dernier point
          if (!(integerJ === lastIndex && !(i === steps.length - 1))) {
            points.push({
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: feature.geometry.coordinates[integerJ]
              },
              properties: {
                order: order,
                id: pointId,
              },
            });
            pointId--;
          }
          if (integerJ !== lastIndex) {
            newSteps.push({
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: feature.geometry.coordinates.slice(integerJ, Math.floor(Math.round((j + pointIndexStep) * 100) / 100) + 1),
              },
              properties: {...feature.properties, id: pointId},
            });
          }
        }
      }
      steps = newSteps;
    }
    // Si plusieurs points mais 1 segment
    if (points.length > 2 && steps.length === 1) {
      const newSteps = [];
      const step = steps[0];
      for (let i = 0; i < points.length - 1; i++) {
        const startPoint = points[i];
        const endPoint = points[i + 1];
        newSteps.push(LineSlice(startPoint, endPoint, CleanCoords(step)));
      }
      steps = newSteps;
    }
    if (!routeJson.data) {
      routeJson.data = {};
    }
    return {
      name: routeJson.data.name,
      transport: routeJson.data.transport || "pedestrian",
      visible: true,
      data: {
        distance: routeJson.data.distance || 0,
        duration: routeJson.data.duration || 0,
        elevationData: routeJson.data.elevationData || {
          elevationData: [{ x: 0, y: 0 }],
          coordinates: [],
          dplus: 0,
          dminus: 0,
          unit: "m",
        },
        steps: steps,
        points: points,
      }
    };
  }

  /**
   * Récupère toutes les lignes des itinéraires sous forme de liste de features à géométrie multilinestring
   * @returns list of multilinestring features, each feature representing one route
   */
  #getRouteLines() {
    const allMultiLineFeatures = [];
    this.routes.forEach((route) => {
      let visible = false;
      if (route.visible) {
        visible = true;
      }
      const multilineRouteFeature = {
        type: "Feature",
        geometry: {
          type: "MultiLineString",
          coordinates: []
        },
        properties: {
          name: route.name,
          visible: visible,
          id: route.id,
        }
      };
      route.data.steps.forEach((step) => {
        multilineRouteFeature.geometry.coordinates.push(step.geometry.coordinates);
      });
      allMultiLineFeatures.push(multilineRouteFeature);
    });
    return allMultiLineFeatures;
  }

  /**
   * Récupère tous les points des itinéraires sous forme de liste de features à géométrie point
   * @returns list of point features
   */
  #getRoutePoints() {
    const allPointFeatures = [];
    this.routes.forEach((route) => {
      let visible = false;
      if (route.visible) {
        visible = true;
      }
      route.data.points.forEach((point) => {
        const newPoint = JSON.parse(JSON.stringify(point));
        newPoint.properties.visible = visible;
        allPointFeatures.push(newPoint);
      });
    });
    return allPointFeatures;
  }

  /**
   * met à jour les sources de données pour l'affichage
   */
  #updateSources() {
    var linesource = this.map.getSource(this.configuration.linesource);
    linesource.setData({
      type: "FeatureCollection",
      features: this.#getRouteLines(),
    });
    var pointsource = this.map.getSource(this.configuration.pointsource);
    pointsource.setData({
      type: "FeatureCollection",
      features: this.#getRoutePoints(),
    });

    var landmarksource = this.map.getSource(this.configuration.landmarksource);
    landmarksource.setData({
      type: "FeatureCollection",
      features: this.landmarks,
    });

    var compareLandmarksource = this.map.getSource(this.configuration.compareLandmarksource);
    compareLandmarksource.setData({
      type: "FeatureCollection",
      features: this.compareLandmarks,
    });

    Preferences.set({
      key: "savedRoutes",
      value: JSON.stringify(this.routes),
    });
    Preferences.set({
      key: "savedLandmarks",
      value: JSON.stringify(this.landmarks),
    });
    Preferences.set({
      key: "savedCompareLandmarks",
      value: JSON.stringify(this.compareLandmarks),
    });
  }

  /**
   * ajoute la source et le layer à la carte pour affichage des itinéraires
   */
  #addSourcesAndLayers() {
    this.map.addSource(this.configuration.linesource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });

    MyAccountLayers["line-casing"].source = this.configuration.linesource;
    MyAccountLayers["line"].source = this.configuration.linesource;
    this.map.addLayer(MyAccountLayers["line-casing"]);
    this.map.addLayer(MyAccountLayers["line"]);

    this.map.addSource(this.configuration.pointsource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });

    MyAccountLayers["point-casing"].source = this.configuration.pointsource;
    MyAccountLayers["point"].source = this.configuration.pointsource;
    MyAccountLayers["point-departure"].source = this.configuration.pointsource;
    MyAccountLayers["point-destination"].source = this.configuration.pointsource;
    this.map.addLayer(MyAccountLayers["point-casing"]);
    this.map.addLayer(MyAccountLayers["point"]);
    this.map.addLayer(MyAccountLayers["point-departure"]);
    this.map.addLayer(MyAccountLayers["point-destination"]);

    this.map.addSource(this.configuration.landmarksource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });
    MyAccountLayers["landmark-selected"].source = this.configuration.landmarksource;
    MyAccountLayers["landmark-casing"].source = this.configuration.landmarksource;
    MyAccountLayers["landmark"].source = this.configuration.landmarksource;
    MyAccountLayers["landmark-icon"].source = this.configuration.landmarksource;

    this.map.addSource(this.configuration.compareLandmarksource, {
      "type": "geojson",
      "data": {
        type: "FeatureCollection",
        features: [],
      }
    });
    MyAccountLayers["compare-landmark"].source = this.configuration.compareLandmarksource;
  }

  /**
   * ajoute le layer landmarks à la carte. Séparé pour pouvoir les ajouter en dernier, au-dessus des POI OSM
   */
  addLandmarksLayers() {
    this.map.addLayer(MyAccountLayers["landmark-selected"]);
    this.map.addLayer(MyAccountLayers["landmark-casing"]);
    this.map.addLayer(MyAccountLayers["landmark"]);
    this.map.addLayer(MyAccountLayers["landmark-icon"]);
    this.map.addLayer(MyAccountLayers["compare-landmark"]);
  }

  /**
     * affiche le menu des résultats du calcul
     * @public
     */
  show () {
    Globals.menu.open("myaccount");
  }

  /**
   * ferme le menu des résultats du calcul
   * @public
   */
  hide () {
    Globals.menu.close("myaccount");
  }
}

// mixins
Object.assign(MyAccount.prototype, MyAccountDOM);

export default MyAccount;

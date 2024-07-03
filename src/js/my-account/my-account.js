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
import ActionSheet from "../action-sheet";

import { Share } from "@capacitor/share";
import { Toast } from "@capacitor/toast";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { FilePicker } from "@capawesome/capacitor-file-picker";
import { App } from "@capacitor/app";
import maplibregl from "maplibre-gl";
import Sortable from "sortablejs";
import { kml, gpx } from "@tmcw/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import GeoJsonToGpx from "@dwayneparton/geojson-to-gpx";

import LineSlice from "@turf/line-slice";

import LandmarkIconSaved from "../../css/assets/landmark-saved-map.png";
import LandmarkIconFavourite from "../../css/assets/landmark-favourite-map.png";
import LandmarkIconTovisit from "../../css/assets/landmark-tovisit-map.png";
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

    this.#addSourcesAndLayers();

    // Identifiant unique pour les itinéraires
    this.lastRouteId = 0;
    this.lastLandmarkId = 0;

    // récupération des itinéraires enregistrés en local
    if (!localStorage.getItem("savedRoutes")) {
      localStorage.setItem("savedRoutes", "[]");
    } else {
      var localRoutes = JSON.parse(localStorage.getItem("savedRoutes"));
      this.routes = this.routes.concat(localRoutes.filter( route => !route.type));
    }

    // récupération des points de repère enregistrés en local
    if (!localStorage.getItem("savedLandmarks")) {
      localStorage.setItem("savedLandmarks", "[]");
    } else {
      var localLandmarks = JSON.parse(localStorage.getItem("savedLandmarks"));
      this.landmarks = this.landmarks.concat(localLandmarks);
    }

    this.map.loadImage(LandmarkIconSaved).then((image) => {
      this.map.addImage("landmark-icon-saved", image.data);
    });
    this.map.loadImage(LandmarkIconFavourite).then((image) => {
      this.map.addImage("landmark-icon-favourite", image.data);
    });
    this.map.loadImage(LandmarkIconTovisit).then((image) => {
      this.map.addImage("landmark-icon-tovisit", image.data);
    });

    // récupération des infos et rendu graphique
    this.compute().then(() => {
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
      this.render();
      this.#listeners();
      this.#updateSources();

      this.#importFileIfAppOpenedFromFile();
    });

    return this;
  }

  /**
   * Ajoute les écouteurs d'évènements
   * @private
   */
  #listeners() {
    this.map.on("click", MyAccountLayers["landmark-casing"].id, (e) => {
      if (["routeDraw", "routeDrawSave"].includes(Globals.backButtonState)) {
        return;
      }
      const landmark = this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["landmark-casing"].id]})[0];
      const title = `<div id="landmarkPositionTitle" class="divLegendContainer landmarkPosition-${landmark.id}">
        <label class="landmarkSummaryIcon landmarkSummaryIcon${landmark.properties.icon}"
        style="background-color:${landmark.properties.color};
          display: inline-block;
          margin-right: 5px;
          transform: translate(0, -2px);"></label>
        ${landmark.properties.title}
      </div>`;
      let intervalId = null;
      const deselectLandmarkCallback = () => {
        clearInterval(intervalId);
        landmark.properties.radiusRatio = 0;
        this.#updateSources();
      };
      Globals.position.compute({
        lngLat: e.lngLat,
        text: title,
        html: `<div class="positionHtmlBefore">${landmark.properties.description}</div>`,
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
      const routeId = this.map.queryRenderedFeatures(e.point, {layers: [MyAccountLayers["line-casing"].id]})[0].properties.id;
      const route = this.routes.filter( route => route.id == routeId)[0];
      this.showRouteDetails(route);
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

    var container = this.getContainer(this.accountName, this.routes, this.landmarks);
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
        path: url
      });
      let filename;
      try {
        filename = url.split(".").splice(-2)[0];
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
      limit: 1,
      readData: true,
    });
    this.#importData(result.files[0].data, result.files[0].name.split(".")[0], result.files[0].name.split(".")[1]);
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
      if (extension === "gpx") {
        imported = gpx(new DOMParser().parseFromString(rawData));
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
        imported.id = -1;
        this.addLandmark(imported);
        document.getElementById("myaccount-landmarks-tab").click();
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
          imported.data.name = defaultName;
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
    localStorage.setItem("savedRoutes", JSON.stringify(this.routes));
    this.#updateSources();
    let coordinates = [];
    drawRouteSaveOptions.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
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
    localStorage.setItem("savedLandmarks", JSON.stringify(this.landmarks));
    this.#updateSources();
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
      this.#updateSources();
      break;
    }
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
      document.getElementById(`route-visibility_ID_${route.id}`).checked = false;
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
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
   * Ouvre l'outil de tracé d'itinéraire en mode consultation pour afficher les caractéristiques techniques
   * @param {*} route
   */
  showRouteDetails(route) {
    if (!route.visible) {
      route.visible = true;
      this.#updateSources();
      document.getElementById(`route-visibility_ID_${route.id}`).checked = true;
    }
    let coordinates = [];
    route.data.steps.forEach((step) => {
      coordinates = coordinates.concat(step.geometry.coordinates);
    });
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
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
   * Ouvre l'outil de création de point de repère pour le modifer
   * @param {*} landmark
   */
  editLandmark(landmark) {
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
`,
      dialogTitle: "Partager mon point de repère",
    });
  }

  /**
   * Exporte l'itinéraire sous forme d'un ficheir geojson
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
      if (value === "json") {
        formatName = "JSON";
        await Filesystem.writeFile({
          path: `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.geojson`,
          data: JSON.stringify(this.#routeToGeojson(route)),
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        });
      } else if (value === "gpx") {
        formatName = "GPX";
        const gpx = GeoJsonToGpx(this.#routeToGeojson(route, "gpx"), {
          metadata: {
            name: route.name,
          }
        });
        const gpxString = new XMLSerializer().serializeToString(gpx);
        await Filesystem.writeFile({
          path: `${route.name.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_")}.gpx`,
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
   * Exporte le point de repère sous forme d'un ficheir geojson
   * @param {*} route
   */
  exportLandmark(landmark) {
    let documentsName = "Documents";
    if (Capacitor.getPlatform() === "ios") {
      documentsName = "Fichiers";
    }
    Filesystem.writeFile({
      path: `${landmark.properties.title}.geojson`.replace(/[&/\\#,+()$~%.'":*?<>{}]/g, "_"),
      data: JSON.stringify(landmark),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    }).then(() => {
      Toast.show({
        text: `Fichier enregistré dans ${documentsName}.`,
        duration: "long",
        position: "bottom"
      });
    }).catch( () => {
      Toast.show({
        text: "Le point de repère n'a pas pu être savegardé.",
        duration: "long",
        position: "bottom"
      });
    });
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
      this.map.fitBounds(bounds, {
        padding: 100,
      });
    }
    this.#updateSources();
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
      this.map.flyTo({center: landmark.geometry.coordinates, zoom: 14});
    }
    this.#updateSources();
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
        newSteps.push(LineSlice(startPoint, endPoint, step));
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
  }

  /**
   * ajoute le layer landmarks à la carte. Séparé pour pouvoir les ajouter en dernier, au-dessus des POI OSM
   */
  addLandmarksLayers() {
    this.map.addLayer(MyAccountLayers["landmark-selected"]);
    this.map.addLayer(MyAccountLayers["landmark-casing"]);
    this.map.addLayer(MyAccountLayers["landmark"]);
    this.map.addLayer(MyAccountLayers["landmark-icon"]);
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

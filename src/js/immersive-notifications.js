/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import { App } from "@capacitor/app";
import { Capacitor, registerPlugin } from "@capacitor/core";
const BackgroundGeolocation = registerPlugin("BackgroundGeolocation");
import { LocalNotifications } from "@capacitor/local-notifications";
import { Toast } from "@capacitor/toast";

import Globals from "./globals";
import Location from "./services/location";

import requestUtils from "./utils/request-utils";

import QueryConfig from "./data-layer/immersive-position-config.json";
import Code_cultuCaption from "./data-layer/code_cultu-caption.json";
import Code_tfvCaption from "./data-layer/code_tfv-caption.json";

import maplibregl from "maplibre-gl";
import PointToLineDistance from "@turf/point-to-line-distance";
import CleanCoords from "@turf/clean-coords";

let queryConfig;
let code_cultuCaption;
let code_tfvCaption;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/immersive-position-config.json");
  queryConfig = await resp.json();
} catch (e) {
  queryConfig = QueryConfig;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/code_cultu-caption.json");
  code_cultuCaption = await resp.json();
} catch (e) {
  code_cultuCaption = Code_cultuCaption;
}
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/code_tfv-caption.json");
  code_tfvCaption = await resp.json();
} catch (e) {
  code_tfvCaption = Code_tfvCaption;
}

/**
 * Gestion des "notifications immersives" avec des requêtes faites aux données autour de la géolocalisation
 */
class ImmersiveNotifications {
  /**
   * constructeur
   */
  constructor(test=false) {
    this.test = test;
    this.lat = null;
    this.lng = null;
    this.intervalId = null;
    this.currentData = {};

    this.positionWatcherId = null;
    this.locationBg = null;

    this.lastNotificationId = 0;

    this.requestNotificationPermission().then( () => {
      this.listen();
    });
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

  /**
   * Checks every 60 seconds if the user is inside an area of interest
   */
  listen() {
    this.intervalId = setInterval(this.#sendNotifications.bind(this), this.test ? 10000 : 120000);

    App.addListener("appStateChange", (state) => {
      if (!state.isActive) {
        this.#startBgTracking();
      } else {
        this.#stopBgTracking();
      }
    });
  }

  /**
   * Starts background location tracking for notifications
   */
  async #startBgTracking() {
    if (["denied", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
      return;
    }
    if (this.positionWatcherId !== null) {
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    // Global parameter to enable/disable notifications
    if (!Globals.newPlaceNotifEnabled) {
      return;
    }

    this.positionWatcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Le suivi de position est activé pour envoyer des notification lorque vous arrivez dans un nouveau lieu",
        backgroundTitle: "Cartes IGN : notifications d'arrivée dans un lieu",
        requestPermissions: true,
        distanceFilter: 1000,
      },
      async (position, error) => {
        if (error) {
          console.error("Geolocation error:", error);
          return;
        }

        this.locationBg = {
          lat: position.latitude,
          lng: position.longitude,
        };

        this.#sendNotifications();

      }
    );
  }

  /**
   * Stops background location tracking for notifications
   */
  async #stopBgTracking() {
    if (["denied", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
      return;
    }
    if (this.positionWatcherId === null) {
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await BackgroundGeolocation.removeWatcher({ id: this.positionWatcherId });
    this.positionWatcherId = null;
    this.locationBg = null;
  }

  /**
   * Gets the current position and sends notifications according to the position
   */
  async #sendNotifications() {
    if (["denied", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
      return;
    }
    if (!Location.getCurrentPosition() && !this.test && !this.locationBg) {
      return;
    }
    // Global parameter to enable/disable notifications
    if (!Globals.newPlaceNotifEnabled) {
      return;
    }

    if (this.test) {
      this.lat = Globals.map.getCenter().lat;
      this.lng = Globals.map.getCenter().lng;
    }

    if (this.positionWatcherId === null && Location.getCurrentPosition()) {
      this.lat = Location.getCurrentPosition().coords.latitude;
      this.lng = Location.getCurrentPosition().coords.longitude;
    } else if (this.positionWatcherId !== null && this.locationBg) {
      this.lat = this.locationBg.lat;
      this.lng = this.locationBg.lng;
    }

    this.#computeAll();
  }

  /**
   * Computes all data queries
   */
  async #computeAll() {
    for (let i = 0; i < queryConfig.length; i++) {
      const config = queryConfig[i];
      if (config.notification !== false) {
        let configNext = null;
        if (config.notification_uses_next) {
          configNext = queryConfig[i + 1];
        }
        const notifWasSent = await this.#computeFromConfig(config, configNext);
        if (notifWasSent) {
          break;
        }
      }
    }
  }

  /**
   * Queries GPF's WFS for info defined in the config
   */
  async #computeFromConfig(config, configNext = null) {
    const result = await requestUtils.requestWfs(
      this.lat,
      this.lng,
      config.layer,
      config.attributes,
      config.around || 0,
      config.geom_name || "geom",
      config.additional_cql || "",
      config.epsg || 4326,
      config.get_geom || false,
    );

    const filteredResult = this.#filterData(config.layer, result);

    if (
      !filteredResult[0] && (
        (config.layer === "BDTOPO_V3:parc_ou_reserve" && this.currentData["BDTOPO_V3:parc_ou_reserve"]) ||
        (config.layer === "BDTOPO_V3:foret_publique" && this.currentData["BDTOPO_V3:foret_publique"])
      )
    ) {
      const notificationText = this.#textTemplateQuit(config.layer);
      LocalNotifications.schedule({
        notifications: [
          {
            title: "Vous quittez un lieu",
            body: notificationText,
            id: this.lastNotificationId,
            schedule: {
              at: new Date(Date.now() + 1000),
              allowWhileIdle: true,
            },
          },
        ],
      });
      this.lastNotificationId++;
      if (!Capacitor.isNativePlatform()) {
        Toast.show({
          text: notificationText,
          duration: "short",
          position: "bottom"
        });
        console.warn("Notification : " + notificationText);
      }
      this.currentData[config.layer] = "";
      return true;
    }

    if (!filteredResult[0] && config.layer !== "BDTOPO_V3:zone_d_activite_ou_d_interet") {
      return false;
    }
    const layerData = filteredResult[0];

    if (this.currentData[config.layer] && this.currentData[config.layer] === JSON.stringify(layerData)) {
      return false;
    }

    let nextLayerData = "";

    if (configNext !== null) {
      const resultNext = await requestUtils.requestWfs(
        this.lat,
        this.lng,
        configNext.layer,
        configNext.attributes,
        configNext.around || 0,
        configNext.geom_name || "geom",
        configNext.additional_cql || "",
        configNext.epsg || 4326,
        configNext.get_geom || false,
      );
      if (resultNext[0]) {
        const filteredResultNext = this.#filterData(configNext.layer, resultNext);
        nextLayerData = filteredResultNext[0];
      }
    }

    this.currentData[config.layer] = JSON.stringify(layerData);

    const notificationText = this.#textTemplate(config.layer, layerData, nextLayerData);
    LocalNotifications.schedule({
      notifications: [
        {
          title: "Nouveau lieu",
          body: notificationText,
          id: this.lastNotificationId,
          schedule: {
            at: new Date(Date.now() + 1000),
            allowWhileIdle: true,
          },
        },
      ],
    });
    this.lastNotificationId++;
    if (!Capacitor.isNativePlatform()) {
      Toast.show({
        text: notificationText,
        duration: "short",
        position: "bottom"
      });
      console.warn("Notification : " + notificationText);
    }
    return true;
  }

  /**
   * Notification text template
   * @param {String} layer layer name
   * @param {String|String[]} result result of the filtered wfs query
   * @returns {String} text of the notification
   */
  #textTemplate(layer, result, nextResult = "") {
    let textResult = "";
    let text;
    switch (layer) {
    case "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:commune":
      textResult = `🏠 Vous êtes dans la commune de ${result[0]} qui compte ${result[1]} habitants`;
      break;
    case "LIMITES_ADMINISTRATIVES_EXPRESS.LATEST:departement":
      textResult = `🏠 Vous êtes dans le département de ${result}`;
      break;
    case "BDTOPO_V3:parc_ou_reserve":
      if (result[0] === "Site Natura 2000") {
        textResult = `🏞️ Vous êtes sur le site ${result[1]} classé Natura 2000 où la faune et la flore sont protégées`;
      } else {
        textResult = `🏞️ Vous êtes au sein du ${result[1]}`;
      }
      break;
    case "BDTOPO_V3:foret_publique":
      textResult = `Vous vous trouvez au sein de ${result}`;
      if (nextResult) {
        textResult += ` dont l'essence principale est ${nextResult}`;
      }
      break;
    case "BDTOPO_V3:cours_d_eau":
      textResult = `🌊 Non loin se trouve le cours d'eau ${result[0]}`;
      break;
    case "RPG.LATEST:parcelles_graphiques":
      textResult = `L'agriculture alentours est consacrée à des cultures telles que ${result}`;
      break;
    case "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale":
      textResult = `L'essence principale des bois environnants est ${result}`;
      break;
    case "BDTOPO_V3:zone_d_activite_ou_d_interet":
      text = "";
      if (result && !nextResult) {
        text = result[0];
      } else if (!result && nextResult) {
        text = nextResult[0];
      } else if (result && nextResult) {
        if (result[1] < nextResult[1]) {
          text = result[0];
        } else {
          text = nextResult[0];
        }
      }
      textResult = `Vous êtes à proximité de ${text}`;
      break;

    default:
      text = result[0];
      if (Array.isArray(text)) {
        text = text[0];
      }
      textResult = `Vous arrivez dans ${text}`;
      break;
    }
    return textResult;
  }

  /**
   * Notification text template for quitting an area
   * @param {String} layer
   * @returns {String} text of the notification
   */
  #textTemplateQuit(layer) {
    let notifText = "";
    const data = JSON.parse(this.currentData[layer]);
    switch (layer) {
    case "BDTOPO_V3:parc_ou_reserve":
      if (data[0] === "Site Natura 2000") {
        notifText = "Vous n'êtes plus sur un site classé Natura 2000";
      } else {
        notifText = `Vous quittez le ${data[1]}`;
      }
      break;
    case "BDTOPO_V3:foret_publique":
      notifText = `Vous avez quitté ${data}`;
      break;
    default:
      notifText = "Vous quittez un lieu";
      break;
    }
    return notifText;
  }

  /**
   * Filters the data results according to specific rules
   * @param {String} layer
   * @param {Array} dataResults
   * @returns
   */
  #filterData(layer, dataResults) {
    if (layer === "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale") {
      dataResults = dataResults.filter( (essence) => essence !== "NC" && essence !== "NR");
    }
    if (layer === "BDTOPO_V3:parc_ou_reserve") {
      dataResults = dataResults.filter( (parc) => {
        if ( !(["Site Natura 2000", "Parc naturel régional", "Parc national", "Réserve naturelle"].includes(parc[0])) ) {
          return false;
        }
        if (["Périmètre de protection d'une réserve naturelle nationale", "Périmètre de protection d'une réserve naturelle régionale"].includes(parc[2])) {
          return false;
        }
        return true;
      }).sort((a, b) => {
        if (a[0] === "Parc national") {
          return -1;
        }
        if (b[0] === "Parc national") {
          return 1;
        }
        if (b[0] === "Parc naturel régional" && a[0] !== "Parc national") {
          return 1;
        }
        if (a[0] === "Parc naturel régional" && b[0] !== "Parc national") {
          return -1;
        }
        if (a[0] === "Site Natura 2000") {
          return 1;
        }
        if (b[0] === "Site Natura 2000") {
          return -1;
        }
      });
    }
    if (layer === "BDTOPO_V3:zone_d_activite_ou_d_interet") {
      dataResults = dataResults.filter( (zai) => zai[1] !== null).sort( (a, b) => {
        const coordsA = new maplibregl.LngLat(...a[2].coordinates[0][0][0]);
        const coordsB = new maplibregl.LngLat(...b[2].coordinates[0][0][0]);
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        return coordsRef.distanceTo(coordsA) - coordsRef.distanceTo(coordsB);
      }).map( feat => {
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        const coordsFeat = new maplibregl.LngLat(...feat[2].coordinates[0][0][0]);
        return [feat[1], coordsRef.distanceTo(coordsFeat)];
      }).slice(0, 1);
    }
    if (layer === "BDTOPO_V3:plan_d_eau") {
      dataResults = dataResults.filter( (plan) => plan[1] !== null);
    }
    if (layer === "RPG.LATEST:parcelles_graphiques") {
      dataResults = dataResults.map( (code_cultu) => code_cultuCaption[code_cultu]).filter((culture) => culture);
      const counts = {};
      dataResults.forEach( (culture) => {
        if (counts[culture]) {
          counts[culture]++;
        } else {
          counts[culture] = 1;
        }
      });
      dataResults.sort( (a, b) => counts[a] > counts[b] );
    }
    if (layer === "LANDCOVER.FORESTINVENTORY.V2:formation_vegetale") {
      dataResults = dataResults.map( (code_tfv) => {
        let essenceEmoji = "";
        if (code_tfvCaption[code_tfv]) {
          if (code_tfv[2] === "1") {
            essenceEmoji = " 🌳";
          }
          if (code_tfv[2] === "2") {
            essenceEmoji = " 🌲";
          }
        }
        return code_tfvCaption[code_tfv] + essenceEmoji;
      }).filter((essence) => essence);
      const counts = {};
      dataResults.forEach( (essence) => {
        if (counts[essence]) {
          counts[essence]++;
        } else {
          counts[essence] = 1;
        }
      });
      dataResults.sort( (a, b) => counts[a] > counts[b] );
    }
    if (layer === "BDTOPO_V3:zone_d_habitation") {
      dataResults = dataResults.filter( (feat) => feat[0]).sort( (a, b) => {
        const coordsA = new maplibregl.LngLat(...a[1].coordinates[0][0][0]);
        const coordsB = new maplibregl.LngLat(...b[1].coordinates[0][0][0]);
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        return coordsRef.distanceTo(coordsA) - coordsRef.distanceTo(coordsB);
      }).map( feat => {
        const coordsRef = new maplibregl.LngLat(this.lng, this.lat);
        const coordsFeat = new maplibregl.LngLat(...feat[1].coordinates[0][0][0]);
        return [feat[0], coordsRef.distanceTo(coordsFeat)];
      }).slice(0, 1);
    }
    if (layer === "BDTOPO_V3:cours_d_eau") {
      dataResults = dataResults.filter( (cours) => {
        if (cours[0].split(" ")[0] === "Bras") {
          return false;
        }
        const splitted = cours[0].split(" ");
        for (let word of splitted) {
          if (word.match(/[0-9][0-9]/g)) {
            return false;
          }
        }
        return true;
      }).sort( (a, b) => {
        if (a[1].type === "MultiLineString") {
          a[1].type = "LineString";
          a[1].coordinates = a[1].coordinates[0];
        }
        if (b[1].type === "MultiLineString") {
          b[1].type = "LineString";
          b[1].coordinates = b[1].coordinates[0];
        }
        const distanceA = PointToLineDistance([this.lng, this.lat], CleanCoords(a[1]));
        const distanceB = PointToLineDistance([this.lng, this.lat], CleanCoords(b[1]));
        return distanceA - distanceB;
      });
    }
    return dataResults;
  }


}

export default ImmersiveNotifications;

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

import QueryConfig from "./data-layer/immersvie-position-config.json";
let queryConfig;
try {
  const resp = await fetch("https://ignf.github.io/cartes-ign-app/immersvie-position-config-new.json");
  queryConfig = await resp.json();
} catch (e) {
  queryConfig = QueryConfig;
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
  #computeAll() {
    queryConfig.forEach( (config) => {
      if (config.notification) {
        this.#computeFromConfig(config);
      }
    });
  }

  /**
   * Queries GPF's WFS for info defined in the config
   */
  async #computeFromConfig(config) {
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

    if (!result[0]) {
      return;
    }

    let text = result[0];
    if (Array.isArray(result[0])) {
      text = result[0][0];
    }
    if (this.currentData[config.layer] && this.currentData[config.layer] === text) {
      return;
    }

    this.currentData[config.layer] = text;
    LocalNotifications.schedule({
      notifications: [
        {
          title: "Nouveau lieu",
          body: `Vous arrivez dans ${text}`,
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
        text: `Vous arrivez dans ${text}`,
        duration: "short",
        position: "bottom"
      });
    }
  }

}

export default ImmersiveNotifications;

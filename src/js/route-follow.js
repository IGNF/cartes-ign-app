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
import GisUtils from "./utils/gis-utils";

import PointToLineDistance from "@turf/point-to-line-distance";
import CleanCoords from "@turf/clean-coords";
import LineSlice from "@turf/line-slice";
import turfLength from "@turf/length";

/**
 * Gestion des "notifications immersives" avec des requêtes faites aux données autour de la géolocalisation
 */
class RouteFollow {
  /**
   * constructeur
   */
  constructor(map, options, test = false) {
    this.options = options || {
      container: null,
    };

    const container = this.options.container || document.getElementById("routeFollowWindow");
    this.dom = {
      remainingTime : container.querySelector(".remainingTime"),
      remainingDist : container.querySelector(".remainingDist"),
      remainingDplus : container.querySelector(".remainingDplus"),
      notFollowAltert : container.querySelector(".notFollowAltert"),
      recenterBtn : container.querySelector(".recenter"),
    };

    this.lat = null;
    this.lng = null;
    this.map = map;
    this.active = false;
    this.alertActive = false;

    this.isBackground = false;

    this.test = test;

    this.positionWatcherId = null;
    this.locationBg = null;

    this.lastNotificationId = -1;
    this.handleNewLocation = this.#onNewLocation.bind(this);
    this.handleRecenterClick = this.#setLocationToNavigation.bind(this);

    this.data = {
      routeLine: {},
      elevations: [],
    };

    this.#listeners();
  }

  /**
   * Sets the data of the route to follow
   * @param {*} data
   */
  setData(data) {
    this.data = data;
  }

  /**
   * Enables route following
   */
  enable() {
    this.#setLocationToNavigation();
    this.requestNotificationPermission().then( () => {
      this.active = true;
      this.#startBgTracking();
      Location.target.addEventListener("geolocationWatch", this.handleNewLocation);
      if (!Capacitor.isNativePlatform()) {
        this.map.on("moveend", this.handleNewLocation);
      }
    });
  }

  /**
   * Disables route following
   */
  disable() {
    this.active = false;
    Location.target.removeEventListener("geolocationWatch", this.handleNewLocation);
    if (!Capacitor.isNativePlatform()) {
      this.map.off("moveend", this.handleNewLocation);
    }
    this.#stopBgTracking();
  }

  /**
   * Show the route follow window
   */
  show() {
    Globals.menu.open("routeFollow");
    this.enable();
  }

  #listeners() {
    this.dom.recenterBtn.addEventListener("click", this.handleRecenterClick);

    App.addListener("appStateChange", (state) => {
      if (!state.isActive && this.active) {
        this.isBackground = true;
      } else {
        this.isBackground = false;
      }
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

    this.positionWatcherId = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Le suivi de position est activé pour le suivi de l'itinéraire",
        backgroundTitle: "Cartes IGN : suivi d'itinéraire",
        requestPermissions: true,
        distanceFilter: 50,
      },
      async (position, error) => {
        if (error) {
          console.error("Geolocation error:", error);
          return;
        }

        if (!this.isBackground) {
          return;
        }

        this.locationBg = {
          lat: position.latitude,
          lng: position.longitude,
        };

        this.#sendNotification();
      }
    );
  }

  /**
   * Stops background location tracking for notifications
   */
  async #stopBgTracking() {
    if (!this.permissionStatus) {
      return;
    }
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
   * New location listener
   */
  async #onNewLocation() {
    await this.#sendNotification();
    this.#updateInfo();
  }

  /**
   * Updates info according to current location
   */
  #updateInfo() {
    const stopPt = this.data.routeLine.geometry.coordinates.slice(-1)[0];
    const remainingRoute = LineSlice([this.lng, this.lat], stopPt, CleanCoords(this.data.routeLine));

    const remainingLength = turfLength(remainingRoute);

    const fractionRemainining = remainingLength / turfLength(this.data.routeLine);
    let remainingDplus = 0;
    const firstIndex = this.data.elevations.length - Math.round(fractionRemainining * this.data.elevations.length);
    let lastY = this.data.elevations[firstIndex].y;
    for (let i = firstIndex; i < this.data.elevations.length - 1; i++) {
      const currentEle = this.data.elevations[i].y;
      if (currentEle - lastY > 0) {
        remainingDplus += currentEle - lastY;
      }
      lastY = currentEle;
    }

    const remainingDuration = GisUtils.getHikeTimeScarfsRule(remainingLength * 1000, remainingDplus, Globals.walkingSpeed) / 60;
    this.dom.remainingTime.innerText = `${remainingDuration.toFixed(2)} min`;
    this.dom.remainingDist.innerText = `${remainingLength.toFixed(2)} km`;
    this.dom.remainingDplus.innerText = `${remainingDplus.toFixed(2)} m`;
  }

  /**
   * Sets location mode to navigation
   */
  #setLocationToNavigation() {
    if (!Location.isLocationActive()) {
      document.getElementById("geolocateBtn").click();
    }
    if (!Location.isNavigationActive()) {
      document.getElementById("geolocateBtn").click();
    }
  }

  /**
   * Updates the current position and sends notifications if too far away from route
   */
  async #sendNotification() {
    if (["denied", "prompt-with-rationale"].includes(this.permissionStatus.display)) {
      return;
    }
    if (!Location.getCurrentPosition() && !this.test && !this.locationBg) {
      return;
    }

    if (this.positionWatcherId === null && Location.getCurrentPosition()) {
      this.lat = Location.getCurrentPosition().coords.latitude;
      this.lng = Location.getCurrentPosition().coords.longitude;
    } else if (this.positionWatcherId !== null && this.locationBg) {
      this.lat = this.locationBg.lat;
      this.lng = this.locationBg.lng;
    }

    if (this.test) {
      this.lat = this.map.getCenter().lat;
      this.lng = this.map.getCenter().lng;
    }

    // test distance to route and send notif
    const dist = PointToLineDistance([this.lng, this.lat], CleanCoords(this.data.routeLine));
    // dist is in km
    if (dist > 0.05) {
      this.dom.notFollowAltert.classList.remove("d-none");
      if (!this.alertActive) {
        LocalNotifications.schedule({
          notifications: [
            {
              title: "Vous vous éloignez de l'itinéraire",
              body: "Vous vous éloignez de l'itinéraire",
              id: this.lastNotificationId,
              schedule: {
                at: new Date(Date.now() + 1000),
                allowWhileIdle: true,
              },
            },
          ],
        });
        this.lastNotificationId--;
        if (!Capacitor.isNativePlatform()) {
          Toast.show({
            text: "Vous vous éloignez de l'itinéraire",
            duration: "short",
            position: "bottom"
          });
        }
      }
      this.alertActive = true;
    } else {
      this.alertActive = false;
      this.dom.notFollowAltert.classList.add("d-none");
    }
  }

}

export default RouteFollow;

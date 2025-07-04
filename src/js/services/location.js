/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";

import DOM from "../dom";
import Globals from "../globals";
import GisUtils from "../utils/gis-utils";

import { Toast } from "@capacitor/toast";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { App } from "@capacitor/app";
import { NativeSettings, AndroidSettings, IOSSettings } from "capacitor-native-settings";
import { KeepAwake } from "@capacitor-community/keep-awake";
import { Preferences } from "@capacitor/preferences";

let Geolocation;
try {
  Geolocation = (await import("@capacitor/geolocation")).Geolocation;
} catch (e) {
  Geolocation = {
    checkPermissions: async () => {
      try {
        await new Promise( (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            maximumAge: 0,
            timeout: 1,
          });
        });
        return {
          location: "granted",
        };
      } catch (e) {
        // code 1 : geolocation denied https://developer.mozilla.org/en-US/docs/Web/API/GeolocationPositionError/code
        if (e.code === 1) {
          return {
            location: "denied",
          };
        } else if (e.code === 2) {
          throw new Error("Location services disabled");
        } else {
          return {
            location: "granted",
          };
        }
      }
    },
    requestPermissions: async () => {
      await NativeSettings.open({
        optionAndroid: AndroidSettings.ApplicationDetails,
        optionIOS: IOSSettings.App
      });
      return await Geolocation.checkPermissions();
    },
    clearWatch: (idObject) => {
      navigator.geolocation.clearWatch(idObject.id);
    },
  };
}
import { Capacitor } from "@capacitor/core";

import Buffer from "@turf/buffer";

import PopupUtils from "../utils/popup-utils";

/* Géolocalisation */
// Positionnement du mobile
let location_active = false;

// Suivi de la carte
let tracking_active = false;

// Suivi de la carte avec boussole
let navigation_active = false;

let watch_id;
let currentPosition = null;

let animationId = null;

let isMapPanning = false;

let mapBearing = 0;
let positionBearing = 0;

let positionIsGrey = false;

let popup = {
  popup: null
};

let lastAccuracy;
let firstLocation;

// Est-ce que le marqueur de "Ma Position" a un écouteur d'évènement ?
let hasEventListener = false;

// Varaibles pour la gestion d'évènements touch et zoom spécifiques à la localisation activée
let startDist = 0;
let startZoom = 0;
let startBearing =0;
let startAngle = 0;
let rotationEnabled = false;

/**
 * Interface pour les evenements
 * @example
 * target.dispatchEvent(new CustomEvent("myEvent", { detail : {} }));
 * target.addEventListener("myEvent", handler);
 */
const target = new EventTarget();

/**
 * Enlève le marqueur GPS
 */
const clean = () => {
  if (Globals.myPositionMarker !== null) {
    Globals.myPositionMarker.remove();
    Globals.myPositionMarker = null;
  }
  Globals.map.getSource("location-precision").setData({
    "type": "FeatureCollection",
    "features": []
  });

};

/**
 * Modifie la rotation du marqueur GPS
 * @param {*} positionBearing
 */
const setMarkerRotation = (positionBearing) => {
  if (Globals.myPositionMarker) {
    Globals.myPositionMarker.setRotation(positionBearing);
  }
};

/**
 * Animation du marqueur
 * @param {*} coords
 */
const animateMarker = (coords) => {
  const currentLng = Globals.myPositionMarker.getLngLat().lng;
  const currentLat = Globals.myPositionMarker.getLngLat().lat;
  let nextLng = currentLng + (coords.lon - currentLng) / 2;
  let nextLat = currentLat + (coords.lat - currentLat) / 2;
  nextLat = Math.round(nextLat * 1e6) / 1e6;
  nextLng = Math.round(nextLng * 1e6) / 1e6;
  Globals.myPositionMarker.setLngLat([
    nextLng,
    nextLat
  ]);
  if (nextLng !== coords.lon && nextLat !== coords.lat) {
    // Request the next frame of the animation.
    animationId = requestAnimationFrame(() => animateMarker(coords));
  }
};

/**
 * Ajoute un marqueur de type GPS à la position définie par le coods,
 * et déplace la carte au zoom demandé si panTo est True
 * @param {*} coords
 * @param {*} zoom
 * @param {*} panTo
 * @param {*} gps - choix du type d'icone, GPS par defaut
 */
const moveTo = (coords, zoom = Globals.map.getZoom(), panTo = true, gps = true) => {
  // si l'icone est en mode gps, on ne reconstruit pas le marker
  // mais, on met à jour la position !
  if (!positionIsGrey && Globals.myPositionMarker !== null && gps) {
    if (animationId !== null) {
      window.cancelAnimationFrame(animationId);
    }
    coords.lat = Math.round(coords.lat * 1e6) / 1e6;
    coords.lon = Math.round(coords.lon * 1e6) / 1e6;
    animationId = requestAnimationFrame(() => animateMarker(coords));
  } else {
    // on reconstruit le marker
    if (Globals.myPositionMarker !== null) {
      Globals.myPositionMarker.remove();
      Globals.myPositionMarker = null;
    }
    let positionIcon = Globals.myPositionIcon;
    if (!currentPosition) {
      positionIcon = Globals.myPositionIconGrey;
      positionIsGrey = true;
    } else {
      positionIsGrey = false;
    }
    Globals.myPositionMarker = new maplibregl.Marker({
      element: (gps) ? positionIcon : Globals.searchResultIcon,
      anchor: (gps) ? "center" : "bottom",
      pitchAlignment: "map",
    })
      .setLngLat([coords.lon, coords.lat])
      .addTo(Globals.map);
    Globals.myPositionMarker.setRotationAlignment("map");
    if (!hasEventListener) {
      hasEventListener = true;
      Globals.myPositionIcon.addEventListener("click", () => {
        // Ecouteur uniquement en mode défaut, position, informations, couches ou filtres POI
        if (
          Globals.backButtonState !== "default" &&
          Globals.backButtonState.split("-")[0] !== "position" &&
          Globals.backButtonState !== "informations" &&
          Globals.backButtonState !== "layerManager" &&
          Globals.backButtonState !== "poi"
        ) {
          return;
        }
        Globals.position.compute({
          lngLat: Globals.myPositionMarker.getLngLat(),
          text: "Ma position",
          type: "myposition"
        }).then(() => Globals.menu.open("position"));
      });
    }
  }

  setMarkerRotation(positionBearing);

  if (panTo) {
    if (tracking_active) {
      let bearing = Globals.map.getBearing();
      let pitch = Globals.map.getPitch();
      let padding = 0;
      if (navigation_active) {
        bearing = -mapBearing;
        pitch = 45;
        padding = {top: DOM.$map.clientHeight * 0.5};
      }
      isMapPanning = true;
      Globals.map.easeTo({
        center: [coords.lon, coords.lat],
        zoom: zoom,
        bearing: bearing,
        pitch: pitch,
        duration: 500,
        padding: padding,
      });
      Globals.map.once("moveend", () => {isMapPanning = false;});
    } else {
      Globals.map.flyTo({
        center: [coords.lon, coords.lat],
        zoom: zoom,
      });
    }
  }
};

/**
 * Callback du suivi de position
 */
const watchPositionCallback = (position) => {
  if (firstLocation) {
    // FIXME: STYLE: passer par une classe et style CSS
    DOM.$geolocateBtn.classList.add("locationFixe");
    Toast.show({
      text: "Suivi de position activé",
      duration: "short",
      position: "bottom"
    });
  }
  if (location_active && position && position.coords.accuracy <= Math.max(lastAccuracy, 150) ) {
    target.dispatchEvent(
      new CustomEvent("geolocationWatch", {
        bubbles: true,
        detail: position.coords,
      })
    );
    lastAccuracy = position.coords.accuracy;
    const point = {
      type: "Point",
      coordinates: [position.coords.longitude, position.coords.latitude],
    };
    const circle = Buffer(point, position.coords.accuracy, {units: "meters"});
    Globals.map.getSource("location-precision").setData(circle);
    currentPosition = position;
    if (Globals.trackRecord && Globals.trackRecord.recording) {
      const trackRecordFeatureLength = Globals.trackRecord.currentFeature.geometry.coordinates.length;
      if (trackRecordFeatureLength > 0) {
        const line = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [position.coords.longitude, position.coords.latitude],
              [
                Globals.trackRecord.currentFeature.geometry.coordinates[trackRecordFeatureLength - 1][0],
                Globals.trackRecord.currentFeature.geometry.coordinates[trackRecordFeatureLength - 1][1]
              ],
            ],
          },
        };
        Globals.map.getSource("track-record-current-line").setData(line);
      }
    }
    Preferences.set({
      key: "lastKnownPosition",
      value: JSON.stringify({lat: currentPosition.coords.latitude, lng: currentPosition.coords.longitude}),
    });
    var zoom = Globals.map.getZoom();
    if (firstLocation) {
      zoom = Math.max(Globals.map.getZoom(), 16.5);
    }
    moveTo({
      lat: position.coords.latitude,
      lon: position.coords.longitude
    }, zoom, tracking_active || firstLocation);
    // Si la précision est insuffisante, ne pas zoomer à 16
    if (lastAccuracy > 150 && (tracking_active || firstLocation)) {
      const bbox = GisUtils.getBoundingBox(circle.geometry.coordinates[0]);
      var padding;
      // gestion du mode paysage / écran large
      if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        padding = {top: 20, right: 20, bottom: 20, left: 20};
      } else {
        padding = {top: 80, right: 20, bottom: 40, left: 20};
      }
      Globals.map.fitBounds(bbox, {
        padding: padding
      });
    }
    firstLocation = false;
  }
};

/**
 * Suit la position de l'utilisateur
 */
const trackLocation = () => {
  lastAccuracy = 100000;
  Geolocation.checkPermissions().then((status) => {
    if (status.location !== "denied") {
      firstLocation = true;
      // Android frequency problem for geolocation https://www.reddit.com/r/ionic/comments/zfg9xn/capacitor_geolocation_works_great_on_the_web_and/
      if (Capacitor.getPlatform() === "android") {
        watch_id = navigator.geolocation.watchPosition(watchPositionCallback, (err) => {
          console.warn(err);
          DOM.$geolocateBtn.classList.remove("locationFixe");
          DOM.$geolocateBtn.classList.remove("locationDisabled");
          Geolocation.clearWatch({id: watch_id});
          clean();
          currentPosition = null;
          location_active = false;
          tracking_active = false;
          Toast.show({
            text: "Impossible de récupérer la géolocalisation. Est-elle activée ?",
            duration: "long",
            position: "bottom"
          });
        }, {
          maximumAge: 1000,
          timeout: 10000,
          enableHighAccuracy: true
        });
      } else {
        Geolocation.watchPosition({
          maximumAge: 1000,
          timeout: 10000,
          enableHighAccuracy: true
        }, watchPositionCallback).then( (watchId) => {
          watch_id = watchId;
        });
      }
    } else {
      // Location services denied
      DOM.$geolocateBtn.classList.remove("locationFixe");
      DOM.$geolocateBtn.classList.add("locationDisabled");
      showLocationDeniedPopup();
    }
  }).catch(() => {
    // Location services disabled
    DOM.$geolocateBtn.classList.remove("locationFixe");
    DOM.$geolocateBtn.classList.add("locationDisabled");
    showLocationDisabledPopup();
  });
};

/**
 * Modification du statut de localisation
 */
const enablePosition = async() => {
  DOM.$geolocateBtn.classList.add("locationLoading");
  let permissionStatus;
  if (popup.popup) {
    popup.popup.remove();
  }
  try {
    permissionStatus = await Geolocation.checkPermissions();
  } catch {
    // Location services disabled
    await NativeSettings.open({
      optionAndroid: AndroidSettings.Location,
      optionIOS: IOSSettings.LocationServices
    });
    try {
      permissionStatus = await Geolocation.checkPermissions();
    } catch {
      DOM.$geolocateBtn.classList.remove("locationLoading");
      DOM.$geolocateBtn.classList.add("locationDisabled");
      showLocationDisabledPopup();
      return;
    }
  }
  if (["denied", "prompt", "prompt-with-rationale"].includes(permissionStatus.location) && Capacitor.isNativePlatform()) {
    permissionStatus = await Geolocation.requestPermissions(["location"]);
  }
  if (["denied", "prompt-with-rationale"].includes(permissionStatus.location)) {
    // Location services denied
    DOM.$geolocateBtn.classList.remove("locationLoading");
    DOM.$geolocateBtn.classList.add("locationDisabled");
    showLocationDeniedPopup();
    return;
  }
  DOM.$geolocateBtn.classList.remove("locationLoading");
  location_active = true;
  tracking_active = true;
  const lastKnownPosition = await Preferences.get( { key: "lastKnownPosition"} );
  if (!currentPosition && lastKnownPosition.value) {
    const lastPosition = JSON.parse(lastKnownPosition.value);
    moveTo({
      lat: lastPosition.lat,
      lon: lastPosition.lng
    }, Globals.map.getZoom(), false);
  }
  trackLocation();
  Toast.show({
    text: "Récupération de la géolocalisation...",
    duration: "short",
    position: "bottom"
  });
};

const locationOnOff = async () => {
  if (!location_active) {
    enablePosition();
  } else if (!tracking_active) {
    if (currentPosition === null) {
      return;
    }
    DOM.$geolocateBtn.classList.remove("locationDisabled");
    DOM.$geolocateBtn.classList.remove("locationLoading");
    DOM.$geolocateBtn.classList.add("locationFixe");
    tracking_active = true;
    Globals.map.setPadding({top: 0, right: 0, bottom: 0, left: 0});
    Globals.map.setCenter([currentPosition.coords.longitude, currentPosition.coords.latitude]);
    Globals.map.setPitch(0);
    Globals.map.touchZoomRotate.disable();
    Globals.map.getCanvasContainer().addEventListener("touchstart", locationOnTouchStartHandler);
    Globals.map.getCanvasContainer().addEventListener("touchmove", locationOnTouchMoveHandler);
    Toast.show({
      text: "Suivi de position activé",
      duration: "short",
      position: "bottom"
    });
    KeepAwake.keepAwake();
  } else if (!navigation_active) {
    if (currentPosition === null) {
      return;
    }
    DOM.$geolocateBtn.classList.remove("locationFixe");
    DOM.$geolocateBtn.classList.add("locationFollow");
    navigation_active = true;
    const padding = {top: DOM.$map.clientHeight * 0.5};
    Globals.map.easeTo({
      center: [currentPosition.coords.longitude, currentPosition.coords.latitude],
      bearing: -mapBearing,
      pitch: 45,
      padding: padding,
    });
    DOM.$compassBtn.classList.remove("d-none");
    DOM.$compassBtn.style.transform = "rotate(" + mapBearing + "deg)";
    Toast.show({
      text: "Mode navigation activé",
      duration: "short",
      position: "bottom"
    });
  } else {
    DOM.$geolocateBtn.classList.remove("locationFollow");
    tracking_active = false;
    navigation_active = false;
    KeepAwake.allowSleep();
    Globals.map.setPadding({top: 0, right: 0, bottom: 0, left: 0});
    Globals.map.flyTo({
      pitch: 0,
      duration: 200,
    });
    Globals.map.touchZoomRotate.enable();
    Globals.map.getCanvasContainer().removeEventListener("touchstart", locationOnTouchStartHandler);
    Globals.map.getCanvasContainer().removeEventListener("touchmove", locationOnTouchMoveHandler);
    Toast.show({
      text: "Navigation désactivée",
      duration: "short",
      position: "bottom"
    });
  }
};

/**
 * ...
 * @param {*} event
 */
const getOrientation = async (event) => {
  let bearing;
  // if iOS
  if (event.webkitCompassHeading) {
    bearing = -event.webkitCompassHeading;
  } else {
    // not iOS
    bearing = event.alpha;
  }
  if (Math.abs(mapBearing - bearing) < 0.5) {
    return;
  }
  let tempMapBearing = bearing;
  let orientation = await ScreenOrientation.orientation();
  if (orientation.type === "landscape-secondary") {
    tempMapBearing += 90;
  }
  if (orientation.type === "landscape-primary") {
    tempMapBearing -= 90;
  }
  mapBearing = tempMapBearing;
  if (navigation_active) {
    if (!isMapPanning) {
      Globals.map.easeTo({bearing: -mapBearing, duration: 100});
    }
    DOM.$compassBtn.classList.remove("d-none");
    DOM.$compassBtn.style.transform = "rotate(" + mapBearing + "deg)";
  }
  positionBearing = Number(Number(360 - mapBearing).toFixed(1));
  if (Globals.myPositionMarker) {
    setMarkerRotation(positionBearing);
  }
};

/**
 * ...
 * @returns
 * @fire geolocation
 */
const getLocation = async () => {
  var results = null;
  var position = currentPosition;
  if (currentPosition === null) {
    await enablePosition();
    // Récupération rapide de la position si elle n'est pas connue
    if (Capacitor.getPlatform() === "android") {
      position = await new Promise( (resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          maximumAge: 0,
          timeout: 3000,
        });
      });
    } else {
      position = await Geolocation.getCurrentPosition({
        maximumAge: 0,
        timeout: 3000,
      });
    }
  }

  results = {
    coordinates : {
      lat: Math.round(position.coords.latitude * 1e6) / 1e6,
      lon: Math.round(position.coords.longitude * 1e6) / 1e6
    },
    text : "Ma position"
  };

  target.dispatchEvent(
    new CustomEvent("geolocation", {
      bubbles: true,
      detail: results
    })
  );
  return results;
};

const disableTracking = () => {
  DOM.$geolocateBtn.classList.remove("locationFixe");
  DOM.$geolocateBtn.classList.remove("locationFollow");
  tracking_active = false;
  if (navigation_active) {
    navigation_active = false;
  }
  Globals.map.touchZoomRotate.enable();
  Globals.map.getCanvasContainer().removeEventListener("touchstart", locationOnTouchStartHandler);
  Globals.map.getCanvasContainer().removeEventListener("touchmove", locationOnTouchMoveHandler);
};

const disableNavigation = (bearing = Globals.map.getBearing()) => {
  DOM.$geolocateBtn.classList.add("locationFixe");
  DOM.$geolocateBtn.classList.remove("locationFollow");
  navigation_active = false;
  Globals.map.setPadding({top: 0, right: 0, bottom: 0, left: 0});
  Globals.map.flyTo({
    bearing: bearing,
    pitch: 0,
    duration: 500,
  });
  if (bearing === 0) {
    DOM.$compassBtn.classList.add("d-none");
  }
};

let listenResumeAfterLocation = false;
/**
 * affiche la popup si localisation désactivée sur téléphone
 */
const showLocationDisabledPopup = () => {
  showPopup(`
  <div id="locationPopup">
      <div class="divPositionTitle">La localisation de l'appareil est désactivée</div>
      <div class="divPopupClose" onclick="onCloselocationPopup(event)"></div>
      <div class="divPopupContent">
      La localisation de l'appareil est désactivée.<br/>
      Pour pouvoir utiliser le positionnement sur la carte, veuillez activer la localisation sur votre appareil.
      </div>
      <div class="btnOpenParameters" onclick="openLocationParameters(event)">Accèder aux paramètres de localisation</div>
  </div>
  `);
  window.openLocationParameters = async () => {
    if (!listenResumeAfterLocation) {
      App.addListener("resume", async () => {
        try {
          await Geolocation.checkPermissions();
          enablePosition();
        } catch (e) {
          return;
        }
      });
      listenResumeAfterLocation = true;
    }
    NativeSettings.open({
      optionAndroid: AndroidSettings.Location,
      optionIOS: IOSSettings.LocationServices
    });
  };
};

let listenResumeAfterAuthorisation = false;
/**
 * affiche la popup si localisation no autorisée sur l'appli
 */
const showLocationDeniedPopup = () => {
  showPopup(`
  <div id="locationPopup">
      <div class="divPositionTitle">L’accès à la localisation de votre appareil n’est pas autorisé.</div>
      <div class="divPopupClose" onclick="onCloselocationPopup(event)"></div>
      <div class="divPopupContent">
      Pour pouvoir utiliser le positionnement sur la carte, veuillez modifier les paramètres de l’application.
      </div>
      <div class="btnOpenParameters" onclick="openAppParameters(event)">Accèder aux paramètres de l'application</div>
  </div>
  `);
  window.openAppParameters = async () => {
    if (!listenResumeAfterAuthorisation) {
      App.addListener("resume", enablePosition);
      listenResumeAfterAuthorisation = true;
    }
    NativeSettings.open({
      optionAndroid: AndroidSettings.ApplicationDetails,
      optionIOS: IOSSettings.App
    });
  };
};

/**
 * Affiche une popup en finction de son contenu
 */
const showPopup = (content) => {
  PopupUtils.showPopup(content, Globals.map, "locationPopup", "onCloselocationPopup", popup);
};

const isLocationActive = () => {
  return location_active;
};

const isTrackingActive = () => {
  return tracking_active;
};

const isNavigationActive = () => {
  return navigation_active;
};

const getCurrentPosition = () => {
  return currentPosition;
};

// Event handlers for rotation and zoom when tracking active
const locationOnTouchStartHandler = (e) => {
  if (e.touches.length === 2) {
    startDist = getTouchDistance(e.touches);
    startZoom = Globals.map.getZoom();
    startBearing = Globals.map.getBearing();
    startAngle = getTouchAngle(e.touches);
    rotationEnabled = false;
  }
};

const locationOnTouchMoveHandler = (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();

    const currentDist = getTouchDistance(e.touches);
    const scale = currentDist / startDist;
    const newZoom = startZoom + Math.log2(scale);

    const currentAngle = getTouchAngle(e.touches);
    let angleDelta = currentAngle - startAngle;
    if (!rotationEnabled && Math.abs(angleDelta) > 8) {
      rotationEnabled = true;
      startAngle += angleDelta;
      angleDelta = 0;
    }
    const newBearing = startBearing - angleDelta;

    Globals.map.setZoom(newZoom, { around: Globals.map.getCenter() });
    if (rotationEnabled) {
      Globals.map.setBearing(newBearing);
    }
  }
};

function getTouchDistance(touches) {
  const [touch1, touch2] = touches;
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getTouchAngle(touches) {
  const [touch1, touch2] = touches;
  const dx = touch1.clientX - touch2.clientX;
  const dy = touch1.clientY - touch2.clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

export default {
  target,
  getCurrentPosition,
  isLocationActive,
  isTrackingActive,
  isNavigationActive,
  moveTo,
  enablePosition,
  locationOnOff,
  getOrientation,
  getLocation,
  disableTracking,
  disableNavigation,
};

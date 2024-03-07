import maplibregl from "maplibre-gl";

import DOM from "../dom";
import Globals from "../globals";
import GisUtils from "../utils/gis-utils";

import { Geolocation } from "@capacitor/geolocation";
import { Toast } from "@capacitor/toast";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { App } from "@capacitor/app";
import { NativeSettings, AndroidSettings, IOSSettings } from "capacitor-native-settings";
import { Capacitor } from "@capacitor/core";

import Buffer from "@turf/buffer";

import MapLibreGL from "maplibre-gl";

// fichiers SVG
import LocationImg from "../../css/assets/map-buttons/localisation.svg";
import LocationFollowImg from "../../css/assets/map-buttons/location-follow.svg";
import LocationFixeImg from "../../css/assets/map-buttons/location-fixed.svg";
import LocationLoading from "../../css/assets/loading-green.svg";
import LocationDisabled from "../../css/assets/map-buttons/location-disabled.svg";

/* Géolocalisation */
// Positionnement du mobile
let location_active = false;

// Suivi de la carte
let tracking_active = false;
let watch_id;
let currentPosition = null;

let animationId = null;

let isMapPanning = false;

let mapBearing = 0;
let positionBearing = 0;

let positionIsGrey = false;

let popup = null;

let lastAccuracy;
let firstLocation;

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
    // Globals.myPositionMarker.setLngLat([coords.lon, coords.lat]);
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
    })
      .setLngLat([coords.lon, coords.lat])
      .addTo(Globals.map);
    Globals.myPositionMarker.setRotationAlignment("map");
    Globals.myPositionIcon.addEventListener("click", () => {
      Globals.position.compute(Globals.myPositionMarker.getLngLat(), "Ma position").then(() => Globals.menu.open("position"));
    });
  }

  setMarkerRotation(positionBearing);

  if (panTo) {
    if (tracking_active) {
      isMapPanning = true;
      Globals.map.flyTo({center: [coords.lon, coords.lat], zoom: zoom, bearing: -mapBearing, duration: 500});
      Globals.map.once("moveend", () => {isMapPanning = false;});
    } else {
      Globals.map.flyTo({center: [coords.lon, coords.lat], zoom: zoom});
    }
  }
};

/**
 * Callback du suivi de position
 */
const watchPositionCallback = (position) => {
  if (firstLocation) {
    DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationFixeImg + "\")";
    Toast.show({
      text: "Suivi de position activé",
      duration: "short",
      position: "bottom"
    });
  }
  if (location_active && position && position.coords.accuracy <= Math.max(lastAccuracy, 150) ) {
    lastAccuracy = position.coords.accuracy;
    const point = {
      type: "Point",
      coordinates: [position.coords.longitude, position.coords.latitude],
    };
    const circle = Buffer(point, position.coords.accuracy, {units: "meters"});
    Globals.map.getSource("location-precision").setData(circle);
    currentPosition = position;
    localStorage.setItem("lastKnownPosition", JSON.stringify({lat: currentPosition.coords.latitude, lng: currentPosition.coords.longitude}));
    var zoom = Globals.map.getZoom();
    if (firstLocation || tracking_active) {
      zoom = Math.max(Globals.map.getZoom(), 16);
    }
    moveTo({
      lat: position.coords.latitude,
      lon: position.coords.longitude
    }, zoom, tracking_active || firstLocation);
    // Si la précision est insuffisante, ne pas zoomer à 16
    if (lastAccuracy > 150) {
      const bbox = GisUtils.getBoundingBox(circle.geometry.coordinates[0]);
      var padding;
      // gestion du mode paysage / écran large
      if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        var paddingLeft = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left").slice(0, -2)) +
                    Math.min(window.innerHeight, window.innerWidth/2) + 42;
        padding = {top: 20, right: 20, bottom: 20, left: paddingLeft};
      } else {
        padding = {top: 80, right: 20, bottom: 120, left: 20};
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
      // Récupération rapide d'une position
      // Geolocation.watchPosition({
      //   maximumAge: 0,
      //   timeout: 3000,
      //   enableHighAccuracy: false
      // }, watchPositionCallback).then( (watchId) => {
      //   Geolocation.clearWatch(watchId);
      // });

      Geolocation.watchPosition({
        maximumAge: 1000,
        timeout: 10000,
        enableHighAccuracy: true
      }, watchPositionCallback).then( (watchId) => {
        watch_id = watchId;
      });
    } else {
      // Location services denied
      DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationDisabled + "\")";
      showLocationDeniedPopup();
    }
  }).catch(() => {
    // Location services disabled
    DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationDisabled + "\")";
    showLocationDisabledPopup();
  });
};

/**
 * Modification du statut de localisation
 */
const enablePosition = async() => {
  DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationLoading + "\")";
  let permissionStatus;
  if (popup) {
    popup.remove();
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
      DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationDisabled + "\")";
      showLocationDisabledPopup();
      return;
    }
  }
  if (["denied", "prompt", "prompt-with-rationale"].includes(permissionStatus.location)) {
    permissionStatus = await Geolocation.requestPermissions(["location"]);
  }
  if (["denied", "prompt-with-rationale"].includes(permissionStatus.location)) {
    // Location services denied
    DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationDisabled + "\")";
    showLocationDeniedPopup();
    return;
  }
  location_active = true;
  if (!currentPosition && localStorage.getItem("lastKnownPosition")) {
    const lastPosition = JSON.parse(localStorage.getItem("lastKnownPosition"));
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
    DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationFollowImg + "\")";
    tracking_active = true;
    Globals.map.setCenter([currentPosition.coords.longitude, currentPosition.coords.latitude]);
    Globals.map.setZoom(16);
    Globals.map.setBearing(-mapBearing);
    DOM.$compassBtn.classList.remove("d-none");
    DOM.$compassBtn.style.transform = "rotate(" + mapBearing + "deg)";
    Toast.show({
      text: "Mode navigation activé",
      duration: "short",
      position: "bottom"
    });
  } else {
    DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationImg + "\")";
    Geolocation.clearWatch({id: watch_id});
    clean();
    currentPosition = null;
    location_active = false;
    tracking_active = false;
    Toast.show({
      text: "Navigation et suivi de position désactivés",
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
  if (tracking_active) {
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
    position = await Geolocation.getCurrentPosition({
      maximumAge: 0,
      timeout: 3000,
    });
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
  DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationFixeImg + "\")";
  tracking_active = false;
  Toast.show({
    text: "Suivi de position activé",
    duration: "short",
    position: "bottom"
  });
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
  // on supprime la popup
  if (popup) {
    popup.remove();
  }

  // template litteral
  const popupContent = content;
  window.onCloselocationPopup = () => {
    popup.remove();
  };

  // centre de la carte
  var center = Globals.map.getCenter();
  // position de la popup
  var popupOffsets = {
    "bottom": [0, 100],
  };
  if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches && Capacitor.getPlatform() === "ios") {
    popupOffsets = {
      "bottom": [200, 100],
    };
  }
  // ouverture d'une popup
  popup = new MapLibreGL.Popup({
    offset: popupOffsets,
    className: "locationPopup",
    closeOnClick: true,
    closeOnMove: true,
    closeButton: false
  })
    .setLngLat(center)
    .setHTML(popupContent)
    .setMaxWidth("300px")
    .addTo(Globals.map);
};

const isLocationActive = () => {
  return location_active;
};

const isTrackingActive = () => {
  return tracking_active;
};

const getCurrentPosition = () => {
  return currentPosition;
};

export default {
  target,
  getCurrentPosition,
  isLocationActive,
  isTrackingActive,
  moveTo,
  enablePosition,
  locationOnOff,
  getOrientation,
  getLocation,
  disableTracking,
};

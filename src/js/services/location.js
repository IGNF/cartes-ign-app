import maplibregl from "maplibre-gl";

import DOM from "../dom";
import Globals from "../globals";
import GisUtils from "../utils/gis-utils";

import { Geolocation } from "@capacitor/geolocation";
import { Toast } from "@capacitor/toast";
import { ScreenOrientation } from "@capacitor/screen-orientation";

import Buffer from "@turf/buffer";

// fichiers SVG
import LocationImg from "../../css/assets/map-buttons/localisation.svg";
import LocationFollowImg from "../../css/assets/map-buttons/location-follow.svg";
import LocationFixeImg from "../../css/assets/map-buttons/location-fixed.svg";
import LocationLoading from "../../css/assets/loading-green.svg";

/* Géolocalisation */
// Positionnement du mobile
let location_active = false;

// Suivi de la carte
let tracking_active = false;
let watch_id;
let currentPosition = null;

let animationId = null;

let mapBearing = 0;
let positionBearing = 0;

let positionIsGrey = false;

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
    function animateMarker() {
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
        animationId = requestAnimationFrame(animateMarker);
      }
    }
    animationId = requestAnimationFrame(animateMarker)
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
      Globals.map.flyTo({center: [coords.lon, coords.lat], zoom: zoom, duration: 1000});
    } else {
      Globals.map.flyTo({center: [coords.lon, coords.lat], zoom: zoom});
    }
  }
};

/**
 * Suit la position de l'utilisateur
 */
const trackLocation = () => {
  let lastAccuracy = 100000;
  Geolocation.checkPermissions().then((status) => {
    if (status.location != "denied") {
      var firstLocation = true;
      Geolocation.watchPosition({
        maximumAge: 1000,
        timeout: 10000,
        enableHighAccuracy: true
      },
      (position) => {
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
          if (firstLocation) {
            firstLocation = false;
          }
        }
      }).then( (watchId) => {
        watch_id = watchId;
      }).catch((err) => {
        console.warn(`${err.message}`);
      });
    }
  }).catch(() => {
    console.warn("Location services disabled");
  });
};

/**
 * Modification du statut de localisation
 */
const enablePosition = async(tracking) => {
  DOM.$geolocateBtn.style.backgroundImage = "url(\"" + LocationLoading + "\")";
  let permissionStatus;
  try {
    permissionStatus = await Geolocation.checkPermissions();
  } catch {
    console.warn("Location services disabled");
    return;
  }
  if (permissionStatus.location == "denied") {
    permissionStatus = await Geolocation.requestPermissions(["location"]);
  }
  if (permissionStatus == "denied") {
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
  if (tracking) {
    trackLocation();
    Toast.show({
      text: "Récupération de la géolocalisation...",
      duration: "short",
      position: "bottom"
    });
  }
};

const locationOnOff = async () => {
  if (!location_active) {
    enablePosition(true);
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
  if (Math.abs(mapBearing - event.alpha) < 0.5) {
    return;
  }
  mapBearing = event.alpha;
  let orientation = await ScreenOrientation.orientation();
  if (orientation.type === "landscape-secondary") {
    mapBearing += 90;
  }
  if (orientation.type === "landscape-primary") {
    mapBearing -= 90;
  }
  if (tracking_active) {
    Globals.map.setBearing(-mapBearing);
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
const getLocation = async (tracking) => {
  var results = null;
  var position = currentPosition;
  if (currentPosition === null) {
    enablePosition(tracking);
    position = await Geolocation.getCurrentPosition({
      maximumAge: 0,
      timeout: 10000,
      enableHighAccuracy: true
    });
  }

  results = {
    coordinates : {
      lat: position.coords.latitude,
      lon: position.coords.longitude
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

const isLocationActive = () => {
  return location_active;
};

const isTrackingActive = () => {
  return tracking_active;
};

const getCurrentPosition = () => {
  return currentPosition;
}

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

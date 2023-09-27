import maplibregl from "maplibre-gl";

import DOM from './dom';
import Globals from './globals';

import { Geolocation } from '@capacitor/geolocation';
import { Toast } from '@capacitor/toast';

// fichiers SVG
import LocationImg from "../css/assets/localisation.svg";
import LocationFollowImg from "../css/assets/location-follow.svg";
import LocationFixeImg from "../css/assets/location-fixed.svg";

const map = Globals.map;

/* Géolocalisation */
// Positionnement du mobile
let location_active = false;

// Suivi de la carte
let tracking_active = false;
let watch_id;

let positionBearing = 0

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
}

/**
 * Modifie la rotation du marqueur GPS
 * @param {*} positionBearing
 */
const setMarkerRotation = (positionBearing) => {
  if (Globals.myPositionMarker) {
    Globals.myPositionMarker.setRotation(positionBearing);
  }
}

/**
 * Ajoute un marqueur de type GPS à la position définie par le coods,
 * et déplace la carte au zoom demandé si panTo est True
 * @param {*} coords
 * @param {*} zoom
 * @param {*} panTo
 * @param {*} gps - choix du type d'icone, GPS par defaut
 */
const moveTo = (coords, zoom=map.getZoom(), panTo=true, gps=true) => {
  // si l'icone est en mode gps, on ne reconstruit pas le marker
  // mais, on met à jour la position !
  if (Globals.myPositionMarker !== null && gps) {
    Globals.myPositionMarker.setLngLat([coords.lon, coords.lat]);
  } else {
    // on reconstruit le marker
    if (Globals.myPositionMarker !== null) {
      Globals.myPositionMarker.remove();
      Globals.myPositionMarker = null;
    }
    Globals.myPositionMarker = new maplibregl.Marker({element: (gps) ? Globals.myPositionIcon : Globals.searchResultIcon})
      .setLngLat([coords.lon, coords.lat])
      .addTo(map);
    Globals.myPositionMarker.setRotationAlignment("map");
  }

  setMarkerRotation(positionBearing);

  if (panTo) {
    Globals.movedFromCode = true;
    map.setCenter([coords.lon, coords.lat]);
    map.setZoom(zoom);
    Globals.movedFromCode = false;
  }
}

/**
 * Suit la position de l'utilisateur
 */
const trackLocation = () => {
  Geolocation.checkPermissions().then((status) => {
    if (status.location != 'denied') {
      Geolocation.getCurrentPosition({
        maximumAge: 0,
        timeout: 10000,
        enableHighAccuracy: true
      }).then((position) => {
        moveTo({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, Math.max(map.getZoom(), 14));
      }).catch((err) => {
        console.warn(`${err.message}`);
      });

      Geolocation.watchPosition({
        maximumAge: 0,
        timeout: 10000,
        enableHighAccuracy: true
      },
      (position) => {
        moveTo({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, map.getZoom(), tracking_active);
      }).then( (watchId) => {
        watch_id = watchId
      }).catch((err) => {
        console.warn(`${err.message}`);
      });
    }
  }).catch(() => {
    console.warn("Location services disabled")
  });
}

/**
 * Modification du statut de localisation
 */
const enablePosition = async() => {
  DOM.$geolocateBtn.style.backgroundImage = 'url("' + LocationFixeImg + '")';
  let permissionStatus;
  try {
    permissionStatus = await Geolocation.checkPermissions();
  } catch {
    console.warn("Location services disabled");
    return
  }
  if (permissionStatus.location == "denied") {
    permissionStatus = await Geolocation.requestPermissions(["location"]);
  }
  if (permissionStatus == "denied") {
    return
  }
  trackLocation();
  location_active = true;
  Toast.show({
    text: "Suivi de position activé",
    duration: "short",
    position: "bottom"
  });
}

const locationOnOff = async () => {
  if (!location_active) {
    enablePosition();
  } else if (!tracking_active) {
    DOM.$geolocateBtn.style.backgroundImage = 'url("' + LocationFollowImg + '")';
    tracking_active = true;
    Toast.show({
      text: "Mode navigation activé",
      duration: "short",
      position: "bottom"
    });
  } else {
    DOM.$geolocateBtn.style.backgroundImage = 'url("' + LocationImg + '")';
    Geolocation.clearWatch(watch_id);
    clean();
    location_active = false;
    tracking_active = false;
    Toast.show({
      text: "Navigation et suivi de position désactivés",
      duration: "short",
      position: "bottom"
    });
  }
}

/**
 * ...
 * @param {*} event
 */
const getOrientation = (event) => {
  Globals.movedFromCode = true;
  if (tracking_active) {
    map.setBearing(-event.alpha);
    DOM.$compassBtn.classList.remove("d-none");
    DOM.$compassBtn.style.transform = "rotate(" + event.alpha + "deg)";
  }
  positionBearing = Number(Number(360 - event.alpha).toFixed(1));
  if (Globals.myPositionMarker) {
    setMarkerRotation(positionBearing);
  }
  Globals.movedFromCode = false;
}

/**
 * ...
 * @returns
 * @fire geolocation
 */
const getLocation = async () => {
  var results = null;
  enablePosition();
  var position = await Geolocation.getCurrentPosition({
    maximumAge: 0,
    timeout: 10000,
    enableHighAccuracy: true
  })

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
}

export default {
  target,
  location_active,
  tracking_active,
  moveTo,
  enablePosition,
  locationOnOff,
  getOrientation,
  getLocation,
}

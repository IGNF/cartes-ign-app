import DOM from './dom';
import Globals from './globals';

import { Geolocation } from '@capacitor/geolocation';
import { Toast } from '@capacitor/toast';

const map = Globals.map;

/* Géolocalisation */
// Positionnement du mobile
let location_active = false;
// Suivi de la carte
let tracking_active = false;
let watch_id;

let positionBearing = 0

function cleanGPS() {
  /**
   * Enlève le marqueur GPS
   */
  if (Globals.myPositionMarker != null) {
    Globals.myPositionMarker.remove();
    Globals.myPositionMarker = null;
  }
}

function setMarkerRotation(positionBearing) {
  if (Globals.myPositionMarker) {
    Globals.myPositionMarker.setRotation(positionBearing);
  }
}

function _goToGPSCoords(coords, zoom=map.getZoom(), panTo=true) {
  /**
   * Ajoute un marqueur de type GPS à la position définie par le coods, et déplace la carte au zoom demandé
   * si panTo est True
   */
  cleanGPS();
  Globals.myPositionMarker = new maplibregl.Marker({element: Globals.myPositionIcon})
    .setLngLat([coords.lon, coords.lat])
    .addTo(map);
  Globals.myPositionMarker.setRotationAlignment("map");

  setMarkerRotation(positionBearing);

  if (panTo) {
    Globals.movedFromCode = true;
    map.setCenter([coords.lon, coords.lat]);
    map.setZoom(zoom);
    Globals.movedFromCode = false;
  }
}

function _trackLocation() {
  /**
   * Suit la position de l'utilisateur
   */
  Geolocation.checkPermissions().then((status) => {
    if (status.location != 'denied') {
      Geolocation.getCurrentPosition({
        maximumAge: 0,
        timeout: 10000,
        enableHighAccuracy: true
      }).then((position) => {
        _goToGPSCoords({
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
        _goToGPSCoords({
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

// Modification du statut de localisation
async function locationOnOff() {
  if (!location_active) {
    DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/location-fixed.svg")';
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
    _trackLocation();
    location_active = true;
    Toast.show({
      text: "Suivi de position activé",
      duration: "short",
      position: "bottom"
    });
  } else if (!tracking_active) {
    DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/location-follow.svg")';
    tracking_active = true;
    Toast.show({
      text: "Mode navigation activé",
      duration: "short",
      position: "bottom"
    });
  } else {
    DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/localisation.svg")';
    Geolocation.clearWatch(watch_id);
    location_active = false;
    tracking_active = false;
    Toast.show({
      text: "Navigation et suivi de position désactivés",
      duration: "short",
      position: "bottom"
    });
  }
}

function getOrientation(event) {
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


export default {
  locationOnOff,
  tracking_active,
  getOrientation,
}

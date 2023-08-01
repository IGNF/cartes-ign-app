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
let positionMarker;

function cleanGPS() {
  /**
   * Enlève le marqueur GPS
   */
  if (Globals.gpsMarkerLayer != null) {
    map.removeLayer(Globals.gpsMarkerLayer);
    Globals.gpsMarkerLayer = null;
  }
}

function _goToGPSCoords(coords, zoom=map.getZoom(), panTo=true) {
  /**
   * Ajoute un marqueur de type GPS à la position définie par le coods, et déplace la carte au zoom demandé
   * si panTo est True
   */
  cleanGPS();
  Globals.gpsMarkerLayer = L.featureGroup().addTo(map);
  positionMarker = L.rotatedMarker(
    [coords.lat, coords.lon],
    {
      icon:	Globals.gpMarkerIcon,
    }
  )
  positionMarker.setRotationAngle(Globals.positionBearing);
  let markerLayer = L.featureGroup([positionMarker]);
  Globals.gpsMarkerLayer.addLayer(markerLayer);
  if (panTo) {
    Globals.movedFromCode = true;
    if (Globals.currentRotation !== 0){
      map.setBearing(0);
      map.setView(new L.LatLng(coords.lat, coords.lon), zoom, {animate: false});
      map.setBearing(Globals.currentRotation);
    } else {
      map.setView(new L.LatLng(coords.lat, coords.lon), zoom);
    }
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
        maximumAge: 1500000,
        timeout: 100000,
        enableHighAccuracy: true
      }).then((position) => {
        _goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, Math.max(map.getZoom(), 14));
      }).catch((err) => {
        console.warn(`ERROR(DOM.${err.code}): DOM.${err.message}`);
      });

      watch_id = Geolocation.watchPosition({
        maximumAge: 1500000,
        timeout: 100000,
        enableHighAccuracy: true
      }).then((position) => {
        _goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, map.getZoom(), tracking_active);
      }).catch((err) => {
        console.warn(`ERROR(DOM.${err.code}): DOM.${err.message}`);
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
  if (tracking_active) {
    Globals.currentRotation = event.alpha;
    Globals.map.setBearing(event.alpha);
    DOM.$compassBtn.classList.remove("d-none");
    DOM.$compassBtn.style.transform = "rotate(" + event.alpha + "deg)";
  }
  Globals.positionBearing = Number(Number(360 - event.alpha).toFixed(1)) + Globals.currentRotation;
  if (positionMarker) {
    positionMarker.setRotationAngle(Globals.positionBearing);
  }
}


export {
  cleanGPS,
  locationOnOff,
  location_active,
  tracking_active,
  getOrientation,
  positionMarker,
}

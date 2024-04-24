import DOM from "./dom";
import Globals from "./globals";
import Location from "./services/location";
import Reverse from "./services/reverse";
import State from "./state";
import { Capacitor } from "@capacitor/core";

const addListeners = () => {

  // Bouton Geolocalisation
  DOM.$geolocateBtn.addEventListener("click", () => { Location.locationOnOff(); });
  // HACK: ios
  if (Capacitor.getPlatform() === "ios") {
    DOM.$geolocateBtn.addEventListener("click", () => {
      if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === "granted") {
              window.addEventListener("deviceorientation", Location.getOrientation);
            }
          })
          .catch(console.error);
      }
    });
  }

  // Rotation de la boussole
  DOM.$compassBtn.addEventListener("click", () => {
    const map = Globals.map;
    if (Location.isTrackingActive()){
      // De tracking a simple suivi de position
      Location.disableTracking();
    }
    map.setBearing(Math.round((map.getBearing() % 360) + 360 ) % 360);

    let interval;
    let currentRotation;

    function animateRotate() {
      if (Location.isTrackingActive()) {
        clearInterval(interval);
        DOM.$compassBtn.style.pointerEvents = "";
      }

      if (map.getBearing() < 0) {
        currentRotation = map.getBearing() + 1;

      } else {
        currentRotation = map.getBearing() - 1;
      }

      map.setBearing(Math.round(currentRotation));

      if (currentRotation % 360 == 0) {
        clearInterval(interval);
        DOM.$compassBtn.style.pointerEvents = "";
        DOM.$compassBtn.classList.add("d-none");
      }
    }

    DOM.$compassBtn.style.pointerEvents = "none";
    interval = setInterval(animateRotate, 1);
  });

  // Bouton Comparaison de carte
  DOM.$sideBySideBtn.addEventListener("click", () => { Globals.menu.open("compare"); });

  // Bouton du gestionnaire de couches
  DOM.$layerManagerBtn.addEventListener("click", () => {
    if (Globals.backButtonState.split("-")[0] === "layerManager") {
      DOM.$backTopLeftBtn.click();
    } else {
      Globals.menu.open("layerManager");
    }
  });

  // Bouton des filtres POI
  DOM.$filterPoiBtn.addEventListener("click", () => { Globals.menu.open("poi"); });

  // Bouton d'aide'du tracé d'itinéraire
  DOM.$routeDrawHelp.addEventListener("click", () => { Globals.routeDraw.showHelpPopup(); });

  // Indicateur d'interactivité
  DOM.$interactivityBtn.addEventListener("click", () => { Globals.interactivityIndicator.showPopup(); });

  // Bouton Retour
  DOM.$backTopLeftBtn.addEventListener("click", () => { State.onBackKeyDown(); });

  // Sélection de point via le réticule pour isochrone et directions
  DOM.$mapCenterSubmit.addEventListener("click", () => {
    if (Globals.backButtonState === "selectOnMapIsochrone") {
      Globals.isochrone.onAddWayPoint({lngLat: Globals.map.getCenter()});
      Globals.menu.close("selectOnMapIsochrone");
    } else if (Globals.backButtonState === "selectOnMapDirections") {
      Reverse.compute({
        lon: Globals.map.getCenter().lng,
        lat: Globals.map.getCenter().lat,
      });
      Globals.menu.close("selectOnMapDirections");
    } else if (Globals.backButtonState === "selectOnMapLandmark") {
      Globals.landmark.onAddWayPoint({lngLat: Globals.map.getCenter()});
      Globals.menu.close("selectOnMapLandmark");
    }
  });
};

export default {
  addListeners
};

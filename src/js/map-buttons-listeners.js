import DOM from './dom';
import Globals from './globals';
import Location from './services/location';
import State from './state';

const addListeners = () => {

  // Bouton Geolocalisation
  DOM.$geolocateBtn.addEventListener("click", () => { Location.locationOnOff(); });

  // Rotation de la boussole
  DOM.$compassBtn.addEventListener("click", () => {
    const map = Globals.map;
    if (Location.isTrackingActive()){
      // De tracking a simple suivi de position
      Location.disableTracking();
    }
    map.setBearing(Math.round((map.getBearing() % 360) + 360 ) % 360);

    let interval;
    let currentRotation

    function animateRotate() {
      if (map.getBearing() < 0) {
        currentRotation = map.getBearing() + 1;

      } else {
        currentRotation = map.getBearing() - 1;
      }

      map.setBearing(currentRotation);

      if (currentRotation % 360 == 0) {
        clearInterval(interval);
        DOM.$compassBtn.style.pointerEvents = "";
        DOM.$compassBtn.classList.add("d-none");
      }
    }

    DOM.$compassBtn.style.pointerEvents = "none";
    interval = setInterval(animateRotate, 2);
  });

  // Bouton Comparaison de carte
  DOM.$sideBySideBtn.addEventListener("click", () => { Globals.compare.toggle(); });

  // Bouton du gestionnaire de couches
  DOM.$layerManagerBtn.addEventListener("click", () => { Globals.menu.open("layerManager"); });

  // Bouton des filtres POI
  DOM.$filterPoiBtn.addEventListener("click", () => { Globals.menu.open("poi"); });

  // Bouton de changement de mode du tracé d'itinéraire
  DOM.$routeDrawMode.addEventListener("click", () => { Globals.routeDraw.toggleMode(); });

  // Bouton d'aide'du tracé d'itinéraire
  DOM.$routeDrawHelp.addEventListener("click", () => { Globals.routeDraw.showHelpPopup(); });

  // Bouton de suppression de point du tracé d'itinéraire
  DOM.$routeDrawDelete.addEventListener("click", () => { Globals.routeDraw.toggleDelete(); });

  // Indicateur d'interactivité
  DOM.$interactivityBtn.addEventListener("click", () => { Globals.interactivity.showPopup(); });

  // Bouton Retour
  DOM.$backTopLeftBtn.addEventListener("click", () => { State.onBackKeyDown(); });
}

export default {
  addListeners
};

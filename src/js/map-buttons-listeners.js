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

  // Bouton Retour
  DOM.$backTopLeftBtn.addEventListener("click", () => { State.onBackKeyDown(); });
}

export default {
  addListeners
};
import * as Coords from './coordinates';
import * as EventListeners from './event-listeners';
import * as LayerSwitch from './layer-switch';
import * as Location from './location';
import Globals from './globals';

function app() {
  /**
   * Fonction définissant l'application
   */

  /* Demande d'autorisation au 1er lancement de l'appli */
  if (!localStorage.getItem("firstLocRequestDone")){
    Location.requestLocationAccuracy();
    localStorage.setItem("firstLocRequestDone", true);
  }
  /**/

  /* Définition des marker icons */
  Globals.gpMarkerIcon = L.divIcon({
    iconUrl: cordova.file.applicationDirectory + 'www/css/assets/position.svg',
    html: '<img class="gpsMarker" id="markerRotate" src="' + cordova.file.applicationDirectory + 'www/css/assets/position.svg"></img>',
    iconSize:     [51, 51], // size of the icon
    iconAnchor:   [26, 26], // point of the icon which will correspond to marker's location
    className:    'gpsMarker',
  });

  Globals.gpMarkerIcon2 = L.icon({
    iconUrl: cordova.file.applicationDirectory + 'www/css/assets/map-center.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'adressMarker',
  });
  /**/

  /* Récupération de la carte */
  const map = Globals.map;
  // Ajout de l'échelle
  L.control.scale({
    imperial: false,
    maxWidth: 150,
    position: "topleft",
  }).addTo(map);

  // Chargement de la postition précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }
  // Initialisation des coordonnées du centre
  Coords.updateCenterCoords(map.getCenter());

  // Chargement de la couche précédente
  switch (Globals.layerDisplayed) {
    case 'photos':
      LayerSwitch.displayOrtho();
      break;
    case 'routes':
      LayerSwitch.displayOrthoAndRoads();
      break;
    case 'cadastre':
      LayerSwitch.displayOrthoAndParcels();
      break;
    case 'plan-ign':
      LayerSwitch.displayPlan();
      break;
    case 'cartes':
      LayerSwitch.displayCartes();
      break;
    case 'drones':
      LayerSwitch.displayDrones();
      break;
    case 'topo':
      LayerSwitch.displayTopo();
      break;
    case 'etat-major':
      LayerSwitch.displayEtatMajor();
      break;
    case 'ortho-histo':
      LayerSwitch.displayOrthoHisto();
      break;
  }
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  /**/

  // Ajout des event listeners
  EventListeners.addEventListeners();
}

document.addEventListener('deviceready', () => {
  app();
});

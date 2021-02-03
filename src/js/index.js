import * as Coords from './coordinates';
import * as EventListeners from './event-listeners';
import * as LayerSwitch from './layer-switch';
import * as Location from './location';
import DOM from './dom';
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

  /* Message du jour (message of the day) */
  const motd_url = 'https://www.geoportail.gouv.fr/depot/app/motd.json?v=2';
  fetch(motd_url, {mode: 'cors'}).then( response => {
    response.json().then( data => {
      DOM.$message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
      Globals.motd_id = data.id;
    }).then( () => {
      if (!localStorage.getItem("lastMotdID") || (localStorage.getItem("lastMotdID") && (localStorage.getItem("lastMotdID") < Globals.motd_id))) {
        if(DOM.$message.innerHTML !== '') {
          DOM.$startPopup.classList.remove('d-none');
        }
      }
    });
  });
  /**/

  /* Définition des marker icons */
  Globals.gpMarkerIcon = L.icon({
    iconUrl: cordova.file.applicationDirectory + 'www/css/assets/position.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
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
    position: "bottomleft",
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
  /**/

  // Ajout des event listeners
  EventListeners.addEventListeners();
}

document.addEventListener('deviceready', () => {
  app();
});

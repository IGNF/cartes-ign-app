import * as Coords from './coordinates';
import * as EventListeners from './event-listeners';
import * as LayerSwitch from './layer-switch';
import * as Location from './location';
import Globals from './globals';
import * as MapControls from './map-controls';

function app() {
  /**
   * Fonction définissant l'application
   */

  /* Définition des marker icons */
  Globals.gpMarkerIcon = L.divIcon({
    iconUrl: 'css/assets/position.svg',
    html: '<img class="gpsMarker" id="markerRotate" src="css/assets/position.svg"></img>',
    iconSize:     [51, 51], // size of the icon
    iconAnchor:   [26, 26], // point of the icon which will correspond to marker's location
    className:    'gpsMarker',
  });

  Globals.gpMarkerIcon2 = L.icon({
    iconUrl: 'css/assets/map-center.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'adressMarker',
  });
  /**/

  /* Récupération de la carte */
  const map = Globals.map;
  Globals.baseLayer = L.layerGroup([]).setZIndex(0).addTo(map);
  Globals.compareLayer = L.layerGroup([]).setZIndex(0).addTo(map);
  Globals.dataLayers = L.layerGroup([]).setZIndex(1).addTo(map);
  // Ajout des contrôles
  MapControls.addMapControls();

  // Chargement de la postition précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }
  // Initialisation des coordonnées du centre
  Coords.updateCenterCoords(map.getCenter());

  // Chargement de la couche précédente
  LayerSwitch.displayBaseLayer(Globals.baseLayerDisplayed);
  LayerSwitch.displayDataLayer(Globals.dataLayerDisplayed, true);

  Globals.ignoreNextScrollEvent = true;
  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  Globals.currentScrollIndex = 0;
  /**/

  // Ajout des event listeners
  EventListeners.addEventListeners();
}

document.addEventListener('deviceready', () => {
  app();
});

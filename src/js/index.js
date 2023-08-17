import * as Coords from './coordinates';
import * as EventListeners from './event-listeners';
import * as LayerSwitch from './layer-switch';
import Layers from './layers';
import Globals from './globals';
import * as MapControls from './map-controls';

function app() {
  /**
   * Fonction définissant l'application
   */

  /* Définition des marker icons */
  // REMOVEME
  Globals.gpMarkerIcon = L.divIcon({
    iconUrl: 'css/assets/position.svg',
    html: '<img class="gpsMarker" id="markerRotate" src="css/assets/position.svg"></img>',
    iconSize:     [51, 51], // size of the icon
    iconAnchor:   [26, 26], // point of the icon which will correspond to marker's location
    className:    'gpsMarker',
  });

  // REMOVEME
  Globals.gpMarkerIcon2 = L.icon({
    iconUrl: 'css/assets/map-center.svg',
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'adressMarker',
  });

  Globals.myPositionIcon = document.createElement('div');
  Globals.myPositionIcon.style.width = '51px';
  Globals.myPositionIcon.style.height = '51px';
  Globals.myPositionIcon.style.backgroundSize = "contain";
  Globals.myPositionIcon.style.backgroundImage = "url(css/assets/position.svg)";

  Globals.searchResultIcon = document.createElement('div');
  Globals.searchResultIcon.style.width = '23px';
  Globals.searchResultIcon.style.height = '23px';
  Globals.searchResultIcon.style.backgroundSize = "contain";
  Globals.searchResultIcon.style.backgroundImage = "url(css/assets/map-center.svg)";
  /**/

  /* Récupération de la carte */
  const map = Globals.map2;

  /* Ajout des soucres à la carte */
  for (let layer in Layers.baseLayerSources) {
    map.addSource(layer, Layers.baseLayerSources[layer]);
  }
  for (let layer in Layers.dataLayerSources) {
    map.addSource(layer, Layers.dataLayerSources[layer]);
  }
  // REMOVEME
  map.addLayer({
    id: "basemap",
    type: "raster",
    source: "plan-ign",
  })

  map.addLayer({
    id: "data-layer",
    type: "background",
    "paint": {
      "background-opacity": 0,
    }
  })

  // Ajout des contrôles
  MapControls.addMapControls();

  // Chargement de la postition précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setCenter([localStorage.getItem("lastMapLng"), localStorage.getItem("lastMapLat")]);
    map.setZoom(localStorage.getItem("lastMapZoom"));
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

app();

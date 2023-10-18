import MapButtonsListeners from './map-buttons-listeners';
import MapListeners from './map-listeners';
import EventListeners from './event-listeners';
import LayerSwitch from './layer-thematics';
import Layers from './layer-config';
import Globals from './globals';
import Controls from './controls';
import RecentSearch from "./search-recent";
import MenuNavigation from './nav';

// import CSS
import '@maplibre/maplibre-gl-compare/dist/maplibre-gl-compare.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import '../css/app.scss';

// fichiers SVG
import PositionImg from "../css/assets/position.svg";
import MapCenterImg from "../css/assets/map-center.svg";

/**
 * Fonction définissant l'application
 */
function app() {

  // Définition des icones
  Globals.myPositionIcon = document.createElement('div');
  Globals.myPositionIcon.class = 'myPositionIcon';
  Globals.myPositionIcon.style.width = '51px';
  Globals.myPositionIcon.style.height = '51px';
  Globals.myPositionIcon.style.backgroundSize = "contain";
  Globals.myPositionIcon.style.backgroundImage = "url(" + PositionImg + ")";

  Globals.searchResultIcon = document.createElement('div');
  Globals.searchResultIcon.class = 'searchResultIcon';
  Globals.searchResultIcon.style.width = '23px';
  Globals.searchResultIcon.style.height = '23px';
  Globals.searchResultIcon.style.opacity = '0.8';
  Globals.searchResultIcon.style.backgroundSize = "contain";
  Globals.searchResultIcon.style.backgroundImage = "url(" + MapCenterImg + ")";

  // Récupération de la carte
  const map = Globals.map;
  const mapRLT = Globals.mapRLT;

  // Ajout des sources à la carte
  for (let layer in Layers.baseLayerSources) {
    map.addSource(layer, Layers.baseLayerSources[layer]);
    mapRLT.addSource(layer, Layers.baseLayerSources[layer]);
  }

  for (let layer in Layers.dataLayerSources) {
    map.addSource(layer, Layers.dataLayerSources[layer]);
  }

  // Ajout des couches à la carte
  map.addLayer({
    id: "basemap",
    type: "raster",
    source: "ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS",
  });

  map.addLayer({
    id: "data-layer",
    type: "background",
    "paint": {
      "background-opacity": 0,
    }
  });

  mapRLT.addLayer({
    id: "basemap",
    type: "raster",
    source: "ORTHOIMAGERY.ORTHOPHOTOS$GEOPORTAIL:OGC:WMTS",
  });

  // Chargement de la position précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setCenter([localStorage.getItem("lastMapLng"), localStorage.getItem("lastMapLat")]);
    map.setZoom(localStorage.getItem("lastMapZoom") || map.getZoom());
  }

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

  // Ajout des contrôles
  Controls.addControls();

  // Ajout des ecouteurs des boutons de la carte
  MapButtonsListeners.addListeners();

  // Ajout des ecouteurs de la carte
  MapListeners.addListeners();

  // Ajout d'autres ecouteurs
  EventListeners.addListeners();

  // Ajout des recherches recentes issues du localStorage
  RecentSearch.create();

  // Initialisation du menu de navigation
  Globals.menu = new MenuNavigation();
  Globals.menu.show();

}

app();

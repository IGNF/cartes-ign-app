import maplibregl from "maplibre-gl";

import Globals from './globals';

import MapButtonsListeners from './map-buttons-listeners';
import MapListeners from './map-listeners';
import EventListeners from './event-listeners';
import LayerManager from './layer-manager';
import LayersConfig from './layer-config';
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

  // Main map
  const map = new maplibregl.Map({
    container: "map",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    locale: "fr",
    maxPitch: 0,
    touchPitch: false,
  });
  map.scrollZoom.setWheelZoomRate(1);

  // Secondary map for RLT
  const mapRLT = new maplibregl.Map({
    container: "mapRLT",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    locale: "fr",
    maxPitch: 0,
    touchPitch: false,
  });
  mapRLT.scrollZoom.setWheelZoomRate(1);
  
  // Enregistrement de la carte
  Globals.map = map;
  Globals.mapRLT = mapRLT;
  
  // DEBUG
  window.mapGlobal = map;

  // Ajout des sources definies dans la configuration à la carte
  // (les couches de fonds, de données et thématiques sont pre chargées)
  for (let layer in LayersConfig.baseLayerSources) {
    map.addSource(layer, LayersConfig.baseLayerSources[layer]);
    mapRLT.addSource(layer, LayersConfig.baseLayerSources[layer]);
  }
  for (let layer in LayersConfig.dataLayerSources) {
    map.addSource(layer, LayersConfig.dataLayerSources[layer]);
  }
  for (let layer in LayersConfig.thematicLayerSources) {
    map.addSource(layer, LayersConfig.thematicLayerSources[layer]);
  }

  // Chargement de la position précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setCenter([localStorage.getItem("lastMapLng"), localStorage.getItem("lastMapLat")]);
    map.setZoom(localStorage.getItem("lastMapZoom") || map.getZoom());
  }

  // Chargement des couches
  Globals.manager = new LayerManager({
    layers : [
      {
        layers : Globals.baseLayerDisplayed, 
        type : "base"
      },
      {
        layers : Globals.dataLayerDisplayed, 
        type : "data"
      }
    ]
  });

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

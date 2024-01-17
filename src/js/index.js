import maplibregl from "maplibre-gl";

import Globals from './globals';

import MapButtonsListeners from './map-buttons-listeners';
import MapListeners from './map-listeners';
import EventListeners from './event-listeners';
import LayerManager from './layer-manager/layer-manager';
import LayersConfig from './layer-manager/layer-config';
import Controls from './controls';
import RecentSearch from "./search-recent";
import MenuNavigation from './nav';
import InteractivityIndicator from './map-interactivity/interactivity-indicator';
import { StatusBar, Style } from '@capacitor/status-bar';
// https://github.com/ionic-team/capacitor/issues/2840
import { SafeAreaController } from '@aashu-dubey/capacitor-statusbar-safe-area';
import { NavigationBar } from "@capgo/capacitor-navigation-bar";

import { Capacitor } from '@capacitor/core';

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
  SafeAreaController.injectCSSVariables();
  if (Capacitor.isPluginAvailable("StatusBar")) {
    StatusBar.setOverlaysWebView({ overlay: true });
    StatusBar.setStyle({ style: Style.Light });
  }
  if (Capacitor.getPlatform() === "android") {
    NavigationBar.setNavigationBarColor({color: "#ffffff"});
  }

  // Définition des icones
  Globals.myPositionIcon = document.createElement('div');
  Globals.myPositionIcon.class = 'myPositionIcon';
  Globals.myPositionIcon.style.width = '51px';
  Globals.myPositionIcon.style.height = '51px';
  Globals.myPositionIcon.style.backgroundSize = "contain";
  Globals.myPositionIcon.style.backgroundImage = "url(" + PositionImg + ")";

  Globals.searchResultIcon = document.createElement('div');
  Globals.searchResultIcon.class = 'searchResultIcon';
  Globals.searchResultIcon.style.width = '36px';
  Globals.searchResultIcon.style.height = '36px';
  Globals.searchResultIcon.style.backgroundSize = "contain";
  Globals.searchResultIcon.style.backgroundImage = "url(" + MapCenterImg + ")";

  // Main map
  const map = new maplibregl.Map({
    container: "map",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    maxZoom: 21,
    locale: "fr",
    maxPitch: 0,
    touchPitch: false,
    crossSourceCollisions: false,
  });

  // Secondary maps for RLT
  const mapRLT1 = new maplibregl.Map({
    container: "mapRLT1",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    maxZoom: 21,
    locale: "fr",
    maxPitch: 0,
    touchPitch: false,
  });
  // disable map rotation using right click + drag
  mapRLT1.dragRotate.disable();
  // disable map rotation using touch rotation gesture
  mapRLT1.touchZoomRotate.disableRotation();
  const mapRLT2 = new maplibregl.Map({
    container: "mapRLT2",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    maxZoom: 21,
    locale: "fr",
    maxPitch: 0,
    touchPitch: false,
  });
  // disable map rotation using right click + drag
  mapRLT2.dragRotate.disable();
  // disable map rotation using touch rotation gesture
  mapRLT2.touchZoomRotate.disableRotation();

  // Enregistrement de la carte
  Globals.map = map;
  Globals.mapRLT1 = mapRLT1;
  Globals.mapRLT2 = mapRLT2;

  // DEBUG
  window.mapGlobal = map;

  window.scroll({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
  Globals.currentScrollIndex = 0;

  // Ajout des contrôles
  Controls.addControls();

  // HACK: déplacement de l'échelle hors de la div map pour qu'elle bouge librement
  var mapLibreControls = document.querySelectorAll(".maplibregl-control-container")[2];
  var parent = document.getElementById("bottomButtons");
  parent.appendChild(mapLibreControls);

  // Ajout des ecouteurs des boutons de la carte
  MapButtonsListeners.addListeners();

  // Ajout des ecouteurs de la carte
  MapListeners.addListeners();

  // Ajout d'autres ecouteurs
  EventListeners.addListeners();

  // Ajout des recherches recentes issues du localStorage
  RecentSearch.create();

  // Ajout des sources definies dans la configuration à la carte
  // (les couches de fonds, rlt et thématiques sont pre chargées)
  // Les sources des couches tuiles vectorielles ne sont pas pré chargées
  // car on ne connait pas la liste des sources disponible dans le fichier de style.
  for (let layer in LayersConfig.baseLayerSources) {
    var source = LayersConfig.baseLayerSources[layer];
    if (source.type !== "vector") {
      map.addSource(layer, source);
    }
  }
  for (let layer in LayersConfig.rltLayerSources) {
    var source = LayersConfig.rltLayerSources[layer];
    if (source.type !== "vector") {
      mapRLT1.addSource(layer, source);
      mapRLT2.addSource(layer, source);
    }
  }
  for (let layer in LayersConfig.thematicLayerSources) {
    var source = LayersConfig.thematicLayerSources[layer];
    if (source.type !== "vector") {
      map.addSource(layer, source);
    }
  }

  // Chargement de la position précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setCenter([localStorage.getItem("lastMapLng"), localStorage.getItem("lastMapLat")]);
    map.setZoom(localStorage.getItem("lastMapZoom") || map.getZoom());
  }

  // Chargement des couches par defaut dans le localStorage
  Globals.manager = new LayerManager({
    layers : Globals.layersDisplayed,
  });

  // INFO
  // Indicateur d'activité du Plan IGN interactif sur la carte
  // (il doit être placé après le LayerManager afin de connaitre les couches ajoputées par défaut !)
  Globals.interactivityIndicator = new InteractivityIndicator(map, {});

  // Initialisation du menu de navigation
  Globals.menu = new MenuNavigation();
  Globals.menu.show();
  // HACK: Nécessaire pour iOS qui ne met pas à jour la taille de l'écran au lancement...
  setTimeout(() => Globals.map.resize(), 100);
}

app();

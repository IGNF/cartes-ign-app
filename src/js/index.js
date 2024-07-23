/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";

import Globals from "./globals";

import MapButtonsListeners from "./map-buttons-listeners";
import MapListeners from "./map-listeners";
import EventListeners from "./event-listeners";
import LayerManager from "./layer-manager/layer-manager";
import LayersConfig from "./layer-manager/layer-config";
import Controls from "./controls";
import RecentSearch from "./search-recent";
import MenuNavigation from "./nav";
import InteractivityIndicator from "./map-interactivity/interactivity-indicator";
import StatusPopups from "./status-popups";

import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SafeArea, SafeAreaController } from "@aashu-dubey/capacitor-statusbar-safe-area";
import { TextZoom } from "@capacitor/text-zoom";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";

// import CSS
import "@maplibre/maplibre-gl-compare/dist/maplibre-gl-compare.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "../css/app.scss";

// fichiers SVG
import PositionImg from "../css/assets/position.svg";
import PositionImgGrey from "../css/assets/position-grey.svg";
import MapCenterImg from "../css/assets/map-center.svg";

// Affichage des éléments PWA en mode WE (Toast et ActionSheet)
import { defineCustomElements } from "@ionic/pwa-elements/loader";
defineCustomElements(window);

/**
 * Fonction définissant l'application
 */
function app() {
  // Ecouteur sur le chargement total des contrôles
  window.addEventListener("controlsloaded", async () => {
    SplashScreen.hide();
    App.getLaunchUrl().then( (url) => {
      if (url.url) {
        if (url.url.split("://")[0] === "https") {
          const urlParams = new URLSearchParams(url.url.split("?")[1]);
          if (urlParams.get("lng") && urlParams.get("lat")) {
            const center = { lng: parseFloat(urlParams.get("lng")), lat: parseFloat(urlParams.get("lat")) };
            map.setCenter(center);
            map.setZoom(parseFloat(urlParams.get("z")) || map.getZoom());
            Globals.position.compute({ lngLat: center }).then(() => {
              Globals.menu.open("position");
            });
            if (Globals.searchResultMarker != null) {
              Globals.searchResultMarker.remove();
              Globals.searchResultMarker = null;
            }
            Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
              .setLngLat(center)
              .addTo(map);
            map.once("moveend", () => {
              StatusPopups.getNetworkPopup(map);
              StatusPopups.getEditoPopup(map);
            });
          }
        }
      }
    });
    // INFO: BUG https://github.com/ionic-team/capacitor-plugins/issues/1160
    setTimeout( async () => {
      SafeAreaController.injectCSSVariables();
      if (Capacitor.isPluginAvailable("StatusBar")) {
        const info = await Device.getInfo();
        if (!(info.platform === "android" && info.androidSDKVersion < 29)) {
          StatusBar.setOverlaysWebView({ overlay: true });
        }
        StatusBar.setStyle({ style: Style.Light });
      }
      SafeArea.getStatusBarHeight().then(({ height }) => {
        let difference;
        ScreenOrientation.orientation().then((orientation) => {
          if (orientation.type.split("-")[0] === "landscape") {
            difference = screen.width - window.innerWidth;
          } else {
            difference = screen.height - window.innerHeight - height;
            if (difference < 0) {
              difference += 50;
            }
          }
          difference = Math.max(difference, 0);
          document.documentElement.style.setProperty("--nav-bar-height", difference + "px");
        });
      });
    }, 500);
    if (Capacitor.getPlatform() !== "web") {
      TextZoom.getPreferred().then(value => {
        TextZoom.set({
          value: Math.min(1.5, value.value)
        });
      });
    }
    if (!localStorage.getItem("hasBeenLaunched")) {
      document.getElementById("geolocateBtn").click();
      localStorage.setItem("hasBeenLaunched", true);
    }
  });

  // Définition des icones
  Globals.myPositionIcon = document.createElement("div");
  Globals.myPositionIcon.class = "myPositionIcon";
  Globals.myPositionIcon.style.width = "51px";
  Globals.myPositionIcon.style.height = "51px";
  Globals.myPositionIcon.style.backgroundSize = "contain";
  Globals.myPositionIcon.style.backgroundImage = "url(" + PositionImg + ")";

  Globals.myPositionIconGrey = document.createElement("div");
  Globals.myPositionIconGrey.class = "myPositionIconGrey";
  Globals.myPositionIconGrey.style.width = "51px";
  Globals.myPositionIconGrey.style.height = "51px";
  Globals.myPositionIconGrey.style.backgroundSize = "contain";
  Globals.myPositionIconGrey.style.backgroundImage = "url(" + PositionImgGrey + ")";

  Globals.searchResultIcon = document.createElement("div");
  Globals.searchResultIcon.class = "searchResultIcon";
  Globals.searchResultIcon.style.width = "36px";
  Globals.searchResultIcon.style.height = "36px";
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

  window.scroll({
    top: 0,
    left: 0,
    behavior: "smooth"
  });
  Globals.currentScrollIndex = 0;

  // Ajout d'autres ecouteurs
  EventListeners.addListeners();

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
    source = LayersConfig.rltLayerSources[layer];
    if (source.type !== "vector") {
      mapRLT1.addSource(layer, source);
      mapRLT2.addSource(layer, source);
    }
  }
  for (let layer in LayersConfig.thematicLayerSources) {
    source = LayersConfig.thematicLayerSources[layer];
    if (source.type !== "vector") {
      map.addSource(layer, source);
    }
  }

  // Ajout de la source pour le cercle de précision
  map.addSource("location-precision", {
    "type": "geojson",
    "data": {
      "type": "FeatureCollection",
      "features": []
    },
  });

  // Chargement de la position précédente
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setCenter([localStorage.getItem("lastMapLng"), localStorage.getItem("lastMapLat")]);
    map.setZoom(localStorage.getItem("lastMapZoom") || map.getZoom());
    map.once("moveend", () => {
      StatusPopups.getNetworkPopup(map);
      StatusPopups.getEditoPopup(map);
    });
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
  if (Capacitor.getPlatform() === "ios") {
    map.once("load", () => {
      Globals.map.resize();
      map.once("moveend", () => {
        StatusPopups.getNetworkPopup(map);
        StatusPopups.getEditoPopup(map);
      });
    });
  }
  setTimeout(() => {
    if (!Globals.mapLoaded) {
      map.flyTo(map.getCenter());
      map.once("moveend", () => {
        StatusPopups.getNetworkPopup(map);
      });
    }
    setTimeout(() => {
      if (!Globals.mapLoaded) {
        SplashScreen.hide();
        StatusPopups.getEditoPopup(map);
      }
    }, 2000);
  }, 4000);
}

app();

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
import DOM from "./dom";

import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SafeAreaController } from "@aashu-dubey/capacitor-statusbar-safe-area";
import { TextZoom } from "@capacitor/text-zoom";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { Toast } from "@capacitor/toast";

import { Protocol } from "pmtiles";
import PinchZoom from "pinch-zoom-js";

// import CSS
import "@maplibre/maplibre-gl-compare/dist/maplibre-gl-compare.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "../css/app.scss";

// Affichage des éléments PWA en mode WE (Toast et ActionSheet)
import { defineCustomElements } from "@ionic/pwa-elements/loader";
defineCustomElements(window);

/**
 * Fonction définissant l'application
 */
function app() {
  // REMOVEME : rétrocompatibilité des itinéraires / PR / PR comparer : migration du localStorage vers Preferences
  if (localStorage.getItem("savedRoutes")) {
    Preferences.set({
      key: "savedRoutes",
      value: localStorage.getItem("savedRoutes"),
    }).then( () => {
      localStorage.removeItem("savedRoutes");
    });
  }

  if (localStorage.getItem("savedLandmarks")) {
    Preferences.set({
      key: "savedLandmarks",
      value: localStorage.getItem("savedLandmarks"),
    }).then( () => {
      localStorage.removeItem("savedLandmarks");
    });
  }

  if (localStorage.getItem("savedCompareLandmarks")) {
    Preferences.set({
      key: "savedCompareLandmarks",
      value: localStorage.getItem("savedCompareLandmarks"),
    }).then( () => {
      localStorage.removeItem("savedCompareLandmarks");
    });
  }
  // END REMOVEME

  // Ajout du protocole PM Tiles
  let protocol = new Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  // Ecouteur sur le chargement total des contrôles
  window.addEventListener("controlsloaded", async () => {
    // Ajout d'autres ecouteurs
    EventListeners.addListeners();
    SplashScreen.hide();
    StatusPopups.getNetworkPopup(map);
    StatusPopups.getEditoPopup(map);
    StatusPopups.getGpfStatusPopup(map);
    App.getLaunchUrl().then( (url) => {
      if (url && url.url) {
        if (url.url.split("://")[0] === "https") {
          const urlParams = new URLSearchParams(url.url.split("?")[1]);
          if (urlParams.get("lng") && urlParams.get("lat")) {
            const center = { lng: parseFloat(urlParams.get("lng")), lat: parseFloat(urlParams.get("lat")) };
            const zoom = parseFloat(urlParams.get("z")) || map.getZoom();
            map.setCenter(center);
            map.setZoom(zoom);
            if (urlParams.get("l1") && urlParams.get("l2") && urlParams.get("m") && urlParams.get("title") && urlParams.get("color")) {
              const feature = {
                type: "Feature",
                id: -1,
                geometry: {
                  type: "Point",
                  coordinates: [center.lng, center.lat],
                },
                properties: {
                  accroche: urlParams.get("title").replace(/%20/g, " "),
                  theme: urlParams.get("title").replace(/%20/g, " "),
                  text: urlParams.get("text").replace(/%20/g, " "),
                  zoom: zoom,
                  color: urlParams.get("color"),
                  icon: `compare-landmark-${urlParams.get("color")}`,
                  layer1: urlParams.get("l1"),
                  layer2: urlParams.get("l2"),
                  mode: urlParams.get("m"),
                  visible: true,
                }
              };
              Globals.myaccount.addCompareLandmark(feature);
              Toast.show({
                duration: "long",
                text: `Point de repère Comparer "${urlParams.get("title").replace(/%20/g, " ")}" ajouté à 'Enregistrés' et à la carte`,
                position: "bottom",
              });
            } else {
              map.once("moveend", () => {
                const params = { lngLat: center };
                if (urlParams.get("titre")) {
                  params.text = urlParams.get("titre").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
                  if (urlParams.get("description")) {
                    params.html = `<p>${urlParams.get("description").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;")}</p>`;
                  }
                }
                Globals.position.compute(params).then(() => {
                  Globals.menu.open("position");
                });
                if (Globals.searchResultMarker != null) {
                  Globals.searchResultMarker.remove();
                  Globals.searchResultMarker = null;
                }
                Globals.searchResultMarker = new maplibregl.Marker({element: Globals.searchResultIcon, anchor: "bottom"})
                  .setLngLat(center)
                  .addTo(map);
              });
            }
          } else if (urlParams.get("newsid")) {
            if (!document.querySelector("#newsfeed").classList.contains("d-none")) {
              Globals.menu.open("newsfeed");
              const element = document.getElementById("newsfeedItem-" + urlParams.get("newsid"));
              if (element) {
                setTimeout( () => {
                  element.scrollIntoView(false, {
                    behavior: "smooth",
                  });
                }, 2000);
              }
            }
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
    }, 500);
    if (Capacitor.isNativePlatform()) {
      TextZoom.getPreferred().then(value => {
        const newValue = Math.min(1.5, value.value);
        TextZoom.set({
          value: newValue
        });
        document.documentElement.style.fontSize = `calc(13px * ${newValue})`;
        document.documentElement.style.setProperty("--text-zoom", newValue);
      });
    }
    if (!localStorage.getItem("hasBeenLaunched")) {
      document.getElementById("geolocateBtn").click();
      localStorage.setItem("hasBeenLaunched", true);
    }
    const tempLayers = LayersConfig.getTempLayers();
    if (tempLayers.length > 0) {
      const layers = tempLayers;
      let tempOnboarding = false;
      for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        if (layer.onBoardingCfg) {
          StatusPopups.getOnboardingModal(layer.id, layer.onBoardingCfg.html);
          tempOnboarding = true;
          break;
        }
      }
      if (!tempOnboarding) {
        StatusPopups.getOnboardingModal();
      }
    } else {
      StatusPopups.getOnboardingModal();
    }

    // Pour charger un fichier partagé depuis une autre app au démarrage de l'appli
    if (Capacitor.getPlatform() === "android") {
      if (window.AndroidInterface && window.AndroidInterface.getSharedFileUrl) {
        window.dispatchEvent(new CustomEvent("sendIntentReceived", {detail: {url: window.AndroidInterface.getSharedFileUrl()}}));
      }
    }

    // Mise en place du bouton évènements
    if (tempLayers.length > 0) {
      let layer;
      for (let i = 0; i < tempLayers.length; i++) {
        layer = tempLayers[i];
        if (layer.mainScreenBtn) {
          break;
        }
      }
      if (layer.mainScreenBtn) {
        const eventButton = document.getElementById("eventMapBtn");
        eventButton.classList.remove("d-none");
        eventButton.title = layer.mainScreenBtn.title;
        eventButton.style.backgroundImage = `url(${layer.mainScreenBtn.iconUrl})`;
        eventButton.addEventListener("click", () => {
          document.querySelector(`#${layer.id}`).click();
        });
      }
      if (layer.colors) {
        document.documentElement.style.setProperty("--event-main", layer.colors.main);
        document.documentElement.style.setProperty("--event-light", layer.colors.light);
        document.documentElement.style.setProperty("--event-dark", layer.colors.dark);
      }
    }
  });

  // Définition des icones
  Globals.myPositionIcon = document.createElement("div");
  Globals.myPositionIcon.className = "myPositionIcon";

  Globals.myPositionIconGrey = document.createElement("div");
  Globals.myPositionIconGrey.className = "myPositionIconGrey";

  Globals.searchResultIcon = document.createElement("div");
  Globals.searchResultIcon.className = "searchResultIcon";

  // Main map
  const map = new maplibregl.Map({
    container: "map",
    zoom: 5,
    center: [2.0, 47.33],
    attributionControl: false,
    maxZoom: 21,
    locale: "fr",
    maxPitch: 60,
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

  // Ajout des contrôles
  Controls.addControls();

  // HACK: déplacement de l'échelle hors de la div map pour qu'elle bouge librement
  var mapLibreControls = document.querySelectorAll(".maplibregl-ctrl-bottom-left")[2];
  var mapLibreFullscreenControl = document.querySelectorAll(".maplibregl-ctrl-bottom-right")[2];
  var parent = document.getElementById("bottomButtons");
  DOM.$mapScale = mapLibreControls;
  parent.appendChild(mapLibreControls);
  parent.appendChild(mapLibreFullscreenControl);

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
  for (let layer in LayersConfig.tempLayerSources) {
    source = LayersConfig.tempLayerSources[layer];
    map.addSource(layer, source);

    const imageUrl = LayersConfig.getTempLayers().filter((config) => config.id === layer)[0].iconUrl;
    map.loadImage(imageUrl).then((image) => {
      map.addImage(layer, image.data);
    });
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
  }

  // Chargement des couches par defaut dans le localStorage
  // En premier lieu : on ne garde que les layers bien présents dans l'appli (peut arriver lors d'un màj si on supprime ou remplace une couche)
  const newLayersDisplayed = [];
  Globals.layersDisplayed.forEach( (layer) => {
    if ((layer.id in LayersConfig.thematicLayerSources) || (layer.id in LayersConfig.baseLayerSources) || (layer.id in LayersConfig.tempLayerSources)) {
      newLayersDisplayed.push(layer);
    }
  });
  if (!newLayersDisplayed.length) {
    newLayersDisplayed.push(
      {
        id: "PLAN.IGN.INTERACTIF$TMS",
        opacity: 100,
        visible: true,
        gray: false,
      }
    );
  }
  Globals.layersDisplayed = newLayersDisplayed;
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
    });
  }
  setTimeout(() => {
    if (!Globals.mapLoaded) {
      map.flyTo(map.getCenter());
      StatusPopups.getNetworkPopup(map);
    }
    setTimeout(() => {
      if (!Globals.mapLoaded) {
        SplashScreen.hide();
        StatusPopups.getEditoPopup(map);
        StatusPopups.getGpfStatusPopup(map);
      }
    }, 2000);
  }, 4000);

  // Pich zoom sur img overlay
  new PinchZoom(document.getElementById("imgOverlayImage"));
}

app();

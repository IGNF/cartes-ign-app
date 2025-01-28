/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import maplibregl from "maplibre-gl";

import Globals from "./globals";
import Directions from "./directions/directions";
import Isochrone from "./isochrone/isochrone";
import Position from "./position";
import Search from "./search";
import Compare from "./compare";
import POI from "./poi";
import RouteDraw from "./route-draw/route-draw";
import MapInteractivity from "./map-interactivity/map-interactivity";
import MyAccount from "./my-account/my-account";
import ComparePoi from "./compare-poi/compare-poi";
import Signalement from "./signalement";
import SignalementOSM from "./signalement-osm";
import Landmark from "./landmark";
import MapboxAccessibility from "./poi-accessibility";
import CompareLandmark from "./compare-landmark";
import OfflineMaps from "./offline-maps";
import DOM from "./dom";

import LocationLayers from "./services/location-styles";

/**
 * Ajout des contrôle à la fin du chargement de la carte
 * @see maplibregl.ScaleControl
 * @see Directions
 * @see Isochrone
 * @see Position
 * @see Compare
 * @see Search
 * @see POI
 * @see RouteDraw
 */
const addControls = () => {
  const map = Globals.map;
  // on ajoute les contrôles à la fin du chargement de la carte
  map.once("load", () => {
    Globals.mapLoaded = true;
    // INFO
    // Le contrôle Directions doit être chargé au debut afin d'y ajouter les filtres
    // qui doivent servir de pivots :
    // > entre ce qui est toujours au dessus et toujours ce qui est en dessous.
    // Ensuite, les POI doivent être chargé avant le contrôle Isochrone car ce composant
    // dépend des POI.

    // contrôle de calcul d'itineraire
    Globals.directions = new Directions(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => { Globals.menu.open("searchDirections"); },
      closeSearchControlCbk : () => { Globals.menu.close("searchDirections"); }
    });

    // contrôle "Où suis-je ?"
    Globals.position = new Position(map, {
      tracking : true, // activation du tracking !
      // callback sur l'ouverture / fermeture du panneau
      openPositionCbk : () => { Globals.menu.open("position"); },
      closePositionCbk : () => { Globals.menu.close("position"); },
      openIsochroneCbk : () => { Globals.menu.open("isochrone", -1, "position"); },
      openDirectionsCbk : () => { Globals.menu.open("directions", -1, "position"); },
      openSignalCbk : () => { Globals.menu.open("signalement", -1, "position"); },
      openSignalOSMCbk : () => { Globals.menu.open("signalementOSM", -1, "position"); },
      openLandmarkCbk : () => { Globals.menu.open("landmark", -1, "position"); },
    });

    // contrôle Recherche
    Globals.search = new Search(map, {
      // callback sur l'ouverture / fermeture du panneau
      openSearchCbk : () => { Globals.menu.open("search"); },
      closeSearchCbk : () => { Globals.menu.close("search"); },
    });

    // contrôle de comparaison de carte
    Globals.compare = new Compare();

    // échelle graphique
    map.addControl(new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric"
    }), "bottom-left");

    Globals.mapRLT1.addControl(new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric"
    }), "bottom-left");

    Globals.mapRLT2.addControl(new maplibregl.ScaleControl({
      maxWidth: 150,
      unit: "metric"
    }), "bottom-left");

    // contrôle fullscreen
    map.addControl(new maplibregl.FullscreenControl(), "top-right");
    DOM.$fullScreenBtn = document.querySelector(".maplibregl-ctrl-top-right > .maplibregl-ctrl");
    DOM.$fullScreenBtn.addEventListener("click", () => {
      setTimeout(() => {
        if (DOM.$fullScreenBtn.querySelector("button").classList.contains("maplibregl-ctrl-shrink")) {
          DOM.$map.appendChild(DOM.$interactivityBtn);
          DOM.$map.appendChild(DOM.$mapScale);
          Globals.interactivityIndicator.hardDisable();
        } else {
          DOM.$map.parentNode.parentNode.appendChild(DOM.$interactivityBtn);
          DOM.$bottomButtons.appendChild(DOM.$mapScale);
          Globals.interactivityIndicator.enable();
        }
      }, 50);
    });

    // contrôle d'intéractivité de la carte
    Globals.mapInteractivity = new MapInteractivity(map, {});

    // contrôle cartes hors ligne
    Globals.offlineMaps = new OfflineMaps(map, {
      // callback sur l'ouverture / fermeture du panneau de recherche
      openSearchControlCbk : () => {
        Globals.menu.close("myaccount");
        Globals.menu.open("searchDownload");
      },
      closeSearchControlCbk : () => {
        Globals.menu.close("searchDownload");
        Globals.menu.open("offlineMaps");
      }
    });

    // compte utilisateur
    Globals.myaccount = new MyAccount(map, {});

    // contrôle tracé d'itinéraire
    Globals.routeDraw = new RouteDraw(map, {});

    // signalement
    Globals.signalement = new Signalement(map, {});
    Globals.signalementOSM = new SignalementOSM(map, {});

    // points de repère
    Globals.landmark = new Landmark(map, {
      // callback sur l'ouverture / fermeture du panneau
      openSearchControlCbk : () => { Globals.menu.open("searchLandmark"); },
      closeSearchControlCbk : () => { Globals.menu.close("searchLandmark"); },
    });
    Globals.compareLandmark = new CompareLandmark(Globals.mapRLT1, Globals.mapRLT2, {});

    // contrôle filtres POI
    Globals.poi = new POI(map, {});
    Globals.poi.load() // promise !
      .then(() => {
        // opérations possibles aprés le chargement des POI
        console.debug("POI loaded !");
      })
      .catch((e) => {
      // on ne capture pas les exceptions
        console.error(e);
      }).finally(() => {
        // INFO
        // le contrôle de calcul d'isochrone est en attente de l'initialisation des POI
        Globals.isochrone = new Isochrone(map, {
        // callback sur l'ouverture / fermeture du panneau de recherche
          openSearchControlCbk : () => { Globals.menu.open("searchIsochrone"); },
          closeSearchControlCbk : () => { Globals.menu.close("searchIsochrone"); }
        });
        // Poi RLT
        Globals.comparePoi = new ComparePoi(map, {});
        Globals.osmPoiAccessibility = new MapboxAccessibility(map, {});
        Globals.myaccount.addLandmarksLayers();
        // Cercle de précision sur la position
        Globals.map.addLayer(LocationLayers["precision"]);
        Globals.map.addLayer(LocationLayers["precision-outline"]);
        const controlsloaded = new Event("controlsloaded");
        window.dispatchEvent(controlsloaded);
      });
  });
};

export default {
  addControls,
};

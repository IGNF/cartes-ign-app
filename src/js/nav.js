/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";
import DOM from "./dom";

import { Toast } from "@capacitor/toast";

import Location from "./services/location";

/**
 * Menu de navigation principal
 */
class MenuNavigation {

  constructor() {
    this.container = document.getElementById("navContainer");
    this.#listeners();
  }

  #offlineWarning() {
    Toast.show({
      text: "Fonctionnalité indisponible en mode hors ligne.",
      duration: "long",
      position: "bottom"
    });
  }

  /**
     * Les écouteurs :
     * - event clic sur le menu de navigation
     * - event clic sur un element du DOM ayant une interaction avec le menu de navigation
     */
  #listeners() {
    // Menu global
    document.querySelectorAll(".navbar").forEach( (navbar) => {
      navbar.shouldOpen = true;
      navbar.addEventListener("click", () => {
        document.querySelectorAll(".navbar").forEach( (navbarOther) => {
          if (navbarOther != navbar) {
            navbarOther.shouldOpen = true;
          }
        });
        if (navbar.shouldOpen) {
          navbar.classList.add("hoverable");
          navbar.shouldOpen = false;
        }
        else {
          navbar.classList.remove("hoverable");
          navbar.shouldOpen = true;
        }
      });
    });
    // "Où suis-je ?"
    document.getElementById("position").addEventListener("click", () => {
      Globals.position.compute({ type: "myposition" })
        .then(() => {
          this.open("position");
        });
    });
    // "A proximité"
    document.getElementById("isochrone").addEventListener("click", () => {
      this.open("isochrone");
    });
    // "Créer un point de repère"
    document.getElementById("landmark").addEventListener("click", () => {
      this.open("landmark");
    });
    // "S'y rendre"
    document.getElementById("directions").addEventListener("click", () => {
      this.open("directions");
    });
    // "Tracer un itinéraire"
    document.getElementById("routeDraw").addEventListener("click", () => {
      if (!Globals.online) {
        this.#offlineWarning();
        return;
      }
      Globals.routeDraw.show();
    });
    // "Compte"
    document.getElementById("myaccount").addEventListener("click",  () => { this.open("myaccount"); });
  }

  /**
     * Cache le menu principal
     */
  hide() {
    this.container.classList.add("d-none");
    DOM.$tabContainer.classList.remove("noHeight");
  }

  /**
     * Affiche le menu principal
     */
  show() {
    this.container.classList.remove("d-none");
    DOM.$tabContainer.classList.add("noHeight");
  }

  /**
     * Ouvre le panneau avec le contenu du composant (tab)
     * @param {*} id
     */
  open(id, scrollIndex = -1, previousBackState = Globals.backButtonState) {
    // Apparition de la croix (cas général)
    DOM.$tabClose.classList.remove("d-none");
    if (["isochrone", "directions"].includes(id)) {
      if (!Globals.online) {
        this.#offlineWarning();
        return;
      }
    }
    // on vide tous les panneaux
    var lstElements = DOM.$tabContainer.childNodes;
    for (let i = 0; i < lstElements.length; i++) {
      var element = lstElements[i];
      if (element.id && element.id !== "tabHeader" && element.tagName.toUpperCase() === "DIV") {
        element.classList.add("d-none");
      }
    }

    // on met à jour l'état du panneau demandé
    Globals.backButtonState = id;

    // on ajoute le panneau demandé
    element = DOM["$" + id + "Window"];
    if (element) {
      element.classList.remove("d-none");
    }

    // y'a t il des particularités sur l'ouverture du panneau demandé ?
    var isSpecific = false;
    switch (id) {
    case "selectOnMapCompareLandmark":
      Globals.backButtonState = "selectOnMapCompareLandmark-" + previousBackState;
      document.querySelector("#mapRLT2").classList.add("d-none");
      document.getElementById("mapRLT1").style.removeProperty("opacity");
      DOM.$bottomButtons.classList.add("d-none");
      DOM.$tabContainer.classList.remove("compare");
      DOM.$compareMode.classList.add("d-none");
      Globals.compare.sideBySide.remove();
      DOM.$mapCenter.classList.remove("d-none");
      DOM.$mapCenterMenu.classList.remove("d-none");
      break;
    case "compareLandmark":
      Globals.backButtonState = "compareLandmark";
      DOM.$createCompareLandmarkBtn.classList.add("d-none");
      DOM.$tabContainer.classList.remove("compare");
      DOM.$bottomButtons.classList.remove("compare");
      Globals.currentScrollIndex = 2;
      break;
    case "landmark":
      Globals.backButtonState = "landmark-" + previousBackState;
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "signalement":
      Globals.backButtonState = "signalement-" + previousBackState;
      // falls through
    case "signalementOSM":
      Globals.backButtonState = "signalementOSM-" + previousBackState;
      DOM.$positionWindow.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("d-none");
      Globals.interactivityIndicator.hardDisable();
      break;
    case "comparePoi":
      DOM.$search.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("higher");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "selectOnMapDirections":
    case "selectOnMapIsochrone":
    case "selectOnMapLandmark":
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("d-none");
      DOM.$layerManagerBtn.classList.add("d-none");
      DOM.$mapCenter.classList.remove("d-none");
      DOM.$mapCenterMenu.classList.remove("d-none");
      DOM.$rech.blur();
      if (document.querySelector(".autocompresultselected")) {
        document.querySelector(".autocompresultselected").classList.remove("autocompresultselected");
      }
      DOM.$search.classList.add("d-none");
      document.body.classList.remove("searching");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("searching");
      DOM.$altMenuContainer.classList.add("d-none");
      DOM.$selectOnMap.classList.add("d-none");
      Globals.currentScrollIndex = 0;
      this.updateScrollAnchors();
      break;
    case "compareLayers1":
      Globals.backButtonState = "compareLayers1-" + previousBackState;
      DOM.$compareLayers2Window.classList.add("d-none");
      DOM.$compareLayers1Window.classList.remove("d-none");
      DOM.$tabContainer.classList.remove("compare");
      DOM.$bottomButtons.classList.remove("compare");
      DOM.$sideBySideLeftLayer.classList.remove("inactive");
      DOM.$sideBySideRightLayer.classList.add("inactive");
      DOM.$sideBySideLeftLayer.classList.add("compareLayers");
      DOM.$sideBySideFadeSlider.classList.add("compareLayers");
      Globals.currentScrollIndex = 2;
      if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        Globals.currentScrollIndex = 1;
      }
      break;
    case "compareLayers2":
      Globals.backButtonState = "compareLayers2-" + previousBackState;
      DOM.$compareLayers1Window.classList.add("d-none");
      DOM.$compareLayers2Window.classList.remove("d-none");
      DOM.$tabContainer.classList.remove("compare");
      DOM.$bottomButtons.classList.remove("compare");
      DOM.$sideBySideRightLayer.classList.remove("inactive");
      DOM.$sideBySideLeftLayer.classList.add("inactive");
      DOM.$sideBySideLeftLayer.classList.add("compareLayers");
      DOM.$sideBySideFadeSlider.classList.add("compareLayers");
      Globals.currentScrollIndex = 2;
      if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        Globals.currentScrollIndex = 1;
      }
      break;
    case "compare":
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$geolocateBtn.classList.add("d-none");
      DOM.$layerManagerBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$compareMode.classList.remove("d-none");
      DOM.$sideBySideLeftLayer.classList.remove("d-none");
      DOM.$sideBySideRightLayer.classList.remove("d-none");
      DOM.$createCompareLandmarkBtn.classList.remove("d-none");
      DOM.$tabContainer.classList.add("compare");
      DOM.$bottomButtons.classList.add("compare");
      DOM.$bottomButtons.classList.add("compareWidth");
      DOM.$bottomButtons.querySelector(".maplibregl-ctrl-bottom-left").classList.add("d-none");
      Globals.compare.show();
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 0;
      break;
    case "routeDrawSave":
      DOM.$routeDrawWindow.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("d-none");
      Globals.routeDraw.dom.changeMode.classList.add("d-none");
      DOM.$routeDrawEdit.classList.add("d-none");
      DOM.$bottomButtons.classList.remove("routeDraw");
      Globals.currentScrollIndex = 1;
      break;
    case "routeDraw":
      // Disparition de la croix pour le tracé d'itinéraire (décision UI)
      DOM.$tabClose.classList.add("d-none");
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$fullScreenBtn.classList.add("higher");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      if (!Globals.routeDraw.readonly) {
        DOM.$routeDrawEdit.classList.remove("d-none");
        DOM.$bottomButtons.classList.add("routeDraw");
        Globals.routeDraw.activate();
      }
      DOM.$tabContainer.classList.add("white");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "poi":
      Globals.backButtonState = "poi-" + previousBackState;
      Globals.routeDraw.deactivate();
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "layerManager":
      Globals.backButtonState = "layerManager-" + previousBackState;
      DOM.$layerManagerBtn.classList.add("active");
      DOM.$search.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("higher");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$tabContainer.classList.remove("white");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      if (!Globals.routeDraw.readonly) {
        DOM.$routeDrawEdit.classList.add("d-none");
        DOM.$bottomButtons.classList.remove("routeDraw");
      }
      Globals.currentScrollIndex = 1;
      break;
    case "informations":
      Globals.currentScrollIndex = 1;
      break;
    case "position":
      if (previousBackState.split("-")[0] !== "position") {
        Globals.backButtonState = "position-" + previousBackState;
      }
      Globals.interactivityIndicator.enable();
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$fullScreenBtn.classList.add("higher");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "isochrone":
      // FIXME mettre en place une méthode sur la classe Search
      // ex. Globals.search.hide()
      Globals.backButtonState = "isochrone-" + previousBackState;
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$fullScreenBtn.classList.add("highest");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "myaccount":
    case "informationsScreen":
      DOM.$tabContainer.classList.add("noHeight");
      DOM.$whiteScreen.classList.add("falseWhite");
      document.body.classList.add("scrollable");
      DOM.$whiteScreen.classList.remove("d-none");
      DOM.$search.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$altMenuContainer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      break;
    case "directionsResults":
      DOM.$search.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$tabContainer.classList.add("white");
      Globals.interactivityIndicator.enable();
      DOM.$tabContainer.classList.remove("noHeight");
      Globals.currentScrollIndex = 2;
      break;
    case "searchDirections":
    case "searchIsochrone":
    case "searchLandmark":
      DOM.$search.classList.remove("d-none");
      DOM.$selectOnMap.classList.remove("d-none");
      // falls through
    case "search":
      DOM.$resultsRechRecent.hidden = false;
      DOM.$searchresultsWindow.classList.remove("d-none");
      DOM.$whiteScreen.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("searching");
      document.body.classList.add("searching");
      DOM.$altMenuContainer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      break;
    case "directions":
      Globals.backButtonState = "directions-" + previousBackState;
      DOM.$search.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("higher");
      DOM.$fullScreenBtn.classList.add("higher");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.interactivityIndicator.hardDisable();
      // FIXME
      // "Ma position" par défaut dans le départ quand disponible
      if (!["searchDirections", "directions"].includes(previousBackState) && Location.getCurrentPosition()) {
        let target = Globals.directions.dom.inputDeparture;
        target.dataset.coordinates = "[" + Location.getCurrentPosition().coords.longitude + "," + Location.getCurrentPosition().coords.latitude + "]";
        target.value = "Ma position";
      }
      Globals.currentScrollIndex = 2;
      if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        Globals.currentScrollIndex = 1;
      }
      break;
    default:
      break;
    }
    if (isSpecific) {
      this.#open(id);
      return;
    }

    // on cache le menu de navigation
    this.hide();

    if (!DOM.$whiteScreen.classList.contains("d-none")) {
      DOM.$tabContainer.classList.add("noHeight");
    }

    // on procede à l'affichage du panneau
    if (scrollIndex !== -1) {
      Globals.currentScrollIndex = scrollIndex;
    }
    this.updateScrollAnchors();
  }

  /**
     * Ferme le panneau du composant (tab)
     * @param {*} id
     */
  close(id) {
    var element = DOM["$" + id + "Window"];
    if (element) {
      element.classList.add("d-none");
    }

    // y'a t il des particularités sur la fermeture du panneau en cours ?
    var isSpecific = false;
    var isFinished = false; // hack pour search !
    switch (id) {
    case "selectOnMapCompareLandmark":
      document.querySelector("#mapRLT2").classList.remove("d-none");
      DOM.$bottomButtons.classList.remove("d-none");
      DOM.$tabContainer.classList.add("compare");
      DOM.$compareMode.classList.remove("d-none");
      Globals.compare.mapRLT2.setCenter(Globals.compare.mapRLT1.getCenter());
      Globals.compare.mapRLT2.setZoom(Globals.compare.mapRLT1.getZoom());
      Globals.compare.changeMode();
      DOM.$mapCenter.classList.add("d-none");
      DOM.$mapCenterMenu.classList.add("d-none");
      isSpecific = true;
      isFinished = true;
      break;
    case "compareLandmark":
      DOM.$createCompareLandmarkBtn.classList.remove("d-none");
      Globals.compareLandmark.clear();
      DOM.$tabContainer.classList.add("compare");
      DOM.$bottomButtons.classList.add("compare");
      DOM.$mapCenter.classList.add("d-none");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "landmark":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      Globals.landmark.clear();
      Globals.interactivityIndicator.enable();
      break;
    case "signalement":
    case "signalementOSM":
      DOM.$positionWindow.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      Globals.interactivityIndicator.enable();
      Globals.signalement.clear();
      Globals.signalementOSM.clear();
      isSpecific = true;
      isFinished = true;
      break;
    case "comparePoi":
      Globals.comparePoi.clearSources();
      DOM.$search.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$backTopLeftBtn.classList.add("d-none");
      break;
    case "selectOnMapDirections":
      DOM.$filterPoiBtn.classList.remove("d-none");
      // falls through
    case "selectOnMapIsochrone":
    case "selectOnMapLandmark":
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$layerManagerBtn.classList.remove("d-none");
      DOM.$mapCenter.classList.add("d-none");
      DOM.$mapCenterMenu.classList.add("d-none");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compareLayers1":
      DOM.$sideBySideLeftLayer.classList.remove("compareLayers");
      DOM.$sideBySideFadeSlider.classList.remove("compareLayers");
      DOM.$compareLayers1Window.classList.add("d-none");
      DOM.$tabContainer.classList.add("compare");
      DOM.$bottomButtons.classList.add("compare");
      DOM.$sideBySideRightLayer.classList.remove("inactive");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compareLayers2":
      DOM.$sideBySideLeftLayer.classList.remove("compareLayers");
      DOM.$sideBySideFadeSlider.classList.remove("compareLayers");
      DOM.$compareLayers2Window.classList.add("d-none");
      DOM.$tabContainer.classList.add("compare");
      DOM.$bottomButtons.classList.add("compare");
      DOM.$sideBySideLeftLayer.classList.remove("inactive");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compare":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$geolocateBtn.classList.remove("d-none");
      DOM.$layerManagerBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$compareMode.classList.add("d-none");
      DOM.$sideBySideLeftLayer.classList.add("d-none");
      DOM.$sideBySideRightLayer.classList.add("d-none");
      DOM.$createCompareLandmarkBtn.classList.add("d-none");
      DOM.$tabContainer.classList.remove("compare");
      DOM.$bottomButtons.classList.remove("compare");
      DOM.$bottomButtons.classList.add("compareWidth");
      DOM.$bottomButtons.querySelector(".maplibregl-ctrl-bottom-left").classList.remove("d-none");
      Globals.compare.hide();
      Globals.interactivityIndicator.enable();
      break;
    case "routeDrawSave":
      // Réouverture de routeDraw sans utilisr this.open("routeDraw")
      // Disparition de la croix
      DOM.$tabClose.classList.add("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM["$routeDrawWindow"].classList.remove("d-none");
      Globals.routeDraw.dom.changeMode.classList.remove("d-none");
      DOM.$routeDrawEdit.classList.remove("d-none");
      DOM.$bottomButtons.classList.add("routeDraw");
      isSpecific = true;
      isFinished = true;
      break;
    case "routeDraw":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      if (!Globals.routeDraw.readonly) {
        DOM.$routeDrawEdit.classList.add("d-none");
        DOM.$bottomButtons.classList.remove("routeDraw");
      }
      DOM.$tabContainer.classList.remove("white");
      Globals.routeDraw.clear();
      Globals.interactivityIndicator.enable();
      break;
    case "poi":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      break;
    case "layerManager":
      DOM.$search.classList.remove("d-none");
      DOM.$layerManagerBtn.classList.remove("active");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$backTopLeftBtn.classList.add("d-none");
      break;
    case "informations":
      isSpecific = true;
      isFinished = true;
      break;
    case "position":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$backTopLeftBtn.classList.add("d-none");
      Globals.mapInteractivity.clear();
      break;
    case "isochrone":
      // FIXME mettre en place une méthode sur la classe Searchs
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("highest");
      DOM.$backTopLeftBtn.classList.add("d-none");
      Globals.isochrone.clear();
      Globals.isochrone.clearForm();
      Globals.interactivityIndicator.enable();
      break;
    case "search":
      DOM.$rech.blur();
      if (document.querySelector(".autocompresultselected")) {
        document.querySelector(".autocompresultselected").classList.remove("autocompresultselected");
      }
      document.body.classList.remove("searching");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("searching");
      DOM.$altMenuContainer.classList.add("d-none");
      isSpecific = true;
      isFinished = false;
      break;
    case "searchDirections":
    case "searchIsochrone":
    case "searchLandmark":
      DOM.$rech.blur();
      if (document.querySelector(".autocompresultselected")) {
        document.querySelector(".autocompresultselected").classList.remove("autocompresultselected");
      }
      document.body.classList.remove("searching");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("searching");
      DOM.$altMenuContainer.classList.add("d-none");
      DOM.$selectOnMap.classList.add("d-none");
      DOM.$tabContainer.classList.remove("noHeight");
      Globals.currentScrollIndex = 1;
      // falls through
    case "directionsResults":
      DOM.$tabContainer.classList.remove("white");
      Globals.interactivityIndicator.hardDisable();
      isSpecific = true;
      isFinished = true;
      break;
    case "myaccount":
    case "informationsScreen":
      DOM.$whiteScreen.classList.remove("falseWhite");
      document.body.classList.remove("scrollable");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$search.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$altMenuContainer.classList.add("d-none");
      break;
    case "directions":
      DOM.$search.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("higher");
      DOM.$fullScreenBtn.classList.remove("higher");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$fullScreenBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      Globals.directions.clear();
      Globals.interactivityIndicator.enable();
      break;
    default:
      break;
    }

    // on est sur une fermeture specifique,
    // on passe donc par un autre mecanisme
    if (isSpecific) {
      this.#close(id);
      if (isFinished) {
        this.updateScrollAnchors();
        return;
      }
    }

    Globals.currentScrollIndex = 0;
    this.updateScrollAnchors();

    // on affiche le menu de navigation
    this.show();

    // on met à jour l'état du panneau : vers le menu de navigation
    Globals.backButtonState = "default";
    DOM.$tabContainer.classList.remove("noHeight");
  }

  /**
     * Ouverture spécifique d'un panneau
     * @param {*} id
     */
  #open() {}

  /**
     * Fermeture spécifique d'un panneau
     * @param {*} id
     */
  #close(id) {
    if (["compareLayers1", "compareLayers2", "compareLandmark", "selectOnMapCompareLandmark"].includes(id)) {
      Globals.backButtonState = "compare"; // on revient sur le contrôle !
      return;
    }
    if (id === "routeDrawSave") {
      Globals.backButtonState = "routeDraw"; // on revient sur le contrôle !
      return;
    }
    if (["signalement", "signalementOSM"].includes(id)) {
      Globals.backButtonState = "position"; // on revient sur le contrôle !
      return;
    }
    Globals.controller.abort();
    Globals.controller = new AbortController();
    Globals.signal = Globals.controller.signal;
    DOM.$resultDiv.hidden = true;
    DOM.$resultDiv.innerHTML = "";
    DOM.$searchresultsWindow.classList.add("d-none");
    DOM.$layerManagerBtn.classList.remove("d-none");
    DOM.$filterPoiBtn.classList.remove("d-none");
    DOM.$interactivityBtn.classList.remove("d-none");
    DOM.$geolocateBtn.classList.remove("d-none");
    switch (id) {
    case "informations":
      DOM.$layerManagerWindow.classList.remove("d-none");
      Globals.backButtonState = "layerManager"; // on revient sur le contrôle !
      this.#midScroll();
      break;
    case "search":
      DOM.$search.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      break;
    case "directionsResults":
      DOM.$directionsWindow.classList.remove("d-none");
      Globals.backButtonState = "directions"; // on revient sur le contrôle !
      this.#midScroll();
      break;
    case "searchLandmark":
    case "selectOnMapLandmark":
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$search.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$landmarkWindow.classList.remove("d-none");
      Globals.backButtonState = "landmark"; // on revient sur le contrôle !
      Globals.currentScrollIndex = 1;
      this.updateScrollAnchors();
      DOM.$rech.value = "";
      break;
    case "searchIsochrone":
    case "selectOnMapIsochrone":
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$search.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$isochroneWindow.classList.remove("d-none");
      Globals.backButtonState = "isochrone"; // on revient sur le contrôle !
      Globals.currentScrollIndex = 1;
      this.updateScrollAnchors();
      break;
    case "searchDirections":
    case "selectOnMapDirections":
      DOM.$search.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$directionsWindow.classList.remove("d-none");
      Globals.backButtonState = "directions"; // on revient sur le contrôle !
      Globals.currentScrollIndex = 2;
      this.updateScrollAnchors();
      DOM.$rech.value = "";
      break;
    default:
      break;
    }
  }

  /** ... */
  updateScrollAnchors() {
    if (Globals.backButtonState !== "compare") {
      DOM.$tabContainer.style.removeProperty("display");
    }
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches && Globals.currentScrollIndex !== 0) {
      DOM.$tabContainer.style.display = "flex";
    }
    Globals.maxScroll = Math.min(
      document.scrollingElement.clientHeight - 72,
      document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight
    );
    Globals.anchors = [0, Globals.maxScroll / 2.5, Globals.maxScroll];
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      const insetBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-bottom").slice(0, -2));
      const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-bar-height").slice(0, -2));

      Globals.anchors = [0, document.scrollingElement.clientHeight - 72 - Math.max(insetBottom - 10 - navHeight, 20), Globals.maxScroll];
    }
    this.#scrollTo(Globals.anchors[Globals.currentScrollIndex]);
  }

  /** ... */
  #midScroll() {
    Globals.currentScrollIndex = 1;
    this.updateScrollAnchors();
  }

  /** ... */
  #scrollTo(value) {
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches && Globals.currentScrollIndex === 0) {
      return;
    }
    window.scroll({
      top: value,
      left: 0,
      behavior: "smooth"
    });
  }
}

export default MenuNavigation;

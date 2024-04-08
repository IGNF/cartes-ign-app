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
      Globals.position.compute()
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
    // Gestionnaire des couches
    document.getElementById("informationsWindowClose").addEventListener("click", () => { this.close("informations");});
  }

  /**
     * Cache le menu principal
     */
  hide() {
    this.container.classList.add("d-none");
  }

  /**
     * Affiche le menu principal
     */
  show() {
    this.container.classList.remove("d-none");
  }

  /**
     * Ouvre le panneau avec le contenu du composant (tab)
     * @param {*} id
     */
  open(id, scrollIndex = -1) {
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
    var previousBackState = Globals.backButtonState;
    Globals.backButtonState = id;

    // on ajoute le panneau demandé
    element = DOM["$" + id + "Window"];
    if (element) {
      element.classList.remove("d-none");
    }

    // y'a t il des particularités sur l'ouverture du panneau demandé ?
    var isSpecific = false;
    switch (id) {
    case "landmark":
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "signalement":
      DOM.$positionWindow.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      Globals.interactivityIndicator.hardDisable();
      DOM.$sideBySideBtn.classList.add("d-none");
      break;
    case "comparePoi":
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "selectOnMapDirections":
    case "selectOnMapIsochrone":
    case "selectOnMapLandmark":
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$layerManagerBtn.classList.add("d-none");
      DOM.$mapCenter.classList.remove("d-none");
      DOM.$mapCenterMenu.classList.remove("d-none");
      DOM.$rech.blur();
      if (document.querySelector(".autocompresultselected")) {
        document.querySelector(".autocompresultselected").classList.remove("autocompresultselected");
      }
      DOM.$search.style.display = "none";
      document.body.style.removeProperty("overflow-y");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.style.removeProperty("box-shadow");
      DOM.$backTopLeftBtn.style.removeProperty("height");
      DOM.$backTopLeftBtn.style.removeProperty("width");
      DOM.$backTopLeftBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.style.removeProperty("left");
      DOM.$altMenuContainer.classList.add("d-none");
      DOM.$selectOnMap.classList.add("d-none");
      Globals.currentScrollIndex = 0;
      this.updateScrollAnchors();
      break;
    case "compareLayers1":
      DOM.$tabContainer.style.removeProperty("top");
      DOM.$bottomButtons.style.removeProperty("bottom");
      DOM.$compareLayers2Window.classList.add("d-none");
      DOM.$compareLayers1Window.classList.remove("d-none");
      DOM.$sideBySideLeftLayer.classList.add("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "compareLayers2":
      DOM.$tabContainer.style.removeProperty("top");
      DOM.$bottomButtons.style.removeProperty("bottom");
      DOM.$compareLayers1Window.classList.add("d-none");
      DOM.$compareLayers2Window.classList.remove("d-none");
      DOM.$sideBySideRightLayer.classList.add("d-none");
      if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        DOM.$sideBySideLeftLayer.style.left = "calc(50% + 15px)";
      }
      Globals.currentScrollIndex = 2;
      break;
    case "compare":
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      DOM.$geolocateBtn.classList.add("d-none");
      DOM.$layerManagerBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$compareMode.classList.remove("d-none");
      DOM.$sideBySideLeftLayer.classList.remove("d-none");
      DOM.$sideBySideRightLayer.classList.remove("d-none");
      DOM.$tabContainer.style.top = "100vh";
      DOM.$bottomButtons.style.bottom = "calc(42px + var(--safe-area-inset-bottom))";
      if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        DOM.$bottomButtons.style.width = "calc(100vw - var(--safe-area-inset-left) - var(--safe-area-inset-right))";
      }
      DOM.$bottomButtons.querySelector(".maplibregl-control-container").classList.add("d-none");
      Globals.compare.show();
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 0;
      break;
    case "routeDrawSave":
      DOM.$routeDrawWindow.classList.add("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$routeDrawBtns.classList.add("d-none");
      DOM.$routeDrawEdit.classList.add("d-none");
      DOM.$bottomButtons.style.removeProperty("bottom");
      DOM.$bottomButtons.style.removeProperty("left");
      DOM.$bottomButtons.style.removeProperty("width");
      Globals.currentScrollIndex = 1;
      break;
    case "routeDraw":
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      if (!Globals.routeDraw.readonly) {
        DOM.$routeDrawBtns.classList.remove("d-none");
        DOM.$routeDrawEdit.classList.remove("d-none");
        if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
          DOM.$bottomButtons.style.bottom = "calc(72px + 112px + var(--safe-area-inset-bottom))";
        } else {
          DOM.$bottomButtons.style.left = "min(50vw, calc(100vh + var(--safe-area-inset-left) + 42px))";
          DOM.$bottomButtons.style.width = "auto";
          DOM.$bottomButtons.style.bottom = "calc(112px + var(--safe-area-inset-bottom))";
        }
        Globals.routeDraw.activate();
      }
      DOM.$tabContainer.style.backgroundColor = "white";
      DOM.$sideBySideBtn.classList.add("d-none");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "poi":
      Globals.backButtonState = "poi-" + previousBackState;
      Globals.routeDraw.deactivate();
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.add("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "layerManager":
      Globals.backButtonState = "layerManager-" + previousBackState;
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.currentScrollIndex = 1;
      break;
    case "informations":
      Globals.currentScrollIndex = 1;
      break;
    case "position":
      if (previousBackState.split("-")[0] !== "position") {
        Globals.backButtonState = "position-" + previousBackState;
      }
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.currentScrollIndex = 2;
      break;
    case "isochrone":
      // FIXME mettre en place une méthode sur la classe Search
      // ex. Globals.search.hide()
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      Globals.interactivityIndicator.hardDisable();
      Globals.currentScrollIndex = 1;
      break;
    case "myaccount":
    case "informationsScreen":
      DOM.$whiteScreen.style.backgroundColor = getComputedStyle(document.body).getPropertyValue("--false-white");
      document.body.style.overflowY = "scroll";
      DOM.$whiteScreen.classList.remove("d-none");
      DOM.$search.style.display = "none";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$altMenuContainer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      break;
    case "directionsResults":
      DOM.$search.style.display = "none";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$tabContainer.style.backgroundColor = "white";
      Globals.interactivityIndicator.enable();
      DOM.$tabContainer.style.removeProperty("height");
      Globals.currentScrollIndex = 2;
      break;
    case "searchDirections":
    case "searchIsochrone":
    case "searchLandmark":
      DOM.$search.style.display = "flex";
      DOM.$selectOnMap.classList.remove("d-none");
      // falls through
    case "search":
      DOM.$searchresultsWindow.classList.remove("d-none");
      DOM.$whiteScreen.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        document.body.style.overflowY = "scroll";
        DOM.$backTopLeftBtn.style.boxShadow = "unset";
        DOM.$backTopLeftBtn.style.height = "44px";
        DOM.$backTopLeftBtn.style.width = "24px";
        DOM.$backTopLeftBtn.style.top = "calc(12px + var(--safe-area-inset-top))";
        DOM.$backTopLeftBtn.style.left = "15px";
      }
      DOM.$altMenuContainer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      break;
    case "directions":
      DOM.$search.style.display = "none";
      DOM.$filterPoiBtn.style.top = "calc(10px + var(--safe-area-inset-top))";
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      Globals.interactivityIndicator.hardDisable();
      // FIXME
      // "Ma position" par défaut dans le départ quand disponible
      if (previousBackState !== "searchDirections" && Location.getCurrentPosition()) {
        let target = Globals.directions.dom.inputDeparture;
        target.dataset.coordinates = "[" + Location.getCurrentPosition().coords.longitude + "," + Location.getCurrentPosition().coords.latitude + "]";
        target.value = "Ma position";
      }
      Globals.currentScrollIndex = 2;
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
    case "landmark":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.remove("d-none");
      Globals.landmark.clear();
      Globals.interactivityIndicator.enable();
      break;
    case "signalement":
      DOM.$positionWindow.classList.remove("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      Globals.interactivityIndicator.enable();
      Globals.signalement.clear();
      DOM.$sideBySideBtn.classList.remove("d-none");
      isSpecific = true;
      isFinished = true;
      break;
    case "comparePoi":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.classList.add("d-none");
      break;
    case "selectOnMapDirections":
      DOM.$filterPoiBtn.classList.remove("d-none");
      // falls through
    case "selectOnMapIsochrone":
    case "selectOnMapLandmark":
      DOM.$layerManagerBtn.classList.remove("d-none");
      DOM.$mapCenter.classList.add("d-none");
      DOM.$mapCenterMenu.classList.add("d-none");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compareLayers1":
      DOM.$tabContainer.style.top = "100vh";
      DOM.$bottomButtons.style.bottom = "calc(42px + var(--safe-area-inset-bottom))";
      DOM.$compareLayers1Window.classList.add("d-none");
      DOM.$sideBySideLeftLayer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compareLayers2":
      DOM.$tabContainer.style.top = "100vh";
      DOM.$bottomButtons.style.bottom = "calc(42px + var(--safe-area-inset-bottom))";
      DOM.$sideBySideLeftLayer.style.removeProperty("left");
      DOM.$compareLayers2Window.classList.add("d-none");
      DOM.$sideBySideRightLayer.classList.remove("d-none");
      Globals.currentScrollIndex = 0;
      isSpecific = true;
      isFinished = true;
      break;
    case "compare":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$sideBySideBtn.classList.remove("d-none");
      DOM.$geolocateBtn.classList.remove("d-none");
      DOM.$layerManagerBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$compareMode.classList.add("d-none");
      DOM.$sideBySideLeftLayer.classList.add("d-none");
      DOM.$sideBySideRightLayer.classList.add("d-none");
      DOM.$tabContainer.style.removeProperty("top");
      DOM.$bottomButtons.style.removeProperty("bottom");
      DOM.$bottomButtons.style.removeProperty("width");
      DOM.$bottomButtons.querySelector(".maplibregl-control-container").classList.remove("d-none");
      Globals.compare.hide();
      Globals.interactivityIndicator.enable();
      break;
    case "routeDrawSave":
      // Réouverture de routeDraw sans utilisr this.open("routeDraw")
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM["$routeDrawWindow"].classList.remove("d-none");
      DOM.$routeDrawBtns.classList.remove("d-none");
      DOM.$routeDrawEdit.classList.remove("d-none");
      if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        DOM.$bottomButtons.style.bottom = "calc(72px + 112px + var(--safe-area-inset-bottom))";
      } else {
        DOM.$bottomButtons.style.left = "min(50vw, calc(100vh + var(--safe-area-inset-left) + 42px))";
        DOM.$bottomButtons.style.width = "auto";
        DOM.$bottomButtons.style.bottom = "calc(112px + var(--safe-area-inset-bottom))";
      }
      isSpecific = true;
      isFinished = true;
      break;
    case "routeDraw":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      if (!Globals.routeDraw.readonly) {
        DOM.$routeDrawBtns.classList.add("d-none");
        DOM.$routeDrawEdit.classList.add("d-none");
        DOM.$bottomButtons.style.removeProperty("bottom");
        DOM.$bottomButtons.style.removeProperty("left");
        DOM.$bottomButtons.style.removeProperty("width");
      }
      DOM.$sideBySideBtn.classList.remove("d-none");
      DOM.$tabContainer.style.removeProperty("background-color");
      Globals.routeDraw.clear();
      Globals.interactivityIndicator.enable();
      break;
    case "poi":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$filterPoiBtn.classList.remove("d-none");
      break;
    case "layerManager":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.classList.add("d-none");
      break;
    case "informations":
      isSpecific = true;
      isFinished = true;
      break;
    case "position":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.classList.add("d-none");
      Globals.mapInteractivity.clear();
      Globals.position.clear();
      break;
    case "isochrone":
      // FIXME mettre en place une méthode sur la classe Searchs
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.remove("d-none");
      Globals.isochrone.clear();
      Globals.interactivityIndicator.enable();
      break;
    case "search":
      DOM.$rech.blur();
      if (document.querySelector(".autocompresultselected")) {
        document.querySelector(".autocompresultselected").classList.remove("autocompresultselected");
      }
      document.body.style.removeProperty("overflow-y");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.style.removeProperty("box-shadow");
      DOM.$backTopLeftBtn.style.removeProperty("height");
      DOM.$backTopLeftBtn.style.removeProperty("width");
      DOM.$backTopLeftBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.style.removeProperty("left");
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
      document.body.style.removeProperty("overflow-y");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$backTopLeftBtn.style.removeProperty("box-shadow");
      DOM.$backTopLeftBtn.style.removeProperty("height");
      DOM.$backTopLeftBtn.style.removeProperty("width");
      DOM.$backTopLeftBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.style.removeProperty("left");
      DOM.$altMenuContainer.classList.add("d-none");
      DOM.$selectOnMap.classList.add("d-none");
      Globals.currentScrollIndex = 1;
      // falls through
    case "directionsResults":
      DOM.$tabContainer.style.removeProperty("background-color");
      Globals.interactivityIndicator.hardDisable();
      isSpecific = true;
      isFinished = true;
      break;
    case "myaccount":
    case "informationsScreen":
      DOM.$whiteScreen.style.removeProperty("background-color");
      document.body.style.removeProperty("overflow-y");
      DOM.$whiteScreen.classList.add("d-none");
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$altMenuContainer.classList.add("d-none");
      break;
    case "directions":
      DOM.$search.style.display = "flex";
      DOM.$filterPoiBtn.style.removeProperty("top");
      DOM.$filterPoiBtn.classList.remove("d-none");
      DOM.$backTopLeftBtn.classList.add("d-none");
      DOM.$sideBySideBtn.classList.remove("d-none");
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
    DOM.$tabContainer.style.removeProperty("height");
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
    if (["compareLayers1", "compareLayers2"].includes(id)) {
      Globals.backButtonState = "compare"; // on revient sur le contrôle !
      return;
    }
    if (id === "routeDrawSave") {
      Globals.backButtonState = "routeDraw"; // on revient sur le contrôle !
      return;
    }
    if (id === "signalement") {
      Globals.backButtonState = "position"; // on revient sur le contrôle !
      return;
    }
    Globals.controller.abort();
    Globals.controller = new AbortController();
    Globals.signal = Globals.controller.signal;
    DOM.$resultDiv.hidden = true;
    DOM.$resultDiv.innerHTML = "";
    DOM.$searchresultsWindow.classList.add("d-none");
    DOM.$sideBySideBtn.classList.remove("d-none");
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
      DOM.$search.style.display = "flex";
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
      DOM.$search.style.display = "none";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      DOM.$landmarkWindow.classList.remove("d-none");
      Globals.backButtonState = "landmark"; // on revient sur le contrôle !
      Globals.currentScrollIndex = 1;
      this.updateScrollAnchors();
      DOM.$rech.value = "";
      break;
    case "searchIsochrone":
    case "selectOnMapIsochrone":
      DOM.$filterPoiBtn.classList.add("d-none");
      DOM.$search.style.display = "none";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
      DOM.$isochroneWindow.classList.remove("d-none");
      Globals.backButtonState = "isochrone"; // on revient sur le contrôle !
      Globals.currentScrollIndex = 1;
      this.updateScrollAnchors();
      break;
    case "searchDirections":
    case "selectOnMapDirections":
      DOM.$search.style.display = "none";
      DOM.$backTopLeftBtn.classList.remove("d-none");
      DOM.$sideBySideBtn.classList.add("d-none");
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
    Globals.maxScroll = (document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight);
    Globals.anchors = [0, Globals.maxScroll / 2.5, Globals.maxScroll];
    if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      Globals.anchors = [0, document.scrollingElement.clientHeight - 72, Globals.maxScroll];
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
    if (Globals.backButtonState !== "compare") {
      DOM.$tabContainer.style.removeProperty("display");
    }
    if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
      if (Globals.currentScrollIndex == 0) {
        return;
      }
      DOM.$tabContainer.style.display = "flex";
    }
    window.scroll({
      top: value,
      left: 0,
      behavior: "smooth"
    });
  }
}

export default MenuNavigation;

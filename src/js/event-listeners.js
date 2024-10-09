/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Geocode from "./services/geocode";
import Location from "./services/location";
import DOM from "./dom";
import Globals from "./globals";
import State from "./state";
import PopupUtils from "./utils/popup-utils";

import { Capacitor } from "@capacitor/core";
// https://github.com/ionic-team/capacitor/issues/2840
import { SafeAreaController } from "@aashu-dubey/capacitor-statusbar-safe-area";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Network } from "@capacitor/network";
import { TextZoom } from "@capacitor/text-zoom";
import { App } from "@capacitor/app";
import { Keyboard } from "@capacitor/keyboard";
import maplibregl from "maplibre-gl";

/**
 * Ecouteurs generiques
 * @todo terminer le nettoyage avec les ecouteurs pour les classes layerManager & MyAccount
 */
function addListeners() {

  const map = Globals.map;

  /* event listeners pour élément non existants au démarrage */
  document.querySelector("body").addEventListener("click", (evt) => {
    var geocode = false;
    /* Résultats autocompletion ou recherche récente */
    let coords = null;
    let save = true;
    if (evt.target.classList.contains("autocompresult") || evt.target.classList.contains("recentresult")) {
      geocode = true;
      save = !evt.target.classList.contains("recentresult");
      evt.target.classList.add("autocompresultselected");
      DOM.$rech.value = evt.target.getAttribute("fulltext");
      coords = JSON.parse(evt.target.dataset.coordinates);
    }
    // si recherches recentes ou autocompletion, on realise un geocodage
    if (geocode) {
      if (Globals.backButtonState === "searchDirections") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords, save);
          Globals.menu.open("directions");
        }, 250);
      } else if(Globals.backButtonState === "searchIsochrone") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords, save);
          Globals.menu.open("isochrone");
        }, 250);
      } else if(Globals.backButtonState === "searchLandmark") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords, save);
          Globals.menu.open("landmark");
        }, 250);
      } else {
        Geocode.searchAndMoveTo(DOM.$rech.value, coords, save);
        setTimeout(() => Globals.menu.close("search"), 250);
      }
    }
  }, true);
  document.querySelector("body").addEventListener("wheel", (evt) => {
    if ( evt.target.classList.contains("compare-swiper-horizontal") || evt.target.classList.contains("compare-swiper-vertical")) {
      evt.preventDefault();
    }
  }, { passive: false });

  // Ecouteurs sur les sous menus Compte
  document.getElementById("menuItemInformations").addEventListener("click", () => {
    DOM.$whiteScreen.style.animation = "unset";
    Globals.menu.close("myaccount");
    Globals.menu.open("informationsScreen");
  });
  const $informationsScreenMenu = document.getElementById("informationsScreenMenu");
  document.getElementById("informationsItemsLegal").addEventListener("click", () => {
    document.getElementById("informationsContentPrivacy").classList.add("d-none");
    document.getElementById("informationsContentLegal").classList.remove("d-none");
    $informationsScreenMenu.style.marginLeft = "-100%";
    Globals.backButtonState = "informationsScreenLegal";
  });
  document.getElementById("informationsItemsPrivacy").addEventListener("click", () => {
    document.getElementById("informationsContentLegal").classList.add("d-none");
    document.getElementById("informationsContentPrivacy").classList.remove("d-none");
    $informationsScreenMenu.style.marginLeft = "-100%";
    Globals.backButtonState = "informationsScreenPrivacy";
  });

  // Rotation du marqueur de position (android)
  if (Capacitor.getPlatform() !== "ios") {
    window.addEventListener("deviceorientationabsolute", Location.getOrientation, true);
  }

  // Action du backbutton
  document.addEventListener("backbutton", State.onBackKeyDown, false);
  DOM.$tabClose.addEventListener("click", State.onBackKeyDown, false);

  const saveState = () => {
    if (Globals.backButtonState.split("-")[0] === "position") {
      DOM.$backTopLeftBtn.click();
    }
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastLayersDisplayed", JSON.stringify(Globals.layersDisplayed));
    localStorage.setItem("savedRoutes", JSON.stringify(Globals.myaccount.routes));
    localStorage.setItem("savedLandmarks", JSON.stringify(Globals.myaccount.landmarks));
    const checkedPoi = {};
    document.querySelectorAll(".inputPOIFilterItem.checkbox").forEach((poiCheckbox) => {
      checkedPoi[poiCheckbox.id] = poiCheckbox.checked;
    });
    localStorage.setItem("checkedOsmPoi", JSON.stringify(checkedPoi));
  };

  // Sauvegarde de l'état de l'application
  App.addListener("pause", saveState);
  document.addEventListener("pause", saveState);
  window.addEventListener("beforeunload", saveState);

  let keyboardWillHide = false;
  if (Capacitor.getPlatform() !== "web") {
    Keyboard.addListener("keyboardWillHide", () => {
      keyboardWillHide = true;
    });

    Keyboard.addListener("keyboardDidHide", () => {
      setTimeout(() => {
        keyboardWillHide = false;
        Globals.menu.updateScrollAnchors();
      }, 50);
    });
  }

  const handleresize = () => {
    SafeAreaController.addSafeAreaVariables().then( () => {
      ScreenOrientation.orientation().then((orientation) => {
        if (orientation.type === "landscape-secondary") {
          document.documentElement.style.setProperty("--safe-area-inset-left", "0px");
        }
        if (orientation.type === "landscape-primary") {
          document.documentElement.style.setProperty("--safe-area-inset-right", "0px");
        }
      });
    });

    if (Globals.backButtonState !== "default") {
      Globals.currentScrollIndex = 1;
      if (keyboardWillHide) {
        Globals.currentScrollIndex = 2;
      }
    }
    if (["selectOnMapDirections", "selectOnMapIsochrone", "selectOnMapLandmark", "compare"].includes(Globals.backButtonState)) {
      Globals.currentScrollIndex = 0;
    }

    if (["compare", "compareLayers1", "compareLayers2"].includes(Globals.backButtonState)) {
      const slider = document.querySelector(".maplibregl-compare");
      if (slider) {
        let sliderX;
        if (slider.classList.contains("maplibregl-compare-horizontal")) {
          sliderX = window.innerHeight / 2;
        } else {
          if (["compareLayers1", "compareLayers2"].includes(Globals.backButtonState)
            && window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches
          ) {
            sliderX = 3 * window.innerWidth / 4;
          } else {
            sliderX = window.innerWidth / 2;
          }
        }
        // HACK: 50ms d'attente cas sinon ne prend pas en compte le resize...
        setTimeout( () => {
          Globals.compare.sideBySide.setSlider(sliderX);
        }, 50);
      }
    }
    Globals.menu.updateScrollAnchors();
  };

  // Screen dimentions change
  window.addEventListener("resize", handleresize);
  window.addEventListener("orientationchange", handleresize);
  App.addListener("resume", handleresize);

  Network.addListener("networkStatusChange", (status) => {
    let newStatus = status.connected;
    if (newStatus === Globals.online) {
      return;
    }
    Globals.online = newStatus;
    if (newStatus) {
      PopupUtils.showOnlinePopup(`
      <div id="onlinePopup">
          <div class="divPositionTitle">Vous êtes en ligne</div>
          <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
          <div class="divPopupContent">
            Toutes les fonctionnalités de l'application sont de nouveau disponibles.
          </div>
      </div>
      `, map);
    } else {
      PopupUtils.showOnlinePopup(`
      <div id="onlinePopup">
          <div class="divPositionTitle">Vous êtes hors ligne</div>
          <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
          <div class="divPopupContent">
            La plupart des fonctionnalités de l'application sont désormais indisponibles. Vous pouvez consulter les cartes et données déjà chargées, ainsi que les données enregistrées, et visualiser votre position sur la carte.
          </div>
      </div>
      `, map);
    }
  });

  App.addListener("resume", () => {
    if (Capacitor.getPlatform() === "web") {
      return;
    }
    TextZoom.getPreferred().then(value => {
      const newValue = Math.min(1.5, value.value);
      TextZoom.set({
        value: newValue
      });
      document.documentElement.style.fontSize = `calc(13px * ${newValue})`;
      document.documentElement.style.setProperty("--text-zoom", newValue);
    });
  });

  const handleScrollDown = () => {
    Globals.currentScrollIndex = 1;
    Globals.menu.updateScrollAnchors();
    if (window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches ) {
      window.scroll({
        top: 0,
        left: 0,
        behavior: "smooth"
      });
    }
  };

  window.addEventListener("scroll", () => {
    DOM.$bottomButtons.classList.remove("opacity0");
    DOM.$routeDrawEdit.classList.remove("opacity0");
    DOM.$filterPoiBtn.classList.remove("opacity0");
    if (DOM.$fullScreenBtn) {
      DOM.$fullScreenBtn.classList.remove("opacity0");
    }
    const thresh = window.innerHeight / 2;
    if (!window.matchMedia("screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches && window.scrollY > thresh) {
      DOM.$bottomButtons.classList.add("opacity0");
      DOM.$routeDrawEdit.classList.add("opacity0");
      DOM.$filterPoiBtn.classList.add("opacity0");
      if (DOM.$fullScreenBtn) {
        DOM.$fullScreenBtn.classList.add("opacity0");
      }
    }
    const insetTop = Math.round(parseFloat(getComputedStyle(document.body).getPropertyValue("--safe-area-inset-top").slice(0, -2)));
    const insetBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-bottom").slice(0, -2));
    const navHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-bar-height").slice(0, -2));

    if (window.scrollY >= window.innerHeight - 72 - Math.max(insetBottom - 10 - navHeight, 20) - insetTop) {
      DOM.$tabContainer.classList.add("scrolledMax");
      document.getElementById("tabHandle").addEventListener("click", handleScrollDown);
    } else {
      DOM.$tabContainer.classList.remove("scrolledMax");
      document.getElementById("tabHandle").removeEventListener("click", handleScrollDown);
    }
  });

  // Partage par liens
  App.addListener("appUrlOpen", () => {
    App.getLaunchUrl().then( (url) => {
      if (url && url.url) {
        if (url.url.split("://")[0] === "https") {
          const urlParams = new URLSearchParams(url.url.split("?")[1]);
          if (urlParams.get("lng") && urlParams.get("lat")) {
            while (Globals.backButtonState.split("-")[0] !== "default") {
              State.onBackKeyDown();
            }
            const zoom = parseFloat(urlParams.get("z")) || map.getZoom();
            const center = { lng: parseFloat(urlParams.get("lng")), lat: parseFloat(urlParams.get("lat")) };
            map.flyTo({zoom: zoom, center: center});
            map.once("moveend", () => {
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
            });
          }
        }
      }
    });
  });
}

export default {
  addListeners,
};

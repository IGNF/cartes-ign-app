import Geocode from "./services/geocode";
import Location from "./services/location";
import DOM from "./dom";
import Globals from "./globals";
import State from "./state";
import MapLibreGL from "maplibre-gl";
import { Capacitor } from "@capacitor/core";
import { SafeAreaController } from "@aashu-dubey/capacitor-statusbar-safe-area";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Network } from "@capacitor/network";
import { TextZoom } from "@capacitor/text-zoom";
import { App } from "@capacitor/app";

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
    if ( evt.target.classList.contains("autocompresult") || evt.target.classList.contains("recentresult")) {
      geocode = true;
      evt.target.classList.add("autocompresultselected");
      DOM.$rech.value = evt.target.getAttribute("fulltext");
      if (evt.target.classList.contains("recentresult")) {
        coords = JSON.parse(evt.target.dataset.coordinates);
      }
    }
    // si recherches recentes ou autocompletion, on realise un geocodage
    if (geocode) {
      if (Globals.backButtonState === "searchDirections") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords);
          Globals.menu.open("directions");
        }, 250);
      } else if(Globals.backButtonState === "searchIsochrone") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords);
          Globals.menu.open("isochrone");
        }, 250);
      } else if(Globals.backButtonState === "searchLandmark") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value, coords);
          Globals.menu.open("landmark");
        }, 250);
      } else {
        Geocode.searchAndMoveTo(DOM.$rech.value, coords);
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
    document.getElementById("informationsContentCGU").classList.add("d-none");
    document.getElementById("informationsContentLegal").classList.remove("d-none");
    $informationsScreenMenu.style.marginLeft = "-100%";
    Globals.backButtonState = "informationsScreenLegal";
  });
  document.getElementById("informationsItemsPrivacy").addEventListener("click", () => {
    document.getElementById("informationsContentLegal").classList.add("d-none");
    document.getElementById("informationsContentCGU").classList.add("d-none");
    document.getElementById("informationsContentPrivacy").classList.remove("d-none");
    $informationsScreenMenu.style.marginLeft = "-100%";
    Globals.backButtonState = "informationsScreenPrivacy";
  });
  document.getElementById("informationsItemsCGU").addEventListener("click", () => {
    document.getElementById("informationsContentLegal").classList.add("d-none");
    document.getElementById("informationsContentPrivacy").classList.add("d-none");
    document.getElementById("informationsContentCGU").classList.remove("d-none");
    $informationsScreenMenu.style.marginLeft = "-100%";
    Globals.backButtonState = "informationsScreenCGU";
  });

  // Rotation du marqueur de position (android)
  if (Capacitor.getPlatform() !== "ios") {
    window.addEventListener("deviceorientationabsolute", Location.getOrientation, true);
  }

  // Action du backbutton
  document.addEventListener("backbutton", State.onBackKeyDown, false);

  const saveState = () => {
    while (Globals.backButtonState !== "default") {
      State.onBackKeyDown();
    }
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastLayersDisplayed", JSON.stringify(Globals.layersDisplayed));
    localStorage.setItem("savedRoutes", JSON.stringify(Globals.myaccount.routes));
    localStorage.setItem("savedLandmarks", JSON.stringify(Globals.myaccount.landmarks));
  };

  // Sauvegarde de l'état de l'application
  App.addListener("pause", saveState);
  document.addEventListener("pause", saveState);
  window.addEventListener("beforeunload", saveState);

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
    }
    if (["searchDirections", "searchIsochrone", "searchLandmark", "search"].includes(Globals.backButtonState)) {
      document.body.style.removeProperty("overflow-y");
      DOM.$backTopLeftBtn.style.removeProperty("box-shadow");
      DOM.$backTopLeftBtn.style.removeProperty("height");
      DOM.$backTopLeftBtn.style.removeProperty("width");
      DOM.$backTopLeftBtn.style.removeProperty("top");
      DOM.$backTopLeftBtn.style.removeProperty("left");
      if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        document.body.style.overflowY = "scroll";
        DOM.$backTopLeftBtn.style.boxShadow = "unset";
        DOM.$backTopLeftBtn.style.height = "44px";
        DOM.$backTopLeftBtn.style.width = "24px";
        DOM.$backTopLeftBtn.style.top = "calc(12px + var(--safe-area-inset-top))";
        DOM.$backTopLeftBtn.style.left = "15px";
      }
    }
    if (Globals.backButtonState === "routeDraw") {
      DOM.$bottomButtons.style.removeProperty("bottom");
      DOM.$bottomButtons.style.removeProperty("left");
      DOM.$bottomButtons.style.removeProperty("width");
      if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        if (!Globals.routeDraw.readonly) {
          DOM.$bottomButtons.style.bottom = "calc(72px + 112px + var(--safe-area-inset-bottom))";
        }
      } else {
        DOM.$bottomButtons.style.left = "min(50vw, calc(100vh + var(--safe-area-inset-left) + 42px))";
        DOM.$bottomButtons.style.width = "auto";
        if (!Globals.routeDraw.readonly) {
          DOM.$bottomButtons.style.bottom = "calc(112px + var(--safe-area-inset-bottom))";
        }
      }
    }
    if (["selectOnMapDirections", "selectOnMapIsochrone", "selectOnMapLandmark", "compare"].includes(Globals.backButtonState)) {
      Globals.currentScrollIndex = 0;
    }
    if (Globals.backButtonState === "compareLayers2") {
      DOM.$sideBySideLeftLayer.style.removeProperty("left");
      if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        DOM.$sideBySideLeftLayer.style.left = "calc(50% + 15px)";
      }
    }
    if (["compare", "compareLayers1", "compareLayers2"].includes(Globals.backButtonState)) {
      DOM.$bottomButtons.style.removeProperty("width");
      if (window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches) {
        DOM.$bottomButtons.style.width = "calc(100vw - var(--safe-area-inset-left) - var(--safe-area-inset-right))";
      }
    }
    Globals.menu.updateScrollAnchors();
  };

  // Screen dimentions change
  window.addEventListener("resize", handleresize);
  window.addEventListener("orientationchange", handleresize);

  // Mode offline
  let popup = null;
  function showOnlinePopup(content) {
    // on supprime la popup
    if (popup) {
      popup.remove();
      popup = null;
    }

    window.onCloseonlinePopup = () => {
      popup.remove();
    };

    // centre de la carte
    var center = map.getCenter();
    // position de la popup
    var popupOffsets = {
      "bottom": [0, 100],
    };
    // ouverture d'une popup
    popup = new MapLibreGL.Popup({
      offset: popupOffsets,
      className: "onlinePopup",
      closeOnClick: true,
      closeOnMove: true,
      closeButton: false
    })
      .setLngLat(center)
      .setHTML(content)
      .setMaxWidth("300px")
      .addTo(map);
  }

  Network.addListener("networkStatusChange", (status) => {
    let newStatus = status.connected;
    if (newStatus === Globals.online) {
      return;
    }
    Globals.online = newStatus;
    if (newStatus) {
      showOnlinePopup(`
      <div id="onlinePopup">
          <div class="divPositionTitle">Vous êtes en ligne</div>
          <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
          <div class="divPopupContent">
            Toutes les fonctionnalités de l'application sont de nouveau disponibles.
          </div>
      </div>
      `);
    } else {
      showOnlinePopup(`
      <div id="onlinePopup">
          <div class="divPositionTitle">Vous êtes hors ligne</div>
          <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
          <div class="divPopupContent">
            La plupart des fonctionnalités de l'application sont désormais indisponibles. Vous pouvez consulter les cartes et données déjà chargées, ainsi que les données enregistrées, et visualiser votre position sue la carte.
          </div>
      </div>
      `);
    }
  });

  window.addEventListener("controlsloaded", () => {
    Network.getStatus().then((status) => {
      if (!status.connected) {
        showOnlinePopup(`
        <div id="onlinePopup">
        <div class="divPositionTitle">Vous êtes hors ligne</div>
        <div class="divPopupClose" onclick="onCloseonlinePopup(event)"></div>
        <div class="divPopupContent">
        La plupart des fonctionnalités de l'application sont indisponibles. Vous pouvez consulter les cartes et données déjà chargées, ainsi que les données enregistrées, et visualiser votre position sue la carte.
        </div>
        </div>
        `);
      }
    });
  });

  window.addEventListener("controlsloaded", () => {
    if (Capacitor.getPlatform() === "web") {
      return;
    }
    TextZoom.getPreferred().then(value => {
      TextZoom.set(value);
    });
  });

  App.addListener("resume", () => {
    if (Capacitor.getPlatform() === "web") {
      return;
    }
    TextZoom.getPreferred().then(value => {
      TextZoom.set(value);
    });
  });

  window.addEventListener("scroll", (e) => {
    DOM.$bottomButtons.style.removeProperty("transform");
    DOM.$routeDrawEdit.style.removeProperty("transform");
    DOM.$filterPoiBtn.style.removeProperty("transform");
    if (!window.matchMedia("(min-width: 615px), screen and (min-aspect-ratio: 1/1) and (min-width:400px)").matches && window.scrollY > window.innerHeight / 2) {
      DOM.$bottomButtons.style.transform = "translateY(-100vh)";
      DOM.$routeDrawEdit.style.transform = "translateX(100vw)";
      DOM.$filterPoiBtn.style.transform = "translateY(-100vh)";
    }
  })
}

export default {
  addListeners,
};

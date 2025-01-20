/**
 * Copyright (c) Institut national de l'information géographique et forestière
 *
 * This program and the accompanying materials are made available under the terms of the GPL License, Version 3.0.
 */

import Globals from "./globals";
import DOM from "./dom";
import { App } from "@capacitor/app";

/**
 * Back Button
 * @todo rendre cette fonction générique
 * @todo supprimer la dependance à "MenuDisplay"
 */
const onBackKeyDown = () => {
  // Handle the back button
  const previousState = Globals.backButtonState.split("-")[1] || "default";
  const previousStates = Globals.backButtonState.split("-");
  const backState = Globals.backButtonState.split("-")[0];
  /* comportements custom */
  if (backState == "default") {
    App.exitApp();
    return;
  }
  if (backState === "myaccount") {
    DOM.$whiteScreen.style.removeProperty("animation");
    Globals.myaccount.hide();
    return;
  }
  if (backState === "informationsScreen") {
    Globals.menu.close("informationsScreen");
    Globals.menu.open("myaccount");
    return;
  }
  if (backState === "layerManager") {
    Globals.menu.close("layerManager");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "directions") {
    Globals.menu.close("directions");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "searchDirections") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchDirections");
    return;
  }
  if (backState === "isochrone") {
    Globals.menu.close("isochrone");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "landmark") {
    Globals.menu.close("landmark");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "searchIsochrone") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchIsochrone");
    return;
  }
  if (backState === "searchLandmark") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchLandmark");
    return;
  }
  if (backState === "searchDownload") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchDownload");
    Globals.menu.open("myaccount");
    return;
  }
  if (backState === "position") {
    Globals.position.hide();
    // réouverture de menu précédent
    if (!["default", "signalement", "signalementOSM"].includes(previousState)) {
      Globals.menu.open(previousState, 0);
      return;
    }
    return;
  }
  if (backState === "poi") {
    Globals.menu.close("poi");
    // réouverture de menu précédent
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "compareLayers1") {
    Globals.menu.close("compareLayers1");
    if (previousStates.includes("compareLandmark")) {
      Globals.menu.open("compareLandmark");
      return;
    }
    return;
  }
  if (backState === "compareLayers2") {
    Globals.menu.close("compareLayers2");
    if (previousStates.includes("compareLandmark")) {
      Globals.menu.open("compareLandmark");
      return;
    }
    return;
  }
  if (backState === "selectOnMapCompareLandmark") {
    Globals.menu.close("selectOnMapCompareLandmark");
    if (previousState === "compareLandmark") {
      Globals.menu.open("compareLandmark");
      return;
    }
    return;
  }
  if (backState === "routeDraw") {
    Globals.routeDraw.hide();
    return;
  }
  if (backState === "selectOnMapDirections") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("selectOnMapDirections");
    return;
  }
  if (backState === "selectOnMapIsochrone") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("selectOnMapIsochrone");
    return;
  }
  if (backState === "selectOnMapLandmark") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("selectOnMapLandmark");
    return;
  }
  if (backState === "comparePoiActivated") {
    document.getElementById("comparePoiWindow").querySelector(".comparePoiText").classList.add("d-none");
    document.getElementById("comparePoiWindow").querySelector(".comparePoiButton").classList.remove("d-none");
    Globals.currentScrollIndex = 0;
    Globals.menu.open("compare");
    return;
  }
  if (backState === "signalement") {
    Globals.menu.close("signalement");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "signalementOSM") {
    Globals.menu.close("signalementOSM");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (backState === "offlineMapsLocked") {
    Globals.offlineMaps.unlockView();
    return;
  }
  if (backState === "offlineMapsDownloading") {
    return;
  }
  if (backState === "offlineMapsName") {
    return;
  }
  if (["informationsScreenLegal", "informationsScreenPrivacy", "informationsScreenAccessibility"].includes(backState)) {
    const $informationsScreenMenu = document.getElementById("informationsScreenMenu");
    $informationsScreenMenu.style.removeProperty("margin-left");
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
      });
    }, 500);
    Globals.backButtonState = "informationsScreen";
    return;
  }
  /* comportement par défaut */
  Globals.menu.close(backState);
};

export default {
  onBackKeyDown
};

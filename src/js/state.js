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
  var previousState;
  if (Globals.backButtonState == "default") {
    App.exitApp();
    return;
  }
  if (Globals.backButtonState === "search") {
    Globals.menu.close("search");
    return;
  }
  if (Globals.backButtonState === "myaccount") {
    DOM.$whiteScreen.style.removeProperty("animation");
    Globals.myaccount.hide();
    return;
  }
  if (Globals.backButtonState === "informationsScreen") {
    Globals.menu.close("informationsScreen");
    Globals.menu.open("myaccount");
    return;
  }
  if (Globals.backButtonState === "auth") {
    Globals.menu.close("auth");
    Globals.menu.open("myaccount");
    return;
  }
  if (Globals.backButtonState === "informations") {
    Globals.menu.close("informations");
    return;
  }
  if (Globals.backButtonState.split("-")[0] === "layerManager") {
    previousState = Globals.backButtonState.split("-")[1] || "default";
    Globals.menu.close("layerManager");
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (Globals.backButtonState === "directions") {
    Globals.menu.close("directions");
    return;
  }
  if (Globals.backButtonState === "searchDirections") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchDirections");
    return;
  }
  if (Globals.backButtonState === "directionsResults") {
    Globals.menu.close("directionsResults");
    return;
  }
  if (Globals.backButtonState === "isochrone") {
    Globals.menu.close("isochrone");
    return;
  }
  if (Globals.backButtonState === "landmark") {
    Globals.menu.close("landmark");
    return;
  }
  if (Globals.backButtonState === "searchIsochrone") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchIsochrone");
    return;
  }
  if (Globals.backButtonState === "searchLandmark") {
    const closesearch = new Event("closesearch");
    window.dispatchEvent(closesearch);
    Globals.menu.close("searchLandmark");
    return;
  }
  if (Globals.backButtonState.split("-")[0] === "position") {
    previousState = Globals.backButtonState.split("-")[1] || "default";
    Globals.position.hide();
    // réouverture de menu précédent
    if (!["default", "signalement", "signalementOSM"].includes(previousState)) {
      Globals.menu.open(previousState, 0);
      return;
    }
    return;
  }
  if (Globals.backButtonState.split("-")[0] === "poi") {
    previousState = Globals.backButtonState.split("-")[1];
    Globals.menu.close("poi");
    // réouverture de menu précédent
    if (previousState !== "default") {
      Globals.menu.open(previousState);
      return;
    }
    return;
  }
  if (Globals.backButtonState === "compare") {
    Globals.menu.close("compare");
    return;
  }
  if (Globals.backButtonState === "compareLayers1") {
    Globals.menu.close("compareLayers1");
    return;
  }
  if (Globals.backButtonState === "compareLayers2") {
    Globals.menu.close("compareLayers2");
    return;
  }
  if (Globals.backButtonState === "routeDraw") {
    Globals.routeDraw.hide();
    return;
  }
  if (Globals.backButtonState === "routeDrawSave") {
    Globals.menu.close("routeDrawSave");
    return;
  }
  if (Globals.backButtonState === "selectOnMapDirections") {
    Globals.menu.close("selectOnMapDirections");
    return;
  }
  if (Globals.backButtonState === "selectOnMapIsochrone") {
    Globals.menu.close("selectOnMapIsochrone");
    return;
  }
  if (Globals.backButtonState === "selectOnMapLandmark") {
    Globals.menu.close("selectOnMapLandmark");
    return;
  }
  if (Globals.backButtonState === "comparePoi") {
    Globals.menu.close("comparePoi");
    return;
  }
  if (Globals.backButtonState === "comparePoiActivated") {
    document.getElementById("comparePoiWindow").querySelector(".comparePoiText").classList.add("d-none");
    document.getElementById("comparePoiWindow").querySelector(".comparePoiButton").classList.remove("d-none");
    Globals.currentScrollIndex = 0;
    Globals.menu.open("compare");
    return;
  }
  if (Globals.backButtonState === "signalement") {
    Globals.menu.close("signalement");
    return;
  }
  if (Globals.backButtonState === "signalementOSM") {
    Globals.menu.close("signalementOSM");
    return;
  }
  if (["informationsScreenLegal", "informationsScreenPrivacy", "informationsScreenAccessibility"].includes(Globals.backButtonState)) {
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
};

export default {
  onBackKeyDown
};

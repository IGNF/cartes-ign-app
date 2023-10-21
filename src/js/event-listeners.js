import maplibregl from "maplibre-gl";

import Geocode from './services/geocode';
import Location from './services/location';
import MenuDisplay from './menu-display';
import DOM from './dom';
import Globals from './globals';
import Texts from './texts';
import RecentSearch from "./search-recent";
import State from "./state";

/**
 * Ecouteurs generiques
 * @todo terminer le nettoyage avec les ecouteurs pour les classes layerManager & MyAccount
 */
function addListeners() {

  const map = Globals.map;

  /* event listeners pour élément non existants au démarrage */
  document.querySelector('body').addEventListener('click', (evt) => {
    var geocode = false;
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      geocode = true;
      evt.target.className = "autocompresultselected";
      DOM.$rech.value = evt.target.getAttribute("fulltext");
    }
    /* Résultats recherches recentes */
    if ( evt.target.classList.contains('recentresult') ) {
      geocode = true;
      DOM.$rech.value = evt.target.textContent;
    }
    // si recherches recentes ou autocompletion, on realise un geocodage
    if (geocode) {
      if (Globals.backButtonState === "searchDirections") {
        Geocode.search(DOM.$rech.value);
        setTimeout(Globals.menu.open("directions"), 150);
      } else if(Globals.backButtonState === "searchIsochrone") {
        Geocode.search(DOM.$rech.value);
        setTimeout(Globals.menu.open("isochrone"), 150);
      } else {
        Geocode.searchAndMoveTo(DOM.$rech.value);
        setTimeout(Globals.menu.close("search"), 150);
      }
      RecentSearch.add(DOM.$rech.value);
    }
  }, true);

  // TODO 
  // Ecouteurs sur les couches : à ajouter sur le gestionnaire de couches
  document.querySelectorAll(".layer-info").forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      DOM.$infoText.innerHTML = Texts.informationTexts[el.getAttribute("layername")];
      Globals.menu.close("layerManager");
      MenuDisplay.openInfos();
    });
  });
  document.querySelectorAll(".layer-legend").forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      DOM.$legendImg.innerHTML = Texts.legendImgs[el.getAttribute("layername")];
      Globals.menu.close("layerManager");
      MenuDisplay.openLegend();
    });
  });

  // TODO
  // Ecouteurs sur le menu du Compte : à ajouter sur la classe MyAccount
  document.getElementById('menuItemParamsIcon').addEventListener('click', () => { Globals.menu.open('parameterScreen')});
  document.getElementById('menuItemPlusLoin').addEventListener('click', () => { Globals.menu.open('plusLoinScreen')});
  document.getElementById('menuItemLegal').addEventListener('click', () => { Globals.menu.open('legalScreen')});
  document.getElementById('menuItemPrivacy').addEventListener('click', () => { Globals.menu.open('privacyScreen')});

  // TODO 
  // Ecouteurs sur les couches : à ajouter sur le gestionnaire de couches
  document.getElementById("infoWindowClose").addEventListener('click', MenuDisplay.closeInfos);
  document.getElementById("legendWindowClose").addEventListener('click', MenuDisplay.closeLegend);

  // Rotation du marqueur de position
  window.addEventListener("deviceorientationabsolute", Location.getOrientation, true);

  // Action du backbutton
  document.addEventListener("backbutton", State.onBackKeyDown, false);

  // Sauvegarde de l'état de l'application
  document.addEventListener('pause', () => {
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastBaseLayerDisplayed", Globals.baseLayerDisplayed);
    localStorage.setItem("lastDataLayerDisplayed", Globals.dataLayerDisplayed);
  });

  window.addEventListener('beforeunload', () => {
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastBaseLayerDisplayed", Globals.baseLayerDisplayed);
    localStorage.setItem("lastDataLayerDisplayed", Globals.dataLayerDisplayed);
  });

  // Screen dimentions change
  window.addEventListener("resize", () => {
    Globals.menu.updateScrollAnchors();
  });

  document.onscroll = scrollEndCallback;

  function scrollEndCallback() {
    /** TODO: scroll end snapping
    if (Globals.ignoreNextScrollEvent) {
      // Ignore this event because it was done programmatically
      Globals.ignoreNextScrollEvent = false;
      Globals.currentScroll = window.scrollY;
      return;
    }
    let isScrollUp = window.scrollY > Globals.currentScroll;
    let isScrollDown = window.scrollY < Globals.currentScroll;

    if (isScrollUp && Globals.currentScrollIndex < Globals.anchors.length - 1) {
      Globals.currentScrollIndex += 1;
      if (window.scrollY > Globals.maxScroll - 50) {
        Globals.currentScrollIndex = Globals.anchors.length - 1;
      }
    }
    if (isScrollDown && Globals.currentScrollIndex > 0) {
      Globals.currentScrollIndex -= 1;
      if (window.scrollY < 50) {
        Globals.currentScrollIndex = 0;
      }
    }
    MenuDisplay.scrollTo(Globals.anchors[Globals.currentScrollIndex]);
    **/
    if (window.scrollY === 0) {
      Globals.currentScrollIndex = 0;
    } else if (window.scrollY === Globals.maxScroll) {
      Globals.currentScrollIndex = 2;
    }

    if (Globals.currentScrollIndex > 0 && Globals.backButtonState == 'default') {
      Globals.backButtonState = 'mainMenu';
    }
    if (Globals.currentScrollIndex == 0 && Globals.backButtonState == 'mainMenu') {
      Globals.backButtonState = 'default';
    }
  }
  
  // FIXME à deplacer ? 
  // document.getElementById("drawroute").addEventListener("click", Controls.startDrawRoute);
}

export default {
  addListeners,
};

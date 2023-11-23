import maplibregl from "maplibre-gl";

import Geocode from './services/geocode';
import Location from './services/location';
import DOM from './dom';
import Globals from './globals';
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
    /* Résultats autocompletion  et recherche récente */
    if ( evt.target.classList.contains('autocompresult') || evt.target.classList.contains('recentresult')) {
      geocode = true;
      evt.target.classList.add("autocompresultselected");
      DOM.$rech.value = evt.target.getAttribute("fulltext");
    }
    // si recherches recentes ou autocompletion, on realise un geocodage
    if (geocode) {
      if (Globals.backButtonState === "searchDirections") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value);
          Globals.menu.open("directions");
        }, 250);
      } else if(Globals.backButtonState === "searchIsochrone") {
        setTimeout(() => {
          Geocode.search(DOM.$rech.value);
          Globals.menu.open("isochrone");
        }, 250);
      } else {
        Geocode.searchAndMoveTo(DOM.$rech.value);
        setTimeout(() => Globals.menu.close("search"), 250);
      }
      setTimeout(() =>  RecentSearch.add(DOM.$rech.value.trim()), 260);
    }
  }, true);

  // TODO
  // Ecouteurs sur le menu du Compte : à ajouter sur la classe MyAccount
  document.getElementById('menuItemParamsIcon').addEventListener('click', () => { Globals.menu.open('parameterScreen')});
  document.getElementById('menuItemLegal').addEventListener('click', () => { Globals.menu.open('legalScreen')});
  document.getElementById('menuItemPrivacy').addEventListener('click', () => { Globals.menu.open('privacyScreen')});

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

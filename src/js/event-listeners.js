import maplibregl from "maplibre-gl";

import Autocomp from './autocomplete';
// import Coords from './coordinates';
import Geocode from './geocode';
import LayerSwitch from './layer-switch';
import Location from './location';
import MenuDisplay from './menu-display';
import MapControls from './map-controls';
import UpdateLegend from './update-legend';
import DOM from './dom';
import Globals from './globals';
import Texts from './texts';
import Layers from './layers';
import RecentSearch from "./search-recent";

import { App } from '@capacitor/app';

function addEventListeners() {

  const map = Globals.map;

  // Recherche du 1er résultat de l'autocomplétion si appui sur entrée
  DOM.$rech.addEventListener("keyup", (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
      Geocode.searchAndMoveTo(DOM.$rech.value);
      MenuDisplay.searchScreenOff();
    } else if (DOM.$rech.value !== ""){
      let resultStr = "";
      Autocomp.suggest().then( () => {
        if (Globals.autocompletion_results.length > 0){
          for (let i = 0 ; i < Globals.autocompletion_results.length; i++) {
            resultStr += `<p class='autocompresult' fulltext='${Globals.autocompletion_results[i].fulltext}'>
            <em class='autocompkind'>${Globals.autocompletion_results[i].kind}</em><br/>
            ${Globals.autocompletion_results[i].fulltext} </p>` ;
          }
          DOM.$resultDiv.innerHTML = resultStr;
          DOM.$resultDiv.hidden = false;
        }
      });
    } else if (DOM.$rech.value === "") {
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
    }
  });

  DOM.$rech.addEventListener("click", (event) => {
    DOM.$rech.value = "";
    DOM.$resultDiv.hidden = true;
    DOM.$resultDiv.innerHTML = "";
  });

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
        setTimeout(MenuDisplay.openDirections, 150);
      } else {
        Geocode.searchAndMoveTo(DOM.$rech.value);
        setTimeout(MenuDisplay.searchScreenOff, 150)
      }
      RecentSearch.add(DOM.$rech.value);
    }
  }, true);

  /* event listeners statiques */
  // Couches
  document.querySelectorAll(".baseLayer").forEach((el) => {
    el.addEventListener('click', () => LayerSwitch.displayBaseLayer(el.id));
  });
  document.querySelectorAll(".dataLayer").forEach((el) => {
    el.addEventListener('click', () => LayerSwitch.displayDataLayer(el.id));
  });
  document.querySelectorAll(".layer-info").forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      DOM.$infoText.innerHTML = Texts.informationTexts[el.getAttribute("layername")];
      MenuDisplay.closeCat();
      MenuDisplay.openInfos();
    });
  });
  document.querySelectorAll(".layer-legend").forEach((el) => {
    el.addEventListener('click', (ev) => {
      ev.stopPropagation();
      DOM.$legendImg.innerHTML = Texts.legendImgs[el.getAttribute("layername")];
      MenuDisplay.closeCat();
      MenuDisplay.openLegend();
    });
  });

  // Ouverture-Fermeture
  DOM.$catalogBtn.addEventListener('click', MenuDisplay.openCat);
  DOM.$backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  DOM.$geolocateBtn.addEventListener('click', Location.locationOnOff);
  // DOM.$chkPrintCoordsReticule.addEventListener('change', Coords.reticuleOnOff);

  // Recherche
  DOM.$rech.addEventListener('focus', function () {
    if (Globals.backButtonState === "default" || Globals.backButtonState === "mainMenu") {
      MenuDisplay.searchScreenOn();
    }
  });
  DOM.$closeSearch.addEventListener("click", onBackKeyDown);

  document.getElementById('menuItemParamsIcon').addEventListener('click', MenuDisplay.openParamsScreen);
  document.getElementById('menuItemPlusLoin').addEventListener('click', MenuDisplay.openPlusLoinScreen);
  document.getElementById('menuItemLegal').addEventListener('click', MenuDisplay.openLegalScreen);
  document.getElementById('menuItemPrivacy').addEventListener('click', MenuDisplay.openPrivacyScreen);

  document.getElementById("infoWindowClose").addEventListener('click', MenuDisplay.closeInfos);
  document.getElementById("catalogWindowClose").addEventListener('click', MenuDisplay.closeCat);
  document.getElementById("legendWindowClose").addEventListener('click', MenuDisplay.closeLegend);
  document.getElementById("directionsWindowClose").addEventListener('click', MenuDisplay.closeDirections);
  document.getElementById("isochronWindowClose").addEventListener('click', MenuDisplay.closeIsochron);
  document.getElementById("mypositionWindowClose").addEventListener('click', MenuDisplay.closeMyPosition);

  // Rotation du marqueur de position
  window.addEventListener("deviceorientationabsolute", Location.getOrientation, true);
  /**/

  // Légende en fonction du zoom
  map.on("zoomend", UpdateLegend.updateLegend);

  // Action du backbutton
  document.addEventListener("backbutton", onBackKeyDown, false);

  function onBackKeyDown() {
    // Handle the back button
    if (Globals.backButtonState == 'default') {
      App.exitApp();
    }
    if (Globals.backButtonState === 'search') {
      MenuDisplay.closeSearchScreen();
    }
    if (Globals.backButtonState === 'mainMenu') {
      MenuDisplay.closeMenu();
    }
    if (Globals.backButtonState === 'params') {
      MenuDisplay.closeParamsScreen();
    }
    if (Globals.backButtonState === 'legal') {
      MenuDisplay.closeLegalScreen();
    }
    if (Globals.backButtonState === 'privacy') {
      MenuDisplay.closePrivacyScreen();
    }
    if (Globals.backButtonState === 'plusLoin') {
      MenuDisplay.closePlusLoinScreen();
    }
    if (Globals.backButtonState === 'infos') {
      MenuDisplay.closeInfos();
    }
    if (Globals.backButtonState === 'legend') {
      MenuDisplay.closeLegend();
    }
    if (Globals.backButtonState === 'catalog') {
      MenuDisplay.closeCat();
    }
    if (Globals.backButtonState === 'directions') {
      MenuDisplay.closeDirections();
    }
    if (Globals.backButtonState === 'searchDirections') {
      MenuDisplay.closeSearchDirections();
    }
    if (Globals.backButtonState === 'resultsDirections') {
      MenuDisplay.closeResultsDirections();
    }
    if (Globals.backButtonState === 'isochron') {
      MenuDisplay.closeIsochron();
    }
    if (Globals.backButtonState === 'searchIsochron') {
      MenuDisplay.closeSearchIsochron();
    }
    if (Globals.backButtonState === 'myposition') {
      MenuDisplay.closeMyPosition();
    }
  }

  // Rotation de la carte avec le mutlitouch
  map.on('rotate', () => {
    console.log(map.getBearing());
    DOM.$compassBtn.style.transform = "rotate(" + (map.getBearing() * -1) + "deg)";
    DOM.$compassBtn.classList.remove("d-none");
  });

  // Rotation de la boussole
  DOM.$compassBtn.addEventListener("click", () => {
    if (Location.tracking_active){
      // De tracking a simple suivi de position
      Location.locationOnOff();
      Location.locationOnOff();
    }
    map.setBearing(Math.round((map.getBearing() % 360) + 360 ) % 360);

    let interval;
    let currentRotation

    function animateRotate() {
      if (map.getBearing() < 0) {
        currentRotation = map.getBearing() + 1;

      } else {
        currentRotation = map.getBearing() - 1;
      }

      map.setBearing(currentRotation);

      if (currentRotation % 360 == 0) {
        clearInterval(interval);
        DOM.$compassBtn.style.pointerEvents = "";
        DOM.$compassBtn.classList.add("d-none");
      }
    }

    DOM.$compassBtn.style.pointerEvents = "none";
    interval = setInterval(animateRotate, 2);
  });

  // Désactivation du tracking au déplacement non programmatique de la carte
  map.on('movestart', function () {
    if (Globals.movedFromCode) {
      return
    } else if (Location.tracking_active){
      // De tracking a simple suivi de position
      Location.locationOnOff();
      Location.locationOnOff();
    }
  });

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
    MenuDisplay.updateScrollAnchors();
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

  /* TODO: Not supported... */
  // document.addEventListener("scrollend", scrollEndCallback);

  /* Menu Buttons */
  document.getElementById("directions").addEventListener("click", () => {
    MenuDisplay.openDirections();
  });
  document.getElementById("isochron").addEventListener("click", () => {
    MenuDisplay.openIsochron();
  });
  document.getElementById("myposition").addEventListener("click", () => {
    MenuDisplay.openMyPosition();
  });

  // GetFeatureInfo on map click
  function latlngToTilePixel(lat, lng, zoom) {
    const fullXTile = (lng + 180) / 360 * Math.pow(2, zoom);
    const fullYTile = (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
    const tile = {
      x: Math.floor(fullXTile),
      y: Math.floor(fullYTile),
    };
    const tilePixel = {
      x: Math.floor((fullXTile - tile.x) * 256),
      y: Math.floor((fullYTile - tile.y) * 256),
    };
    return [tile, tilePixel]
  }

  map.on("click", (ev) => {
    let currentLayer = Globals.baseLayerDisplayed;
    if (Globals.dataLayerDisplayed !== '') {
      currentLayer = Globals.dataLayerDisplayed;
    } else if (Globals.mapState === "compare") {
      return
    }
    const layerProps = Layers.layerProps[currentLayer];
    let computeZoom = map.getZoom();
    if (computeZoom > layerProps.maxNativeZoom) {
      computeZoom = layerProps.maxNativeZoom;
    } else if (computeZoom < layerProps.minNativeZoom) {
      computeZoom = layerProps.minNativeZoom;
    }

    const [ tile, tilePixel ] = latlngToTilePixel(ev.lngLat.lat, ev.lngLat.lng, computeZoom);
    fetch(
      `https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?` +
      `SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetFeatureInfo&` +
      `LAYER=${layerProps.layer}` +
      `&TILECOL=${tile.x}&TILEROW=${tile.y}&TILEMATRIX=${computeZoom}&TILEMATRIXSET=PM` +
      `&FORMAT=${layerProps.format}` +
      `&STYLE=${layerProps.style}&INFOFORMAT=text/html&I=${tilePixel.x}&J=${tilePixel.y}`
    ).then((response) => {
      if (!response.ok) {
        throw new Error("HTTP error");
      }
      return response.text()
    }).then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (doc.body.innerText === "\n  \n  \n") {
        throw new Error("Empty GFI");
      }
      new maplibregl.Popup()
        .setLngLat(ev.lngLat)
        .setHTML(html)
        .addTo(map);
    }).catch(() => {
      return
    })
  });

  document.getElementById("sideBySideOn").addEventListener("click", MapControls.addSideBySide);
  document.getElementById("drawRoute").addEventListener("click", MapControls.startDrawRoute);
  document.getElementById("sideBySideOff").addEventListener("click", MapControls.removeSideBySide);
  document.getElementById("directions").addEventListener("click", MapControls.removeSideBySide);
  document.getElementById("isochron").addEventListener("click", MapControls.removeSideBySide);
  document.getElementById("myposition").addEventListener("click", MapControls.removeSideBySide);
}

export default {
  addEventListeners,
};

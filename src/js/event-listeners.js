import * as Autocomp from './autocomplete';
import * as Coords from './coordinates';
import * as Geocode from './geocode';
import * as LayerSwitch from './layer-switch';
import * as Location from './location';
import * as MenuDisplay from './menu-display';
import * as UpdateLegend from './update-legend';
import DOM from './dom';
import Globals from './globals';


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
      Geocode.rechercheEtPosition(DOM.$rech.value);
      MenuDisplay.searchScreenOff();
    } else if (DOM.$rech.value !== ""){
      let resultStr = "";
      Autocomp.suggest().then( () => {
        if (Globals.autocompletion_results.length > 0){
          for (let i = 0 ; i < Globals.autocompletion_results.length; i++) {
            resultStr += "<p class='autocompresult'>" + Globals.autocompletion_results[i] + "</p>" ;
          }
          DOM.$resultDiv.innerHTML = resultStr;
          DOM.$resultDiv.hidden = false;
        }
      });
    }
  });

  /* event listeners pour élément non existants au démarrage */
  document.querySelector('body').addEventListener('click', (evt) => {
    /* fermeture catalogue */
    if ( evt.target.id !== 'catalog') {
      MenuDisplay.closeCat();
    }
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      evt.target.style.backgroundColor = '#0B6BA7';
      evt.target.style.color = 'white';
      DOM.$rech.value = evt.target.innerHTML;
      Geocode.rechercheEtPosition(DOM.$rech.value);
      setTimeout(MenuDisplay.searchScreenOff, 150)
    /* marqueur de recherche/position */
    } else if (evt.target.classList.contains("adressMarker")) {
      Geocode.cleanResults();
    } else if (evt.target.classList.contains("gpsMarker")) {
      Location.cleanGPS();
    /* pour aller + loin du message d'accueil */
    } else if (evt.target.classList.contains("msgGreen")) {
      DOM.$startPopup.hidden = true;
      MenuDisplay.openPlusLoinScreen();
    }
  }, true);

  /* event listeners statiques */
  // Couches
  document.getElementById("layerOrtho").addEventListener('click', LayerSwitch.displayOrtho);
  document.getElementById("layerRoutes").addEventListener('click', LayerSwitch.displayOrthoAndRoads);
  document.getElementById("layerCartes").addEventListener('click', LayerSwitch.displayCartes);
  document.getElementById("layerPlan").addEventListener('click', LayerSwitch.displayPlan);
  document.getElementById("layerParcels").addEventListener('click', LayerSwitch.displayOrthoAndParcels);
  document.getElementById("layerDrones").addEventListener('click', LayerSwitch.displayDrones);
  document.getElementById("layerTopo").addEventListener('click', LayerSwitch.displayTopo);
  document.getElementById("layerEtatMajor").addEventListener('click', LayerSwitch.displayEtatMajor);
  document.getElementById("layerOrthoHisto").addEventListener('click', LayerSwitch.displayOrthoHisto);

  // Bouton compris de la popup démarrage
  document.getElementById("compris").addEventListener('click', MenuDisplay.startPopupValidation);

  // Ouverture-Fermeture
  document.getElementById("catalogBtn").addEventListener('click', MenuDisplay.openCat);
  DOM.$backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  DOM.$geolocateBtn.addEventListener('click', Location.locationOnOff);
  DOM.$chkPrintCoordsReticule.addEventListener('change', Coords.reticuleOnOff);

  // Recherche
  DOM.$rech.addEventListener('focus', MenuDisplay.searchScreenOn);
  DOM.$closeSearch.addEventListener("click", onBackKeyDown);

  // Menu burger
  DOM.$menuBtn.addEventListener("click", MenuDisplay.openMenu);

  // Fermeture menu
  DOM.$menu.addEventListener('click', (evt) => {
    if (evt.target.id === 'menu') {
      MenuDisplay.closeMenu();
    }
  });

  document.getElementById('menuItemParams').addEventListener('click', MenuDisplay.openParamsScreen);
  document.getElementById('menuItemLegend').addEventListener('click', MenuDisplay.openLegend);
  document.getElementById('menuItemInfo').addEventListener('click', MenuDisplay.openInfos);
  document.getElementById('menuItemPlusLoin').addEventListener('click', MenuDisplay.openPlusLoinScreen);
  document.getElementById('menuItemLegal').addEventListener('click', MenuDisplay.openLegalScreen);
  document.getElementById('menuItemPrivacy').addEventListener('click', MenuDisplay.openPrivacyScreen);

  document.getElementById("infoWindowClose").addEventListener('click', MenuDisplay.closeInfos);
  document.getElementById("legendWindowClose").addEventListener('click', MenuDisplay.closeLegend);
  document.getElementById("menuWindowClose").addEventListener('click', MenuDisplay.closeMenu);

  // Synchronisation des radio button pour le type de coordonnées
  Array.from(document.getElementsByName("coordRadio")).forEach( elem => {
    elem.addEventListener("change", () => {
      Coords.updateCenterCoords(map.getCenter());
      const radioCheckedId = document.querySelector('input[name="coordRadio"]:checked').id;
      document.getElementById("coordTypeDisplay").innerHTML = document.querySelector(`label[for="${radioCheckedId}"]`).innerHTML;
    });
  });

  /**/

  // Légende en fonction du zoom
  map.on("zoomend", UpdateLegend.updateLegend);


  // Event coordonnées
  // Ouverture de la popup coordonnées
  function openCoords (latlng) {
    let coords = [latlng.lng, latlng.lat];
    let convertedCoords = Coords.convertCoords(coords);
    L.popup()
    .setLatLng(latlng)
    .setContent(convertedCoords[0] + ", " + convertedCoords[1])
    .openOn(map);
  }

  map.on('contextmenu', (event) => {
    if (DOM.$chkPrintCoordsOnContext.checked) {
      let latlng = map.mouseEventToLatLng(event.originalEvent);
      openCoords(latlng);
    }
  });

  // Coordonnées au déplacement de la carte
  map.on('move', () => {
    Coords.updateCenterCoords(map.getCenter());
  });

  // Action du backbutton
  document.addEventListener("backbutton", onBackKeyDown, false);

  function onBackKeyDown() {
    // Handle the back button
    if (Globals.backButtonState == 'default') {
      navigator.app.exitApp();
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
      Globals.backButtonState = 'default';
    }
  }


  // Rotation de la carte avec le mutlitouch
  let hammertime = new Hammer.Manager(DOM.$map);

  const rotate = new Hammer.Rotate()
  hammertime.add(rotate)

  let lastRotation;
  let startRotation;
  let rotationStarted = false;
  let disableRotation = false;

  hammertime.on('rotatemove', (e) => {
    if (DOM.$chkRotate.checked && !disableRotation) {
      let diff = startRotation - Math.round(e.rotation);
      Globals.currentRotation = lastRotation - diff;
      if (rotationStarted) {
        map.setBearing(Globals.currentRotation);
        DOM.$compassBtn.style.transform = "rotate(" + Globals.currentRotation + "deg)";
        DOM.$compassBtn.classList.remove("d-none");
      }
      if (Math.abs(diff) > 15 && !rotationStarted){
        rotationStarted = true;
        startRotation = Math.round(e.rotation);
      }
    }
  });

  hammertime.on('rotatestart', (e) => {
    if (DOM.$chkRotate.checked && !disableRotation) {
      lastRotation = Globals.currentRotation;
      startRotation = Math.round(e.rotation);
    }
  });

  hammertime.on('rotateend', () => {
    if (DOM.$chkRotate.checked) {
      if (!rotationStarted) {
        Globals.currentRotation = lastRotation;
      }
      rotationStarted = false;
      lastRotation = Globals.currentRotation;
    }
  });

  // Pas de rotation quand zoom
  let currentZoom = 0;
  map.on("zoomstart", () => {
    currentZoom = map.getZoom();
  });

  map.on("zoom", () => {
    if (Math.round(map.getZoom()) !== currentZoom && !rotationStarted) {
      disableRotation = true;
    }
  });

  map.on("zoomend", () => {
    disableRotation = false;
  });

  // Sauvegarde de l'état de l'application
  document.addEventListener('pause', () => {
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastLayerDisplayed", Globals.layerDisplayed);
  });

  // Rotation
  DOM.$compassBtn.addEventListener("click", () => {
    Globals.currentRotation = 0;
    map.setBearing(0);
    DOM.$compassBtn.style.transform = "rotate(" + 0 + "deg)";
    DOM.$compassBtn.classList.add("d-none");
  })

}

export {
  addEventListeners
};

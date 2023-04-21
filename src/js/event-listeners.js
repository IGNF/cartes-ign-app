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

  /* event listeners pour élément non existants au démarrage */
  document.querySelector('body').addEventListener('click', (evt) => {
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      evt.target.style.backgroundColor = '#0B6BA7';
      evt.target.style.color = 'white';
      DOM.$rech.value = evt.target.getAttribute("fulltext");
      Geocode.rechercheEtPosition(DOM.$rech.value);
      setTimeout(MenuDisplay.searchScreenOff, 150)
    /* marqueur de recherche/position */
    } else if (evt.target.classList.contains("adressMarker")) {
      Geocode.cleanResults();
    } else if (evt.target.classList.contains("gpsMarker")) {
      Location.cleanGPS();
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

  // Ouverture-Fermeture
  DOM.$catalogBtn.addEventListener('click', MenuDisplay.openCat);
  DOM.$backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  DOM.$geolocateBtn.addEventListener('click', Location.locationOnOff);
  DOM.$chkPrintCoordsReticule.addEventListener('change', Coords.reticuleOnOff);

  // Recherche
  DOM.$rech.addEventListener('focus', MenuDisplay.searchScreenOn);
  DOM.$closeSearch.addEventListener("click", onBackKeyDown);

  document.getElementById('menuItemParamsIcon').addEventListener('click', MenuDisplay.openParamsScreen);
  document.getElementById('menuItemLegend').addEventListener('click', MenuDisplay.openLegend);
  document.getElementById('menuItemInfo').addEventListener('click', MenuDisplay.openInfos);
  document.getElementById('menuItemPlusLoin').addEventListener('click', MenuDisplay.openPlusLoinScreen);
  document.getElementById('menuItemLegal').addEventListener('click', MenuDisplay.openLegalScreen);
  document.getElementById('menuItemPrivacy').addEventListener('click', MenuDisplay.openPrivacyScreen);

  document.getElementById("infoWindowClose").addEventListener('click', MenuDisplay.closeInfos);
  document.getElementById("catalogWindowClose").addEventListener('click', MenuDisplay.closeCat);
  document.getElementById("legendWindowClose").addEventListener('click', MenuDisplay.closeLegend);
  document.getElementById("measureWindowClose").addEventListener('click', MenuDisplay.closeMeasure);
  document.getElementById("measureAreaWindowClose").addEventListener('click', MenuDisplay.closeMeasureArea);

  // Rotation du marqueur de position
  window.addEventListener("deviceorientationabsolute", Location.getOrientation, true);

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
    }
    if (Globals.backButtonState === 'route') {
      document.querySelector("div[id^=GProutePanelClose-]").click();
    }
  }


  // Rotation de la carte avec le mutlitouch
  let hammertime = new Hammer.Manager(DOM.$map);

  const rotate = new Hammer.Rotate()
  hammertime.add(rotate)

  let lastRotation;
  let lastMarkerRotation;
  let startRotation;
  let rotationStarted = false;
  let disableRotation = false;

  hammertime.on('rotatemove', (e) => {
    if (DOM.$chkRotate.checked && !disableRotation) {
      let diff = startRotation - Math.round(e.rotation);
      Globals.currentRotation = lastRotation - diff;
      Globals.positionBearing = lastMarkerRotation - diff;

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
      lastMarkerRotation = Globals.positionBearing;
      startRotation = Math.round(e.rotation);
    }
  });

  hammertime.on('rotateend', () => {
    if (DOM.$chkRotate.checked) {
      if (!rotationStarted) {
        Globals.currentRotation = lastRotation;
        Globals.positionBearing = lastMarkerRotation;
      }
      rotationStarted = false;
      lastRotation = Globals.currentRotation;
      lastMarkerRotation = Globals.positionBearing;
    }
    console.log(Globals.currentRotation);
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

  map.on('movestart', function (e) {
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
    localStorage.setItem("lastLayerDisplayed", Globals.layerDisplayed);
  });

  // Rotation
  DOM.$compassBtn.addEventListener("click", () => {
    if (Location.tracking_active){
      // De tracking a simple suivi de position
      Location.locationOnOff();
      Location.locationOnOff();
    }
    Globals.currentRotation = ((Globals.currentRotation % 360) + 360 ) % 360;

    let interval;

    function animateRotate() {
      if (Globals.currentRotation < 180) {
        Globals.currentRotation -= 1;
      } else {
        Globals.currentRotation += 1;
      }
      map.setBearing(Globals.currentRotation);
      DOM.$compassBtn.style.transform = "rotate(" + Globals.currentRotation + "deg)";
      if (Globals.currentRotation % 360 == 0) {
        clearInterval(interval);
        DOM.$compassBtn.classList.add("d-none");
      }
    }

    interval = setInterval(animateRotate, 2);

  });

  // Screen dimentions change
  window.addEventListener("resize", () => {
    MenuDisplay.updateScrollAnchors();
  })

  // Bottom menu scroll
  delete Hammer.defaults.cssProps.userSelect;
  let hammertimeSwipe = new Hammer(DOM.$bottomMenu);
  hammertimeSwipe.get('swipe').set({
    direction: Hammer.DIRECTION_VERTICAL,
    threshold: 1,
    velocity: 0.1
  });

  hammertimeSwipe.on("swipeup swipedown", (e) => {
    if (e.type == "swipeup" && Globals.currentScrollIndex < Globals.anchors.length - 1) {
      Globals.currentScrollIndex += 1;
    }
    if (e.type == "swipedown" && Globals.currentScrollIndex > 0) {
      Globals.currentScrollIndex -= 1;
    }
    MenuDisplay.scrollTo(Globals.anchors[Globals.currentScrollIndex]);
    if (Globals.currentScrollIndex > 0 && Globals.backButtonState == 'default') {
      Globals.backButtonState = 'mainMenu';
    }
    if (Globals.currentScrollIndex == 0 && Globals.backButtonState == 'mainMenu') {
      Globals.backButtonState = 'default';
    }
  });

  /* Menu Buttons */
  document.getElementById("calculateRoute").addEventListener("click", () => {
    document.querySelector('[id^="GPshowRouteOpen-"]').click();
    MenuDisplay.openRoute();
  });

  document.getElementById("measure").addEventListener("click", () => {
    MenuDisplay.openMeasure();
  });

  document.getElementById("measureArea").addEventListener("click", () => {
    MenuDisplay.openMeasureArea();
  });

  /* Mesure sur la carte */
  map.on("polylinemeasure:change", (line) => {
    let distance = line.distance;
    if (distance < 100) {
      distance = Math.round(distance * 100) / 100;
    } else {
      distance = Math.round(distance);
    }
    if (distance < 1000) {
      DOM.$measureUnit.innerText = "m";
      DOM.$totalMeasure.innerText = distance;
    } else if (distance < 10000) {
      DOM.$measureUnit.innerText = "km";
      DOM.$totalMeasure.innerText = Math.round(distance / 100) / 10;
    } else {
      DOM.$measureUnit.innerText = "km";
      DOM.$totalMeasure.innerText = Math.round(distance / 1000);
    }
  });

  map.on('polylinemeasure:finish', () => {
    Globals.currentScrollIndex = 2;
    MenuDisplay.updateScrollAnchors();
  });



  map.on("draw:created", function (e) {
    Globals.polygonLayer = e.layer;
    map.addLayer(Globals.polygonLayer);
    let surface = L.GeometryUtil.geodesicArea(Globals.polygonLayer.getLatLngs()[0]);
    let unit = "m²";
    if (surface < 100) {
      surface = Math.round(surface * 100) / 100;
    } else {
      surface = Math.round(surface);
    }
    if (surface < 1000) {
      unit = "m²";
    } else if (surface < 10000) {
      unit = "ha";
      surface = Math.round(surface / 100) / 100;
    } else {
      unit = "ha";
      surface = Math.round(surface / 1000) / 10;
    }
    DOM.$areaMeasureText.innerText = `${surface} ${unit}`;

    Globals.currentScrollIndex = 2;
    MenuDisplay.updateScrollAnchors();
  });

}

export {
  addEventListeners,
};

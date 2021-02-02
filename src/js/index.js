import * as LayerSwitch from './layer-switch';
import * as MenuDisplay from './menu-display';
import * as UpdateLegend from './update-legend';
import DOM from './dom';
import Globals from './globals';


function app() {
  /**
   * Fonction définissant l'application
   */

  /* global: back button state */
  let backButtonState = 'default';

  /* global: last text in search bar */
  let lastTextInSearch = '';

  /* global: current map rotation */
  let currentRotation = 0;

  /* Demande d'autorisation au 1er lancement de l'appli */
  if (!localStorage.getItem("firstLocRequestDone")){
    requestLocationAccuracy();
    localStorage.setItem("firstLocRequestDone", true);
  }

  /* Message du jour (message of the day) */
  const motd_url = 'https://www.geoportail.gouv.fr/depot/app/motd.json?v=2';
  let motd_id;
  fetch(motd_url, {mode: 'cors'}).then( response => {
    response.json().then( data => {
      DOM.$message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
      motd_id = data.id;
    }).then( () => {
      if (!localStorage.getItem("lastMotdID") || (localStorage.getItem("lastMotdID") && (localStorage.getItem("lastMotdID") < motd_id))) {
        if(DOM.$message.innerHTML !== '') {
          DOM.$startPopup.classList.remove('d-none');
        }
      }
    });
  });

  // Pour l'annulation de fetch
  let controller = new AbortController();
  let signal = controller.signal;

  let marker_img_path = cordova.file.applicationDirectory + 'www/css/assets/position.svg';
  let marker2_img_path = cordova.file.applicationDirectory + 'www/css/assets/map-center.svg';

  // Définition du marker
  let gpMarkerIcon = L.icon({
    iconUrl: marker_img_path,
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'gpsMarker',
  });

  let gpMarkerIcon2 = L.icon({
    iconUrl: marker2_img_path,
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
    className:    'adressMarker',
  });

  const map = Globals.map;

  // Définition de la carte et des couches
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }
  // Initialisation des coordonnées du centre
  updateCenterCoords(map.getCenter());

  // Pour le "chargement" de l'état précédent
  // Par défaut : couche ortho
  switch (Globals.layerDisplayed) {
    case 'photos':
      LayerSwitch.displayOrtho();
      break;
    case 'routes':
      LayerSwitch.displayOrthoAndRoads();
      break;
    case 'cadastre':
      LayerSwitch.displayOrthoAndParcels();
      break;
    case 'plan-ign':
      LayerSwitch.displayPlan();
      break;
    case 'cartes':
      LayerSwitch.displayCartes();
      break;
    case 'drones':
      LayerSwitch.displayDrones();
      break;
    case 'topo':
      LayerSwitch.displayTopo();
      break;
    case 'etat-major':
      LayerSwitch.displayEtatMajor();
      break;
    case 'ortho-histo':
      LayerSwitch.displayOrthoHisto();
      break;
  }

  // Ajout de l'échelle
  L.control.scale({
    imperial: false,
    maxWidth: 150,
    position: "bottomleft",
  }).addTo(map);

  // Ouverture dans un nouvel onglet pour lien leaflet
  document.getElementsByClassName("leaflet-control-attribution")[0].getElementsByTagName("a")[0].setAttribute("target", "_blank");

  // Fermeture popup démarrage
  function startPopupValidation() {
    DOM.$startPopup.hidden = true;
    if (DOM.$chkNePlusAff.checked) {
      localStorage.setItem("lastMotdID", motd_id);
    }
  }

  /* Recherche et positionnnement */
  function cleanResults() {
    /**
     * Enlève le marqueur adresse
     */
    if (Globals.adressMarkerLayer != null) {
      map.removeLayer(Globals.adressMarkerLayer);
      Globals.adressMarkerLayer = null;
    }
  }

  function cleanGPS() {
    /**
     * Enlève le marqueur GPS
     */
    if (Globals.gpsMarkerLayer != null) {
      map.removeLayer(Globals.gpsMarkerLayer);
      Globals.gpsMarkerLayer = null;
    }
  }

  // Ouverture/fermeture de l'écran recherche
  function searchScreenOn() {
    MenuDisplay.closeCat();
    document.getElementById("catalogBtn").classList.add('d-none');
    DOM.$menuBtn.classList.add('d-none');
    DOM.$closeSearch.classList.remove('d-none');
    backButtonState = 'search';
  }

  function searchScreenOff() {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
    DOM.$resultDiv.hidden = true;
    DOM.$resultDiv.innerHTML = "";
    document.getElementById("catalogBtn").classList.remove('d-none');
    DOM.$menuBtn.classList.remove('d-none');
    DOM.$closeSearch.classList.add('d-none');
    DOM.$rech.blur()
    backButtonState = 'default';
  }

  function closeSearchScreen() {
    searchScreenOff();
    DOM.$rech.value = "";
  }

  // Ouverture/fermeture menu burger
  function openMenu() {
    closeInfos();
    closeLegend();
    MenuDisplay.closeCat();
    DOM.$menu.classList.remove('d-none');
    backButtonState = 'mainMenu';
  }

  function closeMenu() {
    DOM.$menu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture des fentres infos et légende
  function openLegend(){
    closeMenu();
    DOM.$legendWindow.classList.remove("d-none");
    backButtonState = 'legend';
  }

  function closeLegend(){
    DOM.$legendWindow.classList.add("d-none");
    scroll(0,0);
    backButtonState = 'default';
  }

  function openInfos(){
    closeMenu();
    DOM.$infoWindow.classList.remove("d-none");
    backButtonState = 'infos';
  }

  function closeInfos(){
    DOM.$infoWindow.classList.add("d-none");
    scroll(0,0);
    backButtonState = 'default';
  }

  // Ouverture/fermeture des écrans atlernatifs
  function altScreenOn() {
    closeMenu();
    DOM.$rech.disabled = true;
    DOM.$rech.style.fontFamily = 'Open Sans Bold';
    DOM.$blueBg.classList.remove('d-none');
    DOM.$menuBtn.classList.add('d-none');
    DOM.$searchImage.classList.add('d-none');
    DOM.$backTopLeft.classList.remove('d-none');
    DOM.$closeSearch.classList.remove('d-none');
    DOM.$altMenuContainer.classList.remove('d-none');
    lastTextInSearch = DOM.$rech.value;

  }

  function altScreenOff() {
    DOM.$rech.disabled = false;
    DOM.$rech.value = lastTextInSearch;
    DOM.$rech.removeAttribute('style');
    DOM.$blueBg.classList.add('d-none');
    DOM.$menuBtn.classList.remove('d-none');
    DOM.$closeSearch.classList.add('d-none');
    DOM.$backTopLeft.classList.add('d-none');
    DOM.$searchImage.classList.remove('d-none');
    DOM.$parameterMenu.classList.add('d-none');
    DOM.$altMenuContainer.classList.add('d-none');
  }

  // Ouverture/fermeture de l'écran paramètres
  function openParamsScreen() {
    altScreenOn();
    DOM.$parameterMenu.classList.remove('d-none');
    DOM.$rech.value = "Paramètres";
    backButtonState = 'params';
  }

  function closeParamsScreen() {
    altScreenOff();
    DOM.$parameterMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran mentions légales
  function openLegalScreen() {
    altScreenOn();
    DOM.$rech.value = "Mentions légales";
    DOM.$legalMenu.classList.remove('d-none');
    backButtonState = 'legal';
  }

  function closeLegalScreen(){
    altScreenOff();
    DOM.$legalMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran vie privée
  function openPrivacyScreen() {
    altScreenOn();
    DOM.$privacyMenu.classList.remove('d-none');
    DOM.$rech.value = "Vie privée";
    backButtonState = 'privacy';
  }

  function closePrivacyScreen(){
    altScreenOff();
    DOM.$privacyMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran aller plus loin
  function openPlusLoinScreen() {
    altScreenOn();
    DOM.$plusLoinMenu.classList.remove('d-none');
    backButtonState = 'plusLoin';
    DOM.$rech.value = "À découvrir également...";
  }

  function closePlusLoinScreen(){
    altScreenOff();
    DOM.$plusLoinMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture de la popup coordonnées
  function openCoords (latlng) {
    let coords = [latlng.lng, latlng.lat];
    let convertedCoords = convertCoords(coords);
    L.popup()
    .setLatLng(latlng)
    .setContent(convertedCoords[0] + ", " + convertedCoords[1])
    .openOn(map);
  }


  async function rechercheEtPosition(text) {
    /**
     * Recherche un texte et le géocode à l'aide de look4, puis va à sa position en ajoutant un marqueur
     */
    let url = new URL("https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/look4/user/search");
    let params =
        {
          indices: "locating",
          method: "prefix",
          types: "address,position,toponyme,w3w",
          nb: 1,
          "match[fulltext]": text,
        };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let responseprom = await fetch(url);
    let response = await responseprom.json()

    let geocode_result = response.features[0];

    DOM.$rech.value = computeLocationFullText(geocode_result);

    let geom = geocode_result.geometry;
    let coords = {
      lat: geom.coordinates[1],
      lon: geom.coordinates[0]
    };
    goToAddressCoords(coords, 14);
  }

  function goToAddressCoords(coords, zoom=map.getZoom(), panTo=true) {
    /**
     * Ajoute un marqueur de type adresse à la position définie par le coods, et déplace la carte au zoom demandé
     * si panTo est True
     */
    cleanResults();
    Globals.adressMarkerLayer = L.featureGroup().addTo(map);
    let markerLayer = L.featureGroup([L.marker(
      [coords.lat, coords.lon],
      {
        icon:	gpMarkerIcon2
      }
    )]);

    Globals.adressMarkerLayer.addLayer(markerLayer);
    if (panTo) {
      map.setView(new L.LatLng(coords.lat, coords.lon), zoom);
    }
  }

  function goToGPSCoords(coords, zoom=map.getZoom(), panTo=true) {
    /**
     * Ajoute un marqueur de type GPS à la position définie par le coods, et déplace la carte au zoom demandé
     * si panTo est True
     */
    cleanGPS();
    Globals.gpsMarkerLayer = L.featureGroup().addTo(map);
    let markerLayer = L.featureGroup([L.marker(
      [coords.lat, coords.lon],
      {
        icon:	gpMarkerIcon
      }
    )]);

    Globals.gpsMarkerLayer.addLayer(markerLayer);
    if (panTo) {
      if (currentRotation !== 0){
        map.setBearing(0);
        map.setView(new L.LatLng(coords.lat, coords.lon), zoom, {animate: false});
        map.setBearing(currentRotation);
      } else {
        map.setView(new L.LatLng(coords.lat, coords.lon), zoom);
      }
    }
  }


  /* Autocompletion */
  let autocompletion_results = []

  async function suggest() {
    /**
     * Ajoute des suggestions en dessous de la barre de recherche en fonction de ce qui est tapé
     * à l'aide de look4
     */
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
    let location = DOM.$rech.value;
    let url = new URL("https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/look4/user/search");
    let params =
        {
          indices: "locating",
          method: "prefix",
          types: "address,position,toponyme,w3w",
          nb: 15,
          "match[fulltext]": location,
        };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let responseprom = await fetch(url, {signal});
    let response = await responseprom.json()
    autocompletion_results = [];
    for (let i = 0 ; i < response.features.length; i++) {
      let elem = response.features[i];
      autocompletion_results.push(computeLocationFullText(elem));
    }
    // Seulement les valeurs uniques
    autocompletion_results = autocompletion_results
      .filter((val, idx, s) => s.indexOf(val) === idx)
      .slice(0,5);
  }

  function computeLocationFullText(locationResult) {
    var properties = locationResult.properties;
    var fullText = "";

    if (properties._type === "position" && properties.coord) {
        fullText = "Coordonnées : " + properties.coord;
    } else if (properties._type === "w3w" && properties.w3w) {
        fullText = "what3words : " + properties.w3w;
    } else {
        if (properties.nyme) {
            fullText += properties.nyme + ", ";
        }
        if (properties.street) {
            fullText += properties.number + " " + properties.street + ", ";
        }
        fullText += properties.postalCode + " " + properties.city;
    }

    return fullText;
  }

  // Recherche du 1er résultat de l'autocomplétion si appui sur entrée
  DOM.$rech.addEventListener("keyup", (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      DOM.$resultDiv.hidden = true;
      DOM.$resultDiv.innerHTML = "";
      rechercheEtPosition(DOM.$rech.value);
      searchScreenOff();
    } else if (DOM.$rech.value !== ""){
      let resultStr = "";
      suggest().then( () => {
        if (autocompletion_results.length > 0){
          for (let i = 0 ; i < autocompletion_results.length; i++) {
            resultStr += "<p class='autocompresult'>" + autocompletion_results[i] + "</p>" ;
          }
          DOM.$resultDiv.innerHTML = resultStr;
          DOM.$resultDiv.hidden = false;
        }
      });
    }
  });


  /* Géolocalisation */
  // Positionnement du mobile
  let location_active = false;
  // Suivi de la carte
  let tracking_active = false;
  let watch_id;

  function trackLocation() {
    /**
     * Suit la position de l'utilisateur
     */
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, Math.max(map.getZoom(), 14));
      },
      (err) => {
        console.warn(`ERROR(DOM.${err.code}): DOM.${err.message}`);
      },
      {
        maximumAge: 1500000,
        timeout: 100000,
        enableHighAccuracy: true
      });

      watch_id = navigator.geolocation.watchPosition((position) => {
        goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, map.getZoom(), tracking_active);
      },
      (err) => {
        console.warn(`ERROR(DOM.${err.code}): DOM.${err.message}`);
      },
      {
        maximumAge: 1500000,
        timeout: 100000,
        enableHighAccuracy: true
      });
    }
  }

  // Modification du statut de localisation
  function locationOnOff() {
    if (!location_active) {
      DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/location-fixed.svg")';
      requestLocationAccuracy();
      trackLocation();
      location_active = true;
    } else if (!tracking_active) {
      DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/location-follow.svg")';
      tracking_active = true;
    } else {
      DOM.$geolocateBtn.style.backgroundImage = 'url("css/assets/localisation.svg")';
      navigator.geolocation.clearWatch(watch_id);
      location_active = false;
      tracking_active = false;
    }
  }

  /* Coordonnées */
  /* CRS */
  proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
  proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
  proj4.defs("EPSG:27572","+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs");

  function convertCoords(coords) {
    /**
     * Returns [lat, lng] if geographic, [x, y] otherwise
     */
    let X;
    let Y;
    let lat;
    let lng;
    let new_coords;
    const crs = document.querySelector('input[name="coordRadio"]:checked').value;
    switch (crs) {
      case 'latlng':
        lat = coords[1].toFixed(6);
        lng = coords[0].toFixed(6);
        return [lat, lng];
      case 'merc':
        new_coords = proj4('EPSG:3857', coords)
        X = new_coords[0].toFixed(1);
        Y = new_coords[1].toFixed(1);
        return [X, Y];
      case 'l93':
        new_coords = proj4('EPSG:2154', coords)
        X = new_coords[0].toFixed(1);
        Y = new_coords[1].toFixed(1);
        return [X, Y];
      case 'l2e':
        new_coords = proj4('EPSG:27572', coords)
        X = new_coords[0].toFixed(1);
        Y = new_coords[1].toFixed(1);
        return [X, Y];
    }
  }

  /**
   *
   * @param {Object} coords Résultat de map.getCoords(), contient un champ lat et un champ lng
   */
  function updateCenterCoords(coords) {
    const coordsToDisplay = convertCoords([coords.lng, coords.lat]);
    DOM.$centerCoords.innerHTML = coordsToDisplay[0] + ", " + coordsToDisplay[1];
  }

  function reticuleOnOff() {
    const checked = DOM.$chkPrintCoordsReticule.checked;
    if (checked) {
      document.getElementById("centerCoords").classList.remove("d-none");
      document.getElementById("centerReticule").classList.remove("d-none");
      document.getElementById("coordTypeDisplay").classList.remove("d-none");
    } else {
      document.getElementById("centerCoords").classList.add("d-none");
      document.getElementById("centerReticule").classList.add("d-none");
      document.getElementById("coordTypeDisplay").classList.add("d-none");
    }
  }

  /* Code pour l'activation de la localisation de l'appareil */
  // https://github.com/dpa99c/cordova-plugin-request-location-accuracy
  const platform = cordova.platformId;

  function onError(error) {
    console.error("The following error occurred: " + error);
  }

  function handleSuccess(msg) {
    console.log(msg);
  }

  function handleLocationAuthorizationStatus(status) {
    switch (status) {
      case cordova.plugins.diagnostic.permissionStatus.GRANTED:
        if(platform === "ios"){
            onError("Location services is already switched ON");
        } else{
            _makeRequest();
        }
        break;
      case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
        requestLocationAuthorization();
        break;
      case cordova.plugins.diagnostic.permissionStatus.DENIED:
        if(platform === "android"){
            onError("User denied permission to use location");
        } else{
            _makeRequest();
        }
        break;
      case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
        // Android only
        onError("User denied permission to use location");
        break;
      case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
        // iOS only
        onError("Location services is already switched ON");
        break;
    }
  }

  function requestLocationAuthorization() {
      cordova.plugins.diagnostic.requestLocationAuthorization(handleLocationAuthorizationStatus, onError);
  }

  function requestLocationAccuracy() {
      cordova.plugins.diagnostic.getLocationAuthorizationStatus(handleLocationAuthorizationStatus, onError);
  }

  function _makeRequest(){
    cordova.plugins.locationAccuracy.canRequest(function(canRequest){
      if (canRequest) {
        cordova.plugins.locationAccuracy.request(function () {
            handleSuccess("Location accuracy request successful");
          }, function (error) {
            onError("Error requesting location accuracy: " + JSON.stringify(error));
            if (error) {
              // Android only
              onError("error code=" + error.code + "; error message=" + error.message);
              if (platform === "android" && error.code !== cordova.plugins.locationAccuracy.ERROR_USER_DISAGREED) {
                if (window.confirm("Failed to automatically set Location Mode to 'High Accuracy'. Would you like to switch to the Location Settings page and do this manually?")) {
                  cordova.plugins.diagnostic.switchToLocationSettings();
                }
              }
            }
          }, cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY // iOS will ignore this
        );
      } else {
        // On iOS, this will occur if Location Services is currently on OR a request is currently in progress.
        // On Android, this will occur if the app doesn't have authorization to use location.
        onError("Cannot request location accuracy");
      }
    });
  }

  /* Event listeners */
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
      rechercheEtPosition(DOM.$rech.value);
      setTimeout(searchScreenOff, 150)
    /* marqueur de recherche/position */
    } else if (evt.target.classList.contains("adressMarker")) {
      cleanResults();
    } else if (evt.target.classList.contains("gpsMarker")) {
      cleanGPS();
    /* pour aller + loin du message d'accueil */
    } else if (evt.target.classList.contains("msgGreen")) {
      DOM.$startPopup.hidden = true;
      openPlusLoinScreen();
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
  document.getElementById("compris").addEventListener('click', startPopupValidation);

  // Ouverture-Fermeture
  document.getElementById("catalogBtn").addEventListener('click', MenuDisplay.openCat);
  DOM.$backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  DOM.$geolocateBtn.addEventListener('click', locationOnOff);
  DOM.$chkPrintCoordsReticule.addEventListener('change', reticuleOnOff);

  // Recherche
  DOM.$rech.addEventListener('focus', searchScreenOn);
  DOM.$closeSearch.addEventListener("click", onBackKeyDown);

  // Menu burger
  DOM.$menuBtn.addEventListener("click", openMenu);

  // Rotation
  DOM.$compassBtn.addEventListener("click", () => {
    currentRotation = 0;
    map.setBearing(0);
    DOM.$compassBtn.style.transform = "rotate(" + 0 + "deg)";
    DOM.$compassBtn.classList.add("d-none");
  })

  // Fermeture menu
  DOM.$menu.addEventListener('click', (evt) => {
    if (evt.target.id === 'menu') {
      closeMenu();
    }
  });

  document.getElementById('menuItemParams').addEventListener('click', openParamsScreen);
  document.getElementById('menuItemLegend').addEventListener('click', openLegend);
  document.getElementById('menuItemInfo').addEventListener('click', openInfos);
  document.getElementById('menuItemPlusLoin').addEventListener('click', openPlusLoinScreen);
  document.getElementById('menuItemLegal').addEventListener('click', openLegalScreen);
  document.getElementById('menuItemPrivacy').addEventListener('click', openPrivacyScreen);

  document.getElementById("infoWindowClose").addEventListener('click', closeInfos);
  document.getElementById("legendWindowClose").addEventListener('click', closeLegend);
  document.getElementById("menuWindowClose").addEventListener('click', closeMenu);

  // Synchronisation des radio button pour le type de coordonnées
  Array.from(document.getElementsByName("coordRadio")).forEach( elem => {
    elem.addEventListener("change", () => {
      updateCenterCoords(map.getCenter());
      const radioCheckedId = document.querySelector('input[name="coordRadio"]:checked').id;
      document.getElementById("coordTypeDisplay").innerHTML = document.querySelector(`label[for="${radioCheckedId}"]`).innerHTML;
    });
  });

  /**/

  // Légende en fonction du zoom
  map.on("zoomend", UpdateLegend.updateLegend);

  // Event coordonnées
  map.on('contextmenu', (event) => {
    if (DOM.$chkPrintCoordsOnContext.checked) {
      let latlng = map.mouseEventToLatLng(event.originalEvent);
      openCoords(latlng);
    }
  });

  // Coordonnées au déplacement de la carte
  map.on('move', () => {
    updateCenterCoords(map.getCenter());
  });

  // Action du backbutton
  document.addEventListener("backbutton", onBackKeyDown, false);
  function onBackKeyDown() {
    // Handle the back button
    if (backButtonState == 'default') {
      navigator.app.exitApp();
    }
    if (backButtonState === 'search') {
      closeSearchScreen();
    }
    if (backButtonState === 'mainMenu') {
      closeMenu();
    }
    if (backButtonState === 'params') {
      closeParamsScreen();
    }
    if (backButtonState === 'legal') {
      closeLegalScreen();
    }
    if (backButtonState === 'privacy') {
      closePrivacyScreen();
    }
    if (backButtonState === 'plusLoin') {
      closePlusLoinScreen();
    }
    if (backButtonState === 'infos') {
      closeInfos();
    }
    if (backButtonState === 'legend') {
      closeLegend();
    }
    if (backButtonState === 'catalog') {
      MenuDisplay.closeCat();
      backButtonState = 'default';
    }
  }

  // Sauvegarde de l'état de l'application
  document.addEventListener('pause', () => {
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastLayerDisplayed", Globals.layerDisplayed);
  });

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
      currentRotation = lastRotation - diff;
      if (rotationStarted) {
        map.setBearing(currentRotation);
        DOM.$compassBtn.style.transform = "rotate(" + currentRotation + "deg)";
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
      lastRotation = currentRotation;
      startRotation = Math.round(e.rotation);
    }
  });

  hammertime.on('rotateend', () => {
    if (DOM.$chkRotate.checked && !disableRotation) {
        rotationStarted = false;
        lastRotation = currentRotation;
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

}

document.addEventListener('deviceready', () => {
  app();
});

import Layers from './layers';
import Texts from './texts';

function app() {
  /**
   * Fonction définissant l'application
   */

  /* DOM elements */
  const $map = document.getElementById("map");
  const $startPopup = document.getElementById("startPopup");
  const $message = document.getElementById("message");
  const $resultDiv = document.getElementById("resultsRech");
  const $rech = document.getElementById('lieuRech');
  const $geolocateBtn = document.getElementById("geolocateBtn");
  const $blueBg = document.getElementById("blueBg");
  const $closeSearch = document.getElementById("closeSearch");
  const $menuBtn = document.getElementById("menuBtn");
  const $menu = document.getElementById("menu");
  const $searchImage = document.getElementById("searchImage");
  const $backTopLeft = document.getElementById("backTopLeft");
  const $parameterMenu = document.getElementById("parameterMenu");
  const $legalMenu = document.getElementById("legalMenu");
  const $privacyMenu = document.getElementById("privacyMenu");
  const $plusLoinMenu = document.getElementById("plusLoinMenu");
  const $altMenuContainer = document.getElementById("altMenuContainer");
  const $legendWindow = document.getElementById("legendWindow");
  const $infoWindow = document.getElementById("infoWindow");
  const $infoText = document.getElementById("infoText");
  const $legendImg = document.getElementById("legendImg");
  const $chkNePlusAff = document.getElementById("chkNePlusAff");
  const $chkPrintCoordsOnContext = document.getElementById("chkPrintCoordsOnContext");
  const $chkPrintCoordsReticule = document.getElementById("chkPrintCoordsReticule");
  const $compassBtn = document.getElementById("compassBtn");
  const $chkRotate = document.getElementById("chkRotate");
  const $centerCoords = document.getElementById("centerCoords");

  /* global: back button state */
  let backButtonState = 'default';
  /* global: layer display state */
  let layerDisplayed = localStorage.getItem("lastLayerDisplayed") || 'photos';

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
      $message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
      motd_id = data.id;
    }).then( () => {
      if (!localStorage.getItem("lastMotdID") || (localStorage.getItem("lastMotdID") && (localStorage.getItem("lastMotdID") < motd_id))) {
        if($message.innerHTML !== '') {
          $startPopup.classList.remove('d-none');
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

  let gpsMarkerLayer;
  let adressMarkerLayer;

  const map = new L.map('map', { zoomControl: false, rotate: true }).setView([47.33, 2.0], 5) ;
  // Définition de la carte et des couches
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }
  // Initialisation des coordonnées du centre
  updateCenterCoords(map.getCenter());

  // Pour le "chargement" de l'état précédent
  // Par défaut : couche ortho
  switch (layerDisplayed) {
    case 'photos':
      displayOrtho();
      break;
    case 'routes':
      displayOrthoAndRoads();
      break;
    case 'cadastre':
      displayOrthoAndParcels();
      break;
    case 'plan-ign':
      displayPlan();
      break;
    case 'cartes':
      displayCartes();
      break;
    case 'drones':
      displayDrones();
      break;
    case 'topo':
      displayTopo();
      break;
    case 'etat-major':
      displayEtatMajor();
      break;
    case 'ortho-histo':
      displayOrthoHisto();
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

  // Fonctions de changements d'affichages de couches
  function removeAllLayers() {
    Layers.orthoLyr.setOpacity(1);
    map.eachLayer( (layer) => {
      map.removeLayer(layer);
    });
    document.querySelectorAll("#menuC img").forEach(elem => {
      elem.classList.remove('selectedLayer');
    });
    updateLegend();
  }

  function displayOrtho() {
    /**
     * Affiche la couche ortho
     */
    removeAllLayers();
    document.getElementById("photos").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.photos;
    $legendImg.innerHTML = Texts.legendImgs.photos;
    Layers.orthoLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'photos';
    closeCat();
  }

  function displayOrthoAndRoads() {
    /**
     * Affiche la couche ortho + route
     */
    removeAllLayers();
    document.getElementById("routes").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.routes;
    $legendImg.innerHTML = Texts.legendImgs.routes;
    Layers.orthoLyr.addTo(map);
    Layers.roadsLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'routes';
    closeCat();
  }

  function displayOrthoAndParcels() {
    /**
     * Affiche la couche ortho + cadastre
     */
    removeAllLayers();
    document.getElementById("cadastre").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.cadastre;
    $legendImg.innerHTML = Texts.legendImgs.cadastre;
    Layers.parcelLyr.addTo(map);
    Layers.orthoLyr.addTo(map);
    Layers.orthoLyr.setOpacity(0.5);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'cadastre';
    closeCat();
  }

  function displayPlan() {
    /**
     * Affiche la couche plan IGN
     */
    removeAllLayers();
    document.getElementById("plan-ign").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.plan_ign;
    $legendImg.innerHTML = Texts.legendImgs.plan_ign;
    Layers.planLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'plan-ign';
    closeCat();
  }

  function displayCartes() {
    /**
     * Affiche la couche cartes IGN
     */
    removeAllLayers();
    document.getElementById("cartes").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.cartes;
    $legendImg.innerHTML = Texts.legendImgs.cartes;
    Layers.cartesLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'cartes';
    closeCat();
  }

  function displayDrones() {
    /**
     * Affiche la couche carte des drones
     */
    removeAllLayers();
    document.getElementById("drones").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.drones;
    $legendImg.innerHTML = Texts.legendImgs.drones;
    Layers.cartesLyr.addTo(map);
    Layers.dronesLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'drones';
    closeCat();
  }

  function displayTopo() {
    /**
     * Affiche la couche carte topo
     */
    removeAllLayers();
    document.getElementById("topo").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.topo;
    $legendImg.innerHTML = Texts.legendImgs.topo;
    Layers.topoLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'topo';
    closeCat();
  }

  function displayEtatMajor() {
    /**
     * Affiche la couche carte d'état major
     */
    removeAllLayers();
    document.getElementById("etat-major").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.etatmajor;
    $legendImg.innerHTML = Texts.legendImgs.etatmajor;
    Layers.etatmajorLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'etat-major';
    closeCat();
  }

  function displayOrthoHisto() {
    /**
     * Affiche la couche Photographies aériennes anciennes
     */
    removeAllLayers();
    document.getElementById("ortho-histo").classList.add("selectedLayer");
    $infoText.innerHTML = Texts.informationTexts.orthohisto;
    $legendImg.innerHTML = Texts.legendImgs.orthohisto;
    Layers.orthoHistoLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'ortho-histo';
    closeCat();
  }


  // Fermeture popup démarrage
  function startPopupValidation() {
    $startPopup.hidden = true;
    if ($chkNePlusAff.checked) {
      localStorage.setItem("lastMotdID", motd_id);
    }
  }

  // Ouverture/fermeture catalogue
  function openCat() {
    document.getElementById("catalog").classList.remove('d-none');
    backButtonState = 'catalog';
  }

  function closeCat() {
    document.getElementById("catalog").classList.add('d-none');
  }

  /* Recherche et positionnnement */
  function cleanResults() {
    /**
     * Enlève le marqueur adresse
     */
    if (adressMarkerLayer != null) {
      map.removeLayer(adressMarkerLayer);
      adressMarkerLayer = null;
    }
  }

  function cleanGPS() {
    /**
     * Enlève le marqueur GPS
     */
    if (gpsMarkerLayer != null) {
      map.removeLayer(gpsMarkerLayer);
      gpsMarkerLayer = null;
    }
  }

  // Ouverture/fermeture de l'écran recherche
  function searchScreenOn() {
    closeCat();
    document.getElementById("catalogBtn").classList.add('d-none');
    $menuBtn.classList.add('d-none');
    $closeSearch.classList.remove('d-none');
    backButtonState = 'search';
  }

  function searchScreenOff() {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
    $resultDiv.hidden = true;
    $resultDiv.innerHTML = "";
    document.getElementById("catalogBtn").classList.remove('d-none');
    $menuBtn.classList.remove('d-none');
    $closeSearch.classList.add('d-none');
    $rech.blur()
    backButtonState = 'default';
  }

  function closeSearchScreen() {
    searchScreenOff();
    $rech.value = "";
  }

  // Ouverture/fermeture menu burger
  function openMenu() {
    closeInfos();
    closeLegend();
    closeCat();
    $menu.classList.remove('d-none');
    backButtonState = 'mainMenu';
  }

  function closeMenu() {
    $menu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture des fentres infos et légende
  function openLegend(){
    closeMenu();
    $legendWindow.classList.remove("d-none");
    backButtonState = 'legend';
  }

  function closeLegend(){
    $legendWindow.classList.add("d-none");
    scroll(0,0);
    backButtonState = 'default';
  }

  function openInfos(){
    closeMenu();
    $infoWindow.classList.remove("d-none");
    backButtonState = 'infos';
  }

  function closeInfos(){
    $infoWindow.classList.add("d-none");
    scroll(0,0);
    backButtonState = 'default';
  }

  // Ouverture/fermeture des écrans atlernatifs
  function altScreenOn() {
    closeMenu();
    $rech.disabled = true;
    $rech.style.fontFamily = 'Open Sans Bold';
    $blueBg.classList.remove('d-none');
    $menuBtn.classList.add('d-none');
    $searchImage.classList.add('d-none');
    $backTopLeft.classList.remove('d-none');
    $closeSearch.classList.remove('d-none');
    $altMenuContainer.classList.remove('d-none');
    lastTextInSearch = $rech.value;

  }

  function altScreenOff() {
    $rech.disabled = false;
    $rech.value = lastTextInSearch;
    $rech.removeAttribute('style');
    $blueBg.classList.add('d-none');
    $menuBtn.classList.remove('d-none');
    $closeSearch.classList.add('d-none');
    $backTopLeft.classList.add('d-none');
    $searchImage.classList.remove('d-none');
    $parameterMenu.classList.add('d-none');
    $altMenuContainer.classList.add('d-none');
  }

  // Ouverture/fermeture de l'écran paramètres
  function openParamsScreen() {
    altScreenOn();
    $parameterMenu.classList.remove('d-none');
    $rech.value = "Paramètres";
    backButtonState = 'params';
  }

  function closeParamsScreen() {
    altScreenOff();
    $parameterMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran mentions légales
  function openLegalScreen() {
    altScreenOn();
    $rech.value = "Mentions légales";
    $legalMenu.classList.remove('d-none');
    backButtonState = 'legal';
  }

  function closeLegalScreen(){
    altScreenOff();
    $legalMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran vie privée
  function openPrivacyScreen() {
    altScreenOn();
    $privacyMenu.classList.remove('d-none');
    $rech.value = "Vie privée";
    backButtonState = 'privacy';
  }

  function closePrivacyScreen(){
    altScreenOff();
    $privacyMenu.classList.add('d-none');
    backButtonState = 'default';
  }

  // Ouverture/fermeture de l'écran aller plus loin
  function openPlusLoinScreen() {
    altScreenOn();
    $plusLoinMenu.classList.remove('d-none');
    backButtonState = 'plusLoin';
    $rech.value = "À découvrir également...";
  }

  function closePlusLoinScreen(){
    altScreenOff();
    $plusLoinMenu.classList.add('d-none');
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

    $rech.value = computeLocationFullText(geocode_result);

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
    adressMarkerLayer = L.featureGroup().addTo(map);
    let markerLayer = L.featureGroup([L.marker(
      [coords.lat, coords.lon],
      {
        icon:	gpMarkerIcon2
      }
    )]);

    adressMarkerLayer.addLayer(markerLayer);
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
    gpsMarkerLayer = L.featureGroup().addTo(map);
    let markerLayer = L.featureGroup([L.marker(
      [coords.lat, coords.lon],
      {
        icon:	gpMarkerIcon
      }
    )]);

    gpsMarkerLayer.addLayer(markerLayer);
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
    let location = $rech.value;
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
  $rech.addEventListener("keyup", (event) => {
    if (event.key === 'Enter' || event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      $resultDiv.hidden = true;
      $resultDiv.innerHTML = "";
      rechercheEtPosition($rech.value);
      searchScreenOff();
    } else if ($rech.value !== ""){
      let resultStr = "";
      suggest().then( () => {
        if (autocompletion_results.length > 0){
          for (let i = 0 ; i < autocompletion_results.length; i++) {
            resultStr += "<p class='autocompresult'>" + autocompletion_results[i] + "</p>" ;
          }
          $resultDiv.innerHTML = resultStr;
          $resultDiv.hidden = false;
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
        console.warn(`ERROR(${err.code}): ${err.message}`);
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
        console.warn(`ERROR(${err.code}): ${err.message}`);
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
      $geolocateBtn.style.backgroundImage = 'url("css/assets/location-fixed.svg")';
      requestLocationAccuracy();
      trackLocation();
      location_active = true;
    } else if (!tracking_active) {
      $geolocateBtn.style.backgroundImage = 'url("css/assets/location-follow.svg")';
      tracking_active = true;
    } else {
      $geolocateBtn.style.backgroundImage = 'url("css/assets/localisation.svg")';
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
    $centerCoords.innerHTML = coordsToDisplay[0] + ", " + coordsToDisplay[1];
  }

  function reticuleOnOff() {
    const checked = $chkPrintCoordsReticule.checked;
    if (checked) {
      document.getElementById("centerCoords").classList.remove("d-none");
      document.getElementById("centerReticule").classList.remove("d-none");
      document.getElementById("coordTypeClone").classList.remove("d-none");
    } else {
      document.getElementById("centerCoords").classList.add("d-none");
      document.getElementById("centerReticule").classList.add("d-none");
      document.getElementById("coordTypeClone").classList.add("d-none");
    }
  }


  /* Légende en fonction du zoom */
  function updateLegend() {
    let zoomLvl = map.getZoom();

    // Je n'avais pas prévu autant de légendes différentes en fonction du zoom pour plan ign v2...
    if (zoomLvl <= 7) {
      legendImgs.plan_ign = Texts.planIGNLegendImgs.seven;
    } else if (zoomLvl <= 8){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.eight;
    } else if (zoomLvl <= 9){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.nine;
    } else if (zoomLvl <= 10){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.ten;
    } else if (zoomLvl <= 11){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.eleven;
    } else if (zoomLvl <= 12){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.twelve;
    } else if (zoomLvl <= 13){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.thirteen;
    } else if (zoomLvl <= 14){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.fourteen;
    } else if (zoomLvl <= 15){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.fifteen;
    } else if (zoomLvl <= 16){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.sixteen;
    } else if (zoomLvl <= 18){
      legendImgs.plan_ign = Texts.planIGNLegendImgs.eighteen;
    } else {
      legendImgs.plan_ign = Texts.planIGNLegendImgs.nineteen;
    }

    if (zoomLvl <= 7) {
      legendImgs.cartes = Texts.carteIGNLegendImgs.seven;
    } else if (zoomLvl <= 10){
      legendImgs.cartes = Texts.carteIGNLegendImgs.ten;
    } else if (zoomLvl <= 12){
      legendImgs.cartes = Texts.carteIGNLegendImgs.twelve;
    } else if (zoomLvl <= 14){
      legendImgs.cartes = Texts.carteIGNLegendImgs.fourteen;
    } else if (zoomLvl <= 16){
      legendImgs.cartes = Texts.carteIGNLegendImgs.sixteen;
    } else {
      legendImgs.cartes = Texts.carteIGNLegendImgs.eighteen;
    }

    if (layerDisplayed === 'plan-ign') {
      $legendImg.innerHTML = legendImgs.plan_ign;
    } else if (layerDisplayed === 'cartes') {
      $legendImg.innerHTML = legendImgs.cartes;
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
      closeCat();
    }
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      evt.target.style.backgroundColor = '#0B6BA7';
      evt.target.style.color = 'white';
      $rech.value = evt.target.innerHTML;
      rechercheEtPosition($rech.value);
      setTimeout(searchScreenOff, 150)
    /* marqueur de recherche/position */
    } else if (evt.target.classList.contains("adressMarker")) {
      cleanResults();
    } else if (evt.target.classList.contains("gpsMarker")) {
      cleanGPS();
    /* pour aller + loin du message d'accueil */
    } else if (evt.target.classList.contains("msgGreen")) {
      $startPopup.hidden = true;
      openPlusLoinScreen();
    }
  }, true);

  /* event listeners statiques */
  // Couches
  document.getElementById("layerOrtho").addEventListener('click', displayOrtho);
  document.getElementById("layerRoutes").addEventListener('click', displayOrthoAndRoads);
  document.getElementById("layerCartes").addEventListener('click', displayCartes);
  document.getElementById("layerPlan").addEventListener('click', displayPlan);
  document.getElementById("layerParcels").addEventListener('click', displayOrthoAndParcels);
  document.getElementById("layerDrones").addEventListener('click', displayDrones);
  document.getElementById("layerTopo").addEventListener('click', displayTopo);
  document.getElementById("layerEtatMajor").addEventListener('click', displayEtatMajor);
  document.getElementById("layerOrthoHisto").addEventListener('click', displayOrthoHisto);

  // Bouton compris de la popup démarrage
  document.getElementById("compris").addEventListener('click', startPopupValidation);

  // Ouverture-Fermeture
  document.getElementById("catalogBtn").addEventListener('click', openCat);
  $backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  $geolocateBtn.addEventListener('click', locationOnOff);
  $chkPrintCoordsReticule.addEventListener('change', reticuleOnOff);

  // Recherche
  $rech.addEventListener('focus', searchScreenOn);
  $closeSearch.addEventListener("click", onBackKeyDown);

  // Menu burger
  $menuBtn.addEventListener("click", openMenu);

  // Rotation
  $compassBtn.addEventListener("click", () => {
    currentRotation = 0;
    map.setBearing(0);
    $compassBtn.style.transform = "rotate(" + 0 + "deg)";
    $compassBtn.classList.add("d-none");
  })

  // Fermeture menu
  $menu.addEventListener('click', (evt) => {
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
      Array.from(document.getElementsByName("coordRadioClone")).forEach( elem => {
        if (elem.value === document.querySelector('input[name="coordRadio"]:checked').value) {
          elem.checked = true;
        }
      });
    });
  });

  Array.from(document.getElementsByName("coordRadioClone")).forEach( elem => {
    elem.addEventListener("change", () => {
      Array.from(document.getElementsByName("coordRadio")).forEach( elem => {
        if (elem.value === document.querySelector('input[name="coordRadioClone"]:checked').value) {
          elem.checked = true;
        }
      });
      updateCenterCoords(map.getCenter());
    });
  });


  /**/

  // Légende en fonction du zoom
  map.on("zoomend", updateLegend);

  // Event coordonnées
  map.on('contextmenu', (event) => {
    if ($chkPrintCoordsOnContext.checked) {
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
      closeCat();
      backButtonState = 'default';
    }
  }

  // Sauvegarde de l'état de l'application
  document.addEventListener('pause', () => {
    localStorage.setItem("lastMapLat", map.getCenter().lat);
    localStorage.setItem("lastMapLng", map.getCenter().lng);
    localStorage.setItem("lastMapZoom", map.getZoom());
    localStorage.setItem("lastLayerDisplayed", layerDisplayed);
  });

  // Rotation de la carte avec le mutlitouch
  let hammertime = new Hammer.Manager($map);

  const rotate = new Hammer.Rotate()
  hammertime.add(rotate)

  let lastRotation;
  let startRotation;
  let rotationStarted = false;
  let disableRotation = false;

  hammertime.on('rotatemove', (e) => {
    if ($chkRotate.checked && !disableRotation) {
      let diff = startRotation - Math.round(e.rotation);
      currentRotation = lastRotation - diff;
      if (rotationStarted) {
        map.setBearing(currentRotation);
        $compassBtn.style.transform = "rotate(" + currentRotation + "deg)";
        $compassBtn.classList.remove("d-none");
      }
      if (Math.abs(diff) > 15 && !rotationStarted){
        rotationStarted = true;
        startRotation = Math.round(e.rotation);
      }
    }
  });

  hammertime.on('rotatestart', (e) => {
    if ($chkRotate.checked && !disableRotation) {
      lastRotation = currentRotation;
      startRotation = Math.round(e.rotation);
    }
  });

  hammertime.on('rotateend', () => {
    if ($chkRotate.checked && !disableRotation) {
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

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
*/

// Pour la mise en cache de tuiles (mode hors ligne) -> désactivé jusqu'à mention contraire...
const useCachedTiles = false;

function app() {

  const informationTexts = {
    photos: "Prises de vues satellitaires ou aériennes des territoires.",
    routes: "Affichage du réseau routier français et européen.",
    cartes: "Cinq types de cartes adaptées aux échelles d’affichage : cartes à grande échelle, cartes topographiques, cartes de tourisme, cartes administratives et routières, cartes à petite échelle.",
    plan_ign: "Plan IGN permet de naviguer en France, sur tout le territoire métropolitain et une partie des DOM, à toutes les échelles.",
    cadastre: "Limites des parcelles cadastrales issues de plans scannés et de plans numériques, de 2013 à 2018.",
    drones: "Représentation des zones soumises à interdictions ou à restrictions pour l’usage, à titre de loisir, d’aéronefs télépilotés (ou drones), sur le territoire métropolitain.<br/><br/>Cette carte intègre partiellement les interdictions s’appuyant sur des données publiées hors de l’AIP (Aeronautical Information Publication) et ne couvre pas les interdictions temporaires. Cette carte est basée sur l’arrêté « espace » du 30 mars 2017.<br/><br/>La représentation des zones soumises à interdictions ou à restrictions n’engage pas la responsabilité des producteurs de la donnée. Le contour des agglomérations est fourni à titre purement indicatif : quelle que soit la couleur représentée, le survol d'un fleuve ou d'un parc en agglomération est interdit.<br/><br/>Consulter la carte ne dispense pas de connaitre la réglementation, de l’appliquer avec discernement et de rester prudent en toute occasion."
  }

  const legendImgs = {
    photos: '<img src="img/couches/photos-legend.png" alt="légende photos aeriennes">',
    routes: '<img src="img/couches/routes-legend.png" alt="légende routes">',
    cartes: '<img src="img/couches/cartes-legend_0-12.png" alt="légende cartes">',
    plan_ign: '<img src="img/couches/planign-legend.png" alt="légende plan IGN">',
    cadastre: '<img src="img/couches/cadastre-legend.png" alt="légende cadastre">',
    drones: '<img src="img/couches/drone-legend.png" alt="légende restriction drones">',
  }

  // const planIGNLegendImgs = {
  //   nine: '<img src="img/couches/planign-legend_0-9.png" alt="légende plan IGN">',
  //   thirteen: '<img src="img/couches/planign-legend_10-13.png" alt="légende plan IGN">',
  //   fifteen: '<img src="img/couches/planign-legend_14-15.png" alt="légende plan IGN">',
  //   eighteen: '<img src="img/couches/planign-legend_16-18.png" alt="légende plan IGN">',
  // }

  const carteIGNLegendImgs = {
    twelve: '<img src="img/couches/cartes-legend_0-12.png" alt="légende cartes">',
    forteen: '<img src="img/couches/cartes-legend_13-14.png" alt="légende cartes">',
    sixteen: '<img src="img/couches/cartes-legend_15-16.png" alt="légende cartes">',
    eighteen: '<img src="img/couches/cartes-legend_17-18.png" alt="légende cartes">',
  }

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

  /* global: back button state */
  let backButtonState = 'default';
  /* global: layer display state */
  let layerDisplayed = 'photos'; 

  /* Check du timestamp "ne plus afficher ce message". Si + d'1 semaine : suppression */
  if (localStorage.getItem("nePasAfficherPopup")) {
    let localNePlusAff = JSON.parse(localStorage.getItem("nePasAfficherPopup"));
    let now = new Date().getTime();
    if (now - localNePlusAff.timestamp > 604800000) {
      localStorage.removeItem("nePasAfficherPopup");
    }
  }

  /* Message du jour (message of the day) */
  const motd_url = cordova.file.applicationDirectory + 'www/js/motd.json';
  fetch(motd_url).then( response => {
    response.json().then( data => {
      $message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
    }).then( () => {
      if (!localStorage.getItem("nePasAfficherPopup")) {
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

  //Définition de la carte et des couches
  const map = new L.map('map', { zoomControl: false }).setView([47.33, 2.0], 5) ;

  const orthoLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/jpeg"+
    "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 19,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  const roadsLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/png"+
    "&LAYER=TRANSPORTNETWORKS.ROADS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  const planLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/png"+
    "&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  const parcelLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=PCI%20vecteur" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/png"+
    "&LAYER=CADASTRALPARCELS.PARCELLAIRE_EXPRESS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 19,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256 ,// les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  const cartesLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/jpeg"+
    "&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  const dronesLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/geoportail/wmts?" +
    "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/png"+
    "&LAYER=TRANSPORTS.DRONES.RESTRICTIONS"+
    "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
    {
    minZoom : 0,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    useCache: useCachedTiles,
    }
  );

  // Par défaut : couche ortho
  orthoLyr.addTo(map);

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
    orthoLyr.setOpacity(1);
    map.eachLayer( (layer) => {
      map.removeLayer(layer);
    });
    document.querySelectorAll("#menuC img").forEach(elem => {
      elem.classList.remove('selectedLayer');
    });
  }

  function displayOrtho() {
    removeAllLayers();
    document.getElementById("photos").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.photos;
    $legendImg.innerHTML = legendImgs.photos;
    orthoLyr.addTo(map);
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
    removeAllLayers();
    document.getElementById("routes").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.routes;
    $legendImg.innerHTML = legendImgs.routes;
    orthoLyr.addTo(map);
    roadsLyr.addTo(map);
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
    removeAllLayers();
    document.getElementById("cadastre").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.cadastre;
    $legendImg.innerHTML = legendImgs.cadastre;
    parcelLyr.addTo(map);
    orthoLyr.addTo(map);
    orthoLyr.setOpacity(0.5);
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
    removeAllLayers();
    document.getElementById("plan-ign").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.plan_ign;
    $legendImg.innerHTML = legendImgs.plan_ign;
    planLyr.addTo(map);
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
    removeAllLayers();
    document.getElementById("cartes").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.cartes;
    $legendImg.innerHTML = legendImgs.cartes;
    cartesLyr.addTo(map);
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
    removeAllLayers();
    document.getElementById("drones").classList.add("selectedLayer");
    $infoText.innerHTML = informationTexts.drones;
    $legendImg.innerHTML = legendImgs.drones;
    cartesLyr.addTo(map);
    dronesLyr.addTo(map);
    if (gpsMarkerLayer) {
      gpsMarkerLayer.addTo(map);
    }
    if (adressMarkerLayer) {
      adressMarkerLayer.addTo(map);
    }
    layerDisplayed = 'drones';
    closeCat();
  }


  // Fermeture popup démarrage
  function startPopupValidation() {
    $startPopup.hidden = true;
    if ($chkNePlusAff.checked) {
      let nePlusAfficherLocal = {value: true, timestamp: new Date().getTime()};
      localStorage.setItem("nePasAfficherPopup", JSON.stringify(nePlusAfficherLocal));
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
    if (adressMarkerLayer != null) {
      map.removeLayer(adressMarkerLayer);
      adressMarkerLayer = null;
    }
  }

  function cleanGPS() {
    if (gpsMarkerLayer != null) {
      map.removeLayer(gpsMarkerLayer);
      gpsMarkerLayer = null;
    }
  }

  // Ouverture/fermeture de l'écran recherche
  function searchScreenOn() {
    closeCat();
    $rech.value = "";
    $blueBg.classList.remove('d-none');
    $menuBtn.classList.add('d-none');
    $closeSearch.classList.remove('d-none');
    backButtonState = 'search';
  }
  
  function searchScreenOff() {
    $resultDiv.hidden = true;
    $resultDiv.innerHTML = "";
    $blueBg.classList.add('d-none');
    $menuBtn.classList.remove('d-none');
    $closeSearch.classList.add('d-none');
    document.activeElement.blur()
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
    backButtonState = 'default';
  }

  function openInfos(){
    closeMenu();
    $infoWindow.classList.remove("d-none");
    backButtonState = 'infos';
  }

  function closeInfos(){
    $infoWindow.classList.add("d-none");
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
  }

  function altScreenOff() {
    $rech.disabled = false;
    $rech.placeholder = "Rechercher un lieu, une adresse...";
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


  /* FIXME later : a adapter au nouveau géocodage */
  function rechercheEtPosition(text) {
    /* Récupération des coordonnées avec l'API (bibliothèque d'accès aux services) */
    Gp.Services.geocode({
      apiKey: "mkndr2u5p00n57ez211i19ok",
      location: text,
      filterOptions: {
        type: "PositionOfInterest,StreetAddress",
      },
      protocol: 'XHR',
      httpMethod: 'GET',
      rawResponse: false,
      returnFreeForm: true,
      /* fonction exécutée une fois la réponse récupérée, avec succès */
      onSuccess: function(response) {
        let location = response.locations[0];
        let coords = {
          lat: location.position.x,
          lon: location.position.y
        };
        goToAddressCoords(coords, 14);
      },
      onFailure: function(error) {
        console.log("Erreur lors de l'appel à l'ancien géocodeur : ", error);
      }
    });
  }

  function goToAddressCoords(coords, zoom=map.getZoom(), panTo=true) {
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
      map.setView(new L.LatLng(coords.lat, coords.lon), zoom);
    }
  }


  /* Autocompletion */
  let autocompletion_results = []

  async function suggest() {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
    let location = $rech.value;
    let url = new URL("https://wxs.ign.fr/mkndr2u5p00n57ez211i19ok/ols/apis/completion");
    let params =
        {
          text: location,
          maximumResponses: 20,
          type: "PositionOfInterest,StreetAddress",
        };

    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let responseprom = await fetch(url, {signal});
    let response = await responseprom.json()
    autocompletion_results = [];
    for (i = 0 ; i < response.results.length; i++) {
      elem = response.results[i];
      autocompletion_results.push(elem.fulltext);
    }
    // Seulement les valeurs uniques
    autocompletion_results = autocompletion_results
      .filter((val, idx, s) => s.indexOf(val) === idx)
      .slice(0,5);
  }


  $rech.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      $resultDiv.hidden = true;
      $resultDiv.innerHTML = "";
      rechercheEtPosition($rech.value);
    } else {
      let resultStr = "";
      suggest().then( () => {
        if (autocompletion_results.length > 0){
          for (i = 0 ; i < autocompletion_results.length; i++) {
            resultStr += "<p class='autocompresult'>" + autocompletion_results[i] + "</p>" ;
          }
          $resultDiv.innerHTML = resultStr;
          $resultDiv.hidden = false;
        }
      });
    }
  });


  /* Géolocalisation */
  let tracking_active = false;
  let tracking_interval;
  function trackLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      });
      tracking_interval = setInterval( () => {
        navigator.geolocation.getCurrentPosition((position) => {
          goToGPSCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }, zoom=map.getZoom(), panTo=false);
        });
      }, 5000);
    }
  }

  function locationOnOff() {
    if (!tracking_active) {
      $geolocateBtn.style.backgroundImage = 'url("css/assets/location-fixed.svg")';
      trackLocation();
      tracking_active = true;
    } else {
      $geolocateBtn.style.backgroundImage = 'url("css/assets/localisation.svg")';
      clearInterval(tracking_interval);
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
    let crs = document.querySelector('input[name="coordRadio"]:checked').value;
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

  /* Event listeners */
  /* event listeners pour élément non existants au démarrage */
  document.querySelector('body').addEventListener('click', (evt) => {
    /* fermeture catalogue */
    if ( evt.target.id !== 'catalog') {
      closeCat();
    }
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      $rech.value = evt.target.innerHTML;
      rechercheEtPosition($rech.value);
      searchScreenOff();
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

  document.getElementById("compris").addEventListener('click', startPopupValidation);

  // Ouverture-Fermeture
  document.getElementById("catalogBtn").addEventListener('click', openCat);
  $backTopLeft.addEventListener("click", onBackKeyDown);

  // Boutons on-off
  $geolocateBtn.addEventListener('click', locationOnOff);

  // Recherche
  $rech.addEventListener('focus', searchScreenOn);
  $closeSearch.addEventListener("click", onBackKeyDown);

  // Menu burger
  $menuBtn.addEventListener("click", openMenu);

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

  // Légende en fonction du zoom
  map.on("zoomend", () => {
    let zoomLvl = map.getZoom();

    // if (zoomLvl <= 9) {
    //   legendImgs.plan_ign = planIGNLegendImgs.nine;
    // } else if (zoomLvl <= 13){
    //   legendImgs.plan_ign = planIGNLegendImgs.thirteen;
    // } else if (zoomLvl <= 15){
    //   legendImgs.plan_ign = planIGNLegendImgs.fifteen;
    // } else {
    //   legendImgs.plan_ign = planIGNLegendImgs.eighteen;
    // }

    if (zoomLvl <= 12) {
      legendImgs.cartes = carteIGNLegendImgs.twelve;
    } else if (zoomLvl <= 14){
      legendImgs.cartes = carteIGNLegendImgs.forteen;
    } else if (zoomLvl <= 16){
      legendImgs.cartes = carteIGNLegendImgs.sixteen;
    } else {
      legendImgs.cartes = carteIGNLegendImgs.eighteen;
    }

    if (layerDisplayed === 'plan-ign') {
      $legendImg.innerHTML = legendImgs.plan_ign;
    } else if (layerDisplayed === 'cartes') {
      $legendImg.innerHTML = legendImgs.cartes;
    }
  });

  // Event coordonnées
  map.on('contextmenu', (event) => {
    if ($chkPrintCoordsOnContext.checked) {
      let latlng = map.mouseEventToLatLng(event.originalEvent);
      openCoords(latlng);
    }
  })

  // Action du backbutton
  document.addEventListener("backbutton", onBackKeyDown, false);
  function onBackKeyDown() {
    // Handle the back button
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
}

document.addEventListener('deviceready', () => {
  app();
});

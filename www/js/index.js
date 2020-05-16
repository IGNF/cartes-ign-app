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

  /* DOM elements */
  const $startPopup = document.getElementById("startPopup");
  const $message = document.getElementById("message");
  const $resultDiv = document.getElementById("resultsRech");
  const $rech = document.getElementById('lieuRech');
  const $geolocateBtn = document.getElementById("geolocateBtn");
  const $centerLat = document.getElementById("centerLat");
  const $centerLon = document.getElementById("centerLon");
  const $centerX = document.getElementById("centerX");
  const $centerY = document.getElementById("centerY");
  // const $btnCoords = document.getElementById("btnCoords");
  const $mapCenterCoords = document.getElementById("mapCenterCoords");
  const $blueBg = document.getElementById("blueBg");
  const $closeSearch = document.getElementById("closeSearch");
  const $menuBtn = document.getElementById("menuBtn");
  const $menu = document.getElementById("menu");

  /* global: back button state */
  let backButtonState = 'default';

  /* Message du jour (message of the day) */
  const motd_url = cordova.file.applicationDirectory + 'www/js/motd.json';
  fetch(motd_url).then( response => {
    response.json().then( data => {
      $message.innerHTML += DOMPurify.sanitize(data.motd, {FORBID_TAGS: ['input']});
      $message.getElementsByClassName("closeButton")[0].addEventListener('click', () => { $startPopup.hidden = true; });
    } )
  })

  // Pour l'annulation de fetch
  let controller = new AbortController();
  let signal = controller.signal;

  let marker_img_path = cordova.file.applicationDirectory + 'www/css/assets/position.svg';

  // Définition du marker
  let gpMarkerIcon = L.icon({
    iconUrl: marker_img_path,
    iconSize:     [23, 23], // size of the icon
    iconAnchor:   [12, 12], // point of the icon which will correspond to marker's location
  });

  let gpMarkerLayer;

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
    "&FORMAT=image/jpeg"+
    "&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGN"+
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
    "&STYLE=normal" +
    "&TILEMATRIXSET=PM" +
    "&FORMAT=image/png"+
    "&LAYER=CADASTRALPARCELS.PARCELS"+
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
  }

  function displayOrtho() {
    removeAllLayers();
    orthoLyr.addTo(map);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  function displayOrthoAndRoads() {
    removeAllLayers();
    orthoLyr.addTo(map);
    roadsLyr.addTo(map);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  function displayOrthoAndParcels() {
    removeAllLayers();
    parcelLyr.addTo(map);
    orthoLyr.addTo(map);
    orthoLyr.setOpacity(0.5);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  function displayPlan() {
    removeAllLayers();
    planLyr.addTo(map);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  function displayCartes() {
    removeAllLayers();
    cartesLyr.addTo(map);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  function displayDrones() {
    removeAllLayers();
    cartesLyr.addTo(map);
    dronesLyr.addTo(map);
    if (gpMarkerLayer) {
      gpMarkerLayer.addTo(map);
    }
    closeCat();
  }

  // Ouverture/fermeture catalogue
  function openCat() {
    document.getElementById("catalog").classList.remove('d-none');
  }

  function closeCat() {
    document.getElementById("catalog").classList.add('d-none');
  }

  /* Recherche et positionnnement */
  function cleanResults() {
    if (gpMarkerLayer != null) {
      map.removeLayer(gpMarkerLayer);
      gpMarkerLayer = null;
    }
  }

  // Ouverture/fermeture de l'écran recherche
  function searchScreenOn() {
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
  }

  function closeSearchScreen() {
    searchScreenOff();
    $rech.value = "";
  }

  // Ouverture/fermeture menu burger
  function openMenu() {
    $menu.classList.remove('d-none');
    backButtonState = 'mainMenu';
  }

  function closeMenu() {
    $menu.classList.add('d-none');
  }

  // Ouverture/fermeture de l'écran paramètres
  function openParamsScreen() {
    closeMenu();
    $rech.disabled = true;
    $rech.placeholder = "Paramètres";
    $rech.style.fontFamily = 'Open Sans Bold';
    $blueBg.classList.remove('d-none');
    $menuBtn.classList.add('d-none');
    $closeSearch.classList.remove('d-none');
    backButtonState = 'params';
  }

  function closeParamsScreen() {
    $rech.disabled = false;
    $rech.placeholder = "Rechercher un lieu, une adresse...";
    $rech.removeAttribute('style');
    $blueBg.classList.add('d-none');
    $menuBtn.classList.remove('d-none');
    $closeSearch.classList.add('d-none');
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
        goToCoords(coords, 14);
      },
      onFailure: function(error) {
        console.log("Erreur lors de l'appel à l'ancien géocodeur : ", error);
      }
    });
  }

  function goToCoords(coords, zoom=map.getZoom(), panTo=true) {
    cleanResults();
    gpMarkerLayer = L.featureGroup().addTo(map);
    let markerLayer = L.featureGroup([L.marker(
      [coords.lat, coords.lon],
      {
        icon:	gpMarkerIcon
      }
    )]);

    gpMarkerLayer.addLayer(markerLayer);
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
        goToCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      });
      tracking_interval = setInterval( () => {
        navigator.geolocation.getCurrentPosition((position) => {
          goToCoords({
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
      console.log("toto")
    } else {
      $geolocateBtn.style.backgroundImage = 'url("css/assets/localisation.svg")';
      clearInterval(tracking_interval);
      tracking_active = false;
    }
  }

  /* Boutons en bas à droite */
  /* Légende */
  function openLegend() {
    document.getElementById("legendPopup").classList.remove('d-none');
  }
  function closeLegend() {
    document.getElementById("legendPopup").classList.add('d-none');
  }


  /* Coordonnées */
  /* CRS */
  proj4.defs("EPSG:2154","+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
  proj4.defs("EPSG:3857","+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs");
  proj4.defs("EPSG:27572","+proj=lcc +lat_1=46.8 +lat_0=46.8 +lon_0=0 +k_0=0.99987742 +x_0=600000 +y_0=2200000 +a=6378249.2 +b=6356515 +towgs84=-168,-60,320,0,0,0,0 +pm=paris +units=m +no_defs");

  let coordinates_active = false;
  let coordinates_interval;
  let crs = 'latlng';

  function getCoords() {
    let coords = [map.getCenter().lng, map.getCenter().lat];
    let new_coords;
    switch (crs) {
      case 'latlng':
        $centerLat.innerHTML = coords[1].toFixed(6);
        $centerLon.innerHTML = coords[0].toFixed(6);
        break;
      case 'merc':
        new_coords = proj4('EPSG:3857', coords)
        $centerX.innerHTML = new_coords[0].toFixed(1);
        $centerY.innerHTML = new_coords[1].toFixed(1);
        break;
      case 'l93':
        new_coords = proj4('EPSG:2154', coords)
        $centerX.innerHTML = new_coords[0].toFixed(1);
        $centerY.innerHTML = new_coords[1].toFixed(1);
        break;
      case 'l2e':
        new_coords = proj4('EPSG:27572', coords)
        $centerX.innerHTML = new_coords[0].toFixed(1);
        $centerY.innerHTML = new_coords[1].toFixed(1);
        break;
    }
  }

  function coordinatesOnOff() {
    if (!coordinates_active) {
      coordinates_interval = setInterval(getCoords, 100);
      coordinates_active = true;
      $mapCenterCoords.classList.remove('d-none');
    } else {
      $mapCenterCoords.classList.add('d-none');
      $geolocateBtn.getElementsByTagName("img")[0].setAttribute("src", "img/locate.png");
      clearInterval(coordinates_interval);
      coordinates_active = false;
    }
  }

  /* Event listeners */
  /* event listeners pour élément non existants qu démarrage */
  document.querySelector('body').addEventListener('click', (evt) => {
    /* Résultats autocompletion */
    if ( evt.target.classList.contains('autocompresult') ) {
      $rech.value = evt.target.innerHTML;
      rechercheEtPosition($rech.value);
      searchScreenOff();
    /* marqueur de recherche/position */
    } else if (evt.target.classList.contains("leaflet-marker-icon")) {
      cleanResults();
    /* bouton "compris" du motd */
    } else if (evt.target.id == "compris") {
      evt.preventDefault();
      $startPopup.hidden = true;
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

  // Ouverture-Fermeture
  document.getElementById("catalogBtn").addEventListener('click', openCat);
  document.getElementById("legendContainer").getElementsByClassName("closeButton")[0].addEventListener('click', closeLegend);
  // document.getElementById("btnLegend").addEventListener('click', openLegend);

  // Boutons on-off
  $geolocateBtn.addEventListener('click', locationOnOff);

  // Recherche
  $rech.addEventListener('focus', searchScreenOn);
  $closeSearch.addEventListener("click", onBackKeyDown);

  // Menu burger
  $menuBtn.addEventListener("click", openMenu);
  document.getElementById('menuItemParams').addEventListener('click', openParamsScreen);

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
  }
}

document.addEventListener('deviceready', () => {
  app();
});

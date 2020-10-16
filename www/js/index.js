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
    photos: 'Prises de vues satellitaires ou aériennes des territoires. <p><a style="color: #00b798; text-decoration: none;" href="https://www.geoportail.gouv.fr/depot/fiches/photographiesaeriennes/geoportail_dates_des_prises_de_vues_aeriennes.pdf" target="_blank" rel="noopener">»&nbsp;Consulter les dates des prises de vues aériennes</a></p><p><a style="color: #00b798; text-decoration: none;" href="http://professionnels.ign.fr/doc/ENR_liste_partenariats%20_orthoHR_pour_diffusion.pdf" target="_blank" rel="noopener">»&nbsp;Consulter les partenariats</a></p><ul class="GPlayerInfo-originators"><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Institut national de l’information géographique et forestière" target="_blank" href="http://www.ign.fr">Institut national de l’information géographique et forestière</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Planet Observer" target="_blank" href="http://www.planetobserver.com/">Planet Observer</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Centre Régional Auvergnat de l’Information Géographique (CRAIG)" target="_blank" href="http://www.craig.fr/">Centre Régional Auvergnat de l’Information Géographique (CRAIG)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Conseil départemental des Alpes-Maritimes" target="_blank" href="https://www.departement06.fr/">Conseil départemental des Alpes-Maritimes</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Régie de Gestion de Données des Pays de Savoie (RGD-73-74)" target="_blank" href="http://www.rgd73-74.fr/">Régie de Gestion de Données des Pays de Savoie (RGD-73-74)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Centre régional de l’information géographique Provence-Alpes-Côte d’Azur (CRIGE-PACA)" target="_blank" href="http://www.crige-paca.org/">Centre régional de l’information géographique Provence-Alpes-Côte d’Azur (CRIGE-PACA)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Fonds européen de développement régional (FEDER)" target="_blank" href="http://www.europe-en-france.gouv.fr/L-Europe-s-engage/Fonds-europeens-2014-2020/Politique-de-cohesion-economique-sociale-et-territoriale/FEDER">Fonds européen de développement régional (FEDER)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Mégalis Bretagne" target="_blank" href="https://www.megalisbretagne.org">Mégalis Bretagne</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Collectivité Territoriale de Corse" target="_blank" href="http://www.corse.fr">Collectivité Territoriale de Corse</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Grand-Est" target="_blank" href="http://www.grandest.fr/">Région Grand-Est</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Préfecture de la région Grand-Est" target="_blank" href="http://www.prefectures-regions.gouv.fr/grand-est/">Préfecture de la région Grand-Est</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Établissement Public Foncier Nord-Pas-de-Calais" target="_blank" href="http://www.epf-npdc.fr">Établissement Public Foncier Nord-Pas-de-Calais</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Conseil départemental du Haut-Rhin" target="_blank" href="https://www.haut-rhin.fr/">Conseil départemental du Haut-Rhin</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Normandie" target="_blank" href="https://www.normandie.fr">Région Normandie</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Conseil départemental du Bas-Rhin" target="_blank" href="http://www.bas-rhin.fr">Conseil départemental du Bas-Rhin</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Soluris" target="_blank" href="http://www.soluris.fr/">Soluris</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Syndicat Intercommunal d’Energie des Deux-Sèvres (SIEDS)" target="_blank" href="https://www.sieds.fr/">Syndicat Intercommunal d’Energie des Deux-Sèvres (SIEDS)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Occitanie" target="_blank" href="http://www.laregion.fr/">Région Occitanie</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Préfecture de la région Occitanie" target="_blank" href="http://www.prefectures-regions.gouv.fr/occitanie">Préfecture de la région Occitanie</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Pays-de-la-Loire" target="_blank" href="http://www.paysdelaloire.fr/">Région Pays-de-la-Loire</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Préfecture de la région Pays-de-la-Loire" target="_blank" href="http://www.prefectures-regions.gouv.fr/pays-de-la-loire">Préfecture de la région Pays-de-la-Loire</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Provence-Alpes-Côte d’Azur" target="_blank" href="http://www.regionpaca.fr">Région Provence-Alpes-Côte d’Azur</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Hauts-de-France" target="_blank" href="http://www.hautsdefrance.fr/">Région Hauts-de-France</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département de la Loire-Atlantique" target="_blank" href="http://www.loire-atlantique.fr">Département de la Loire-Atlantique</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département des Alpes-de-Haute-Provence" target="_blank" href="http://www.mondepartement04.fr/accueil.html">Département des Alpes-de-Haute-Provence</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département des Hautes-Alpes" target="_blank" href="http://www.hautes-alpes.fr/">Département des Hautes-Alpes</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département du Vaucluse" target="_blank" href="http://www.vaucluse.fr/accueil/">Département du Vaucluse</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Gouvernement de la Nouvelle-Calédonie" target="_blank" href="https://gouv.nc/">Gouvernement de la Nouvelle-Calédonie</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département du Var" target="_blank" href="https://www.var.fr/">Département du Var</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Région Bourgogne-Franche-Comté" target="_blank" href="https://www.bourgognefranchecomte.fr/">Région Bourgogne-Franche-Comté</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Département des Bouches-du-Rhône" target="_blank" href="https://www.departement13.fr/">Département des Bouches-du-Rhône</a></li></ul>',
    routes: 'Affichage du réseau routier français et européen. <p><a style="color: #00b798; text-decoration: none;" href="https://www.geoportail.gouv.fr/depot/fiches/donnees-vecteur/composition-donnees-vecteur.pdf" target="_blank" rel="noopener">»&nbsp;Consulter les dates de mise à jour des données</a></p><ul class="GPlayerInfo-originators"><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Institut national de l’information géographique et forestière" target="_blank" href="http://www.ign.fr">Institut national de l’information géographique et forestière</a></li></ul>',
    cartes: 'Cinq types de cartes adaptées aux échelles d’affichage : cartes à grande échelle, cartes topographiques, cartes de tourisme, cartes administratives et routières, cartes à petite échelle.<p><a style="color: #00b798; text-decoration: none;" href="https://www.geoportail.gouv.fr/depot/fiches/cartesIGN/composition_donnee_cartes_ign_classiques.pdf" target="_blank" rel="noopener">»&nbsp;Consulter les dates de mise à jour des données</a></p><ul class="GPlayerInfo-originators"><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Institut national de l’information géographique et forestière" target="_blank" href="http://www.ign.fr">Institut national de l’information géographique et forestière</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Gouvernement de la Nouvelle-Calédonie" target="_blank" href="https://gouv.nc/">Gouvernement de la Nouvelle-Calédonie</a></li></ul>',
    plan_ign: 'Fond cartographique proposé par l’Institut national de l’information géographique et forestière (IGN). <ul class="GPlayerInfo-originators"><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Institut national de l’information géographique et forestière" target="_blank" href="http://www.ign.fr">Institut national de l’information géographique et forestière</a></li></ul>',
    cadastre: 'Représentation du plan cadastral informatisé (PCI) vecteur de la DGFiP. Donnée mise à jour tous les trimestres. <br /> À savoir : cette donnée n’a pas fait l’objet de corrections géométriques. Un décalage par rapport à d’autres données du Géoportail (photographies aériennes en particulier) peut apparaître. <ul class="GPlayerInfo-originators"><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Direction générale des Finances publiques (DGFiP)" target="_blank" href="https://www.economie.gouv.fr/dgfip">Direction générale des Finances publiques (DGFiP)</a></li><li class="GPlayerInfo-otherCities"><a class="inner-link" title="Institut national de l’information géographique et forestière" target="_blank" href="http://www.ign.fr">Institut national de l’information géographique et forestière</a></li></ul>',
    drones: "Représentation des zones soumises à interdictions ou à restrictions pour l’usage, à titre de loisir, d’aéronefs télépilotés (ou drones), sur le territoire métropolitain.<br/><br/>Cette carte intègre partiellement les interdictions s’appuyant sur des données publiées hors de l’AIP (Aeronautical Information Publication) et ne couvre pas les interdictions temporaires. Cette carte est basée sur l’arrêté « espace » du 30 mars 2017.<br/><br/>La représentation des zones soumises à interdictions ou à restrictions n’engage pas la responsabilité des producteurs de la donnée. Le contour des agglomérations est fourni à titre purement indicatif : quelle que soit la couleur représentée, le survol d'un fleuve ou d'un parc en agglomération est interdit.<br/><br/>Consulter la carte ne dispense pas de connaitre la réglementation, de l’appliquer avec discernement et de rester prudent en toute occasion.<p><a style='color: #00b798; text-decoration: none;' href='https://www.sia.aviation-civile.gouv.fr/' target='_blank' rel='noopener'>» Consulter les interdictions temporaires</a></p><p><a style='color: #00b798; text-decoration: none;' href='http://www.developpement-durable.gouv.fr/drones-loisir-et-competition'>» Plus d'informations</a></p>"
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
  const $compassBtn = document.getElementById("compassBtn");
  const $chkRotate = document.getElementById("chkRotate");

  /* global: back button state */
  let backButtonState = 'default';
  /* global: layer display state */
  let layerDisplayed = localStorage.getItem("lastLayerDisplayed") || 'photos';

  /* global: last text in search bar */
  let lastTextInSearch = '';

  /* global: current map rotation */
  let currentRotation = 0;

  /* Message du jour (message of the day) */
  const motd_url = 'https://www.geoportail.gouv.fr/depot/app/motd.json';
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
  //Définition de la carte et des couches
  if (localStorage.getItem("lastMapLat") && localStorage.getItem("lastMapLng") && localStorage.getItem("lastMapZoom")) {
    map.setView([localStorage.getItem("lastMapLat"), localStorage.getItem("lastMapLng")], localStorage.getItem("lastMapZoom"));
  }

  const orthoLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    }
  );

  const roadsLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    minNativeZoom : 6,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    }
  );

  const planLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    minNativeZoom : 3,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    }
  );

  const parcelLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    }
  );

  const cartesLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    }
  );

  const dronesLyr = L.tileLayer.fallback(
    "https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/geoportail/wmts?" +
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
    minNativeZoom : 3,
    maxZoom : 19,
    maxNativeZoom : 18,
    attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
    tileSize : 256, // les tuiles du Géooportail font 256x256px
    }
  );

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
    document.getElementById("catalogBtn").classList.add('d-none');
    // $blueBg.classList.remove('d-none');
    $menuBtn.classList.add('d-none');
    $closeSearch.classList.remove('d-none');
    backButtonState = 'search';
  }

  function searchScreenOff() {
    $resultDiv.hidden = true;
    $resultDiv.innerHTML = "";
    document.getElementById("catalogBtn").classList.remove('d-none');
    // $blueBg.classList.add('d-none');
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
    $rech.value = "Pour aller plus loin...";
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
      apiKey: "9srzhqefn5ts85vtgihkbz3h",
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

  /* TODO: adapter à la nouvelle autocompletion */
  async function suggest() {
    controller.abort();
    controller = new AbortController();
    signal = controller.signal;
    let location = $rech.value;
    let url = new URL("https://wxs.ign.fr/9srzhqefn5ts85vtgihkbz3h/ols/apis/completion");
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
  let location_active = false;
  let tracking_active = false;
  let tracking_interval;
  function trackLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        goToGPSCoords({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        }, zoom=Math.max(map.getZoom(), 14));
      },
      (err) => {
        console.warn(`ERROR(${err.code}): ${err.message}`);
      },
      {
        maximumAge: 15000,
        timeout: 10000,
        enableHighAccuracy: true
      });

      tracking_interval = setInterval( () => {
        navigator.geolocation.getCurrentPosition((position) => {
          goToGPSCoords({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          }, zoom=map.getZoom(), panTo=tracking_active);
        },
        (err) => {
          console.warn(`ERROR(${err.code}): ${err.message}`);
        },
        {
          maximumAge: 15000,
          timeout: 10000,
          enableHighAccuracy: true
        });
      }, 5000);
    }
  }

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
      clearInterval(tracking_interval);
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

  /* Code pour l'activation de la localisation de l'appareil */
  // https://github.com/dpa99c/cordova-plugin-request-location-accuracy
  const platform = cordova.platformId;

  function onError(error) {
      console.error("The following error occurred: " + error);
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

  $compassBtn.addEventListener("click", () => {
    currentRotation = 0;
    map.setBearing(0);
    $compassBtn.style.transform = "rotate(" + 0 + "deg)";
    $compassBtn.classList.add("d-none");
  })

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
  /**/

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

  //  thank you to https://github.com/ilblog   
  // (https://github.com/Leaflet/Leaflet/issues/6817)   
  if(navigator.userAgent === "GeoportailAppIOS"){
    let timer = null;
    function fireLongPressEvent(originalEvent) {
      clearLongPressTimer();
      const el = originalEvent.target,
            x = originalEvent.touches[0].clientX,
            y = originalEvent.touches[0].clientY
      // This will emulate contextmenu mouse event
      const event = new MouseEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        clientX: x,
        clientY: y
      });

      // fire the long-press event
      const suppressClickEvent = el.dispatchEvent.call(el,event);
      if (suppressClickEvent) {
        // temporarily intercept and clear the next click
        $map.addEventListener('touchend', function clearMouseUp(e) {
          $map.removeEventListener('touchend', clearMouseUp, true);
          cancelEvent(e);
        }, true);
      }
    }

    function startLongPressTimer(e) {
      clearLongPressTimer(e);
      timer = setTimeout( fireLongPressEvent.bind(null,e), 1000 );
    }

    function clearLongPressTimer() {
      if(timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function cancelEvent(e){
      e.stopImmediatePropagation();
      e.preventDefault();
      e.stopPropagation();
    }

    // hook events that clear a pending long press event
    $map.addEventListener('touchcancel', clearLongPressTimer, true);
    $map.addEventListener('touchend', clearLongPressTimer, true);
    $map.addEventListener('touchmove', clearLongPressTimer, true);
    // hook events that can trigger a long press event
    $map.addEventListener('touchstart', startLongPressTimer, true); // <- start

    function makeDoubleClick(doubleClickCallback, singleClickCallback) {
      var clicks = 0, timeout;
      return function(originalEvent) {
        clicks++;               
        if (clicks == 1) {
          singleClickCallback && singleClickCallback.apply(this, arguments);
          timeout = setTimeout(function() { clicks = 0; }, 400);
        } else { 
          timeout && clearTimeout(timeout);
          const x = originalEvent.clientX,
                y = originalEvent.clientY;

          const event = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true, 
            clientX: x,
            clientY: y
          });

          let latlng = map.mouseEventToLatLng(event);
          map.setZoomAround(latlng, map.getZoom() + 1);
          doubleClickCallback && doubleClickCallback.apply(this, arguments);
          clicks = 0;
        }
      };
    }    
              
    $map.addEventListener('click', makeDoubleClick(), false);   
  }

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
    console.log('currentzoom: ' + currentZoom);
  });

  map.on("zoom", () => {
    if (Math.round(map.getZoom()) !== currentZoom && !rotationStarted) {
      console.log('getzoom: ' + map.getZoom());
      disableRotation = true;
    }
  });

  map.on("zoomend", () => {
    disableRotation = false;
  });


}

function onLoad() {
  document.addEventListener('deviceready', () => {
    StatusBar.overlaysWebView(false);
    StatusBar.backgroundColorByHexString("#006ba7");
    app();
  },
  false);
}


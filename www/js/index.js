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


//Définition de la carte et des couches
const map = new L.map('map', { zoomControl: false }).setView([48.845732, 2.425204], 20) ;

const orthoLyr = L.tileLayer(
  "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts?" +
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
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

const roadsLyr = L.tileLayer(
  "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
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
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

const planLyr = L.tileLayer(
  "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts?" +
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
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

const parcelLyr = L.tileLayer(
  "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts?" +
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
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

const etatmajorLyr = L.tileLayer(
  "https://wxs.ign.fr/epi5gbeldn6mblrnq95ce0mc/geoportail/wmts?" +
  "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
  "&STYLE=normal" +
  "&TILEMATRIXSET=PM" +
  "&FORMAT=image/jpeg"+
  "&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40"+
  "&TILEMATRIX={z}" +
    "&TILEROW={y}" +
    "&TILECOL={x}",
  {
  minZoom : 0,
  maxZoom : 19,
  maxNativeZoom : 15,
  attribution : '<a class="gp-control-attribution-link" target="_blank" href="http://www.ign.fr"><img class="gp-control-attribution-image" src="https://wxs.ign.fr/static/logos/IGN/IGN.gif" title="Institut national de l\'information géographique et forestière"></a>',
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

const cartesLyr = L.tileLayer(
  "https://wxs.ign.fr/jhyvi0fgmnuxvfv0zjzorvdn/geoportail/wmts?" +
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
  tileSize : 256 // les tuiles du Géooportail font 256x256px
  }
);

// Par défaut : couche ortho
orthoLyr.addTo(map);

// Ajout de l'échelle
L.control.scale({
  imperial: false,
  maxWidth: 150,
  position: "bottomright",
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
  closeCat()
}

function displayOrthoAndRoads() {
  removeAllLayers();
  orthoLyr.addTo(map);
  roadsLyr.addTo(map);
  closeCat()
}

function displayOrthoAndParcels() {
  removeAllLayers();
  parcelLyr.addTo(map);
  orthoLyr.addTo(map);
  orthoLyr.setOpacity(0.5);
  closeCat()
}

function displayPlan() {
  removeAllLayers();
  planLyr.addTo(map);
  closeCat()
}

function displayCartes() {
  removeAllLayers();
  cartesLyr.addTo(map);
  closeCat()
}

function displayEtatMajor() {
  removeAllLayers();
  etatmajorLyr.addTo(map);
  closeCat()
}

document.getElementById("layerEtatMajor").addEventListener('click', displayEtatMajor);
document.getElementById("layerOrtho").addEventListener('click', displayOrtho);
document.getElementById("layerRoutes").addEventListener('click', displayOrthoAndRoads);
document.getElementById("layerCartes").addEventListener('click', displayCartes);
document.getElementById("layerPlan").addEventListener('click', displayPlan);
document.getElementById("layerParcels").addEventListener('click', displayOrthoAndParcels);

// Ouverture et fermeture des menus
function openCat() {
  document.getElementById("catalog").style.width = "100vw";
}

function closeCat() {
  document.getElementById("catalog").style.width = "0";
}

document.getElementById("catalog").getElementsByClassName("closeButton")[0].addEventListener('click', closeCat);
document.getElementById("catalog").getElementsByClassName("backButton")[0].addEventListener('click', closeCat);
document.getElementById("catalogBtn").addEventListener('click', openCat);

/* Autocompletion */

let autocompletion_results = []
let resultDiv = document.getElementById("resultsRech");
let rech = document.getElementById('lieuRech');
let clear = document.getElementById('clearSpan');

async function suggest() {
  let location = document.getElementById("lieuRech").value;
  let url = new URL("https://wxs.ign.fr/22726iz9m8ficsgf2hmiicpd/ols/apis/completion");
  let params =
      {
        text: location,
        maximumResponses: 20,
        type: "PositionOfInterest,StreetAddress",
      };

  Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
  let responseprom = await fetch(url);
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


document.getElementById("lieuRech").addEventListener("keyup", (event) => {
	if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("search").click();
    resultDiv.hidden = true;
    resultDiv.innerHTML = "";
  } else {
    let resultStr = "";
    suggest().then( () => {
      if (autocompletion_results.length > 0){
        for (i = 0 ; i < autocompletion_results.length; i++) {
          resultStr += "<p class='autocompresult'>" + autocompletion_results[i] + "</p>" ;
        }
        resultDiv.innerHTML = resultStr;
        resultDiv.hidden = false;
      }
    });
  }
});

document.querySelector('body').addEventListener('click', (evt) => {
  if ( evt.target.classList.contains('autocompresult') ) {
    rech.value = evt.target.innerHTML;
    resultDiv.hidden = true;
    resultDiv.innerHTML = "";
  }
}, true);

/* Clear button */
/* Plugin to integrate in your js. By djibe, MIT license */
rech.addEventListener('keydown', function() {
  if (rech.value.length > 0) {
    clear.classList.remove('d-none');
  }
});

rech.addEventListener('keydown', function() {
  if (rech.value.length === 0) {
    clear.classList.add('d-none');
  }
});

clear.addEventListener('click', function() {
  rech.value = '';
  resultDiv.hidden = true;
  resultDiv.innerHTML = "";
});

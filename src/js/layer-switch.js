import Layers from './layers';
import Texts from './texts';
import Map from './globals';
import * as UpdateLegend from './update-legend';

const map = Map.map;

// Fonctions de changements d'affichages de couches
function removeAllLayers() {
  Layers.orthoLyr.setOpacity(1);
  map.eachLayer( (layer) => {
    map.removeLayer(layer);
  });
  document.querySelectorAll("#menuC img").forEach(elem => {
    elem.classList.remove('selectedLayer');
  });
  UpdateLegend.updateLegend();
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

export {removeAllLayers,
  displayOrtho,
  displayOrthoAndRoads,
  displayOrthoAndParcels,
  displayCartes,
  displayEtatMajor,
  displayOrthoHisto,
  displayPlan,
  displayTopo,
  displayDrones
};

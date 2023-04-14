import * as MenuDisplay from './menu-display';
import * as UpdateLegend from './update-legend';
import DOM from './dom';
import Globals from './globals';
import Layers from './layers';
import Texts from './texts';

const map = Globals.map;

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
  DOM.$infoText.innerHTML = Texts.informationTexts.photos;
  DOM.$legendImg.innerHTML = Texts.legendImgs.photos;
  Layers.orthoLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'photos';
  MenuDisplay.midScroll();
}

function displayOrthoAndRoads() {
  /**
   * Affiche la couche ortho + route
   */
  removeAllLayers();
  document.getElementById("routes").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.routes;
  DOM.$legendImg.innerHTML = Texts.legendImgs.routes;
  Layers.orthoLyr.addTo(map);
  Layers.roadsLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'routes';
  MenuDisplay.midScroll();
}

function displayOrthoAndParcels() {
  /**
   * Affiche la couche ortho + cadastre
   */
  removeAllLayers();
  document.getElementById("cadastre").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.cadastre;
  DOM.$legendImg.innerHTML = Texts.legendImgs.cadastre;
  Layers.parcelLyr.addTo(map);
  Layers.orthoLyr.addTo(map);
  Layers.orthoLyr.setOpacity(0.5);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'cadastre';
  MenuDisplay.midScroll();
}

function displayPlan() {
  /**
   * Affiche la couche plan IGN
   */
  removeAllLayers();
  document.getElementById("plan-ign").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.plan_ign;
  DOM.$legendImg.innerHTML = Texts.legendImgs.plan_ign;
  Layers.planLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'plan-ign';
  MenuDisplay.midScroll();
}

function displayCartes() {
  /**
   * Affiche la couche cartes IGN
   */
  removeAllLayers();
  document.getElementById("cartes").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.cartes;
  DOM.$legendImg.innerHTML = Texts.legendImgs.cartes;
  Layers.cartesLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'cartes';
  MenuDisplay.midScroll();
}

function displayDrones() {
  /**
   * Affiche la couche carte des drones
   */
  removeAllLayers();
  document.getElementById("drones").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.drones;
  DOM.$legendImg.innerHTML = Texts.legendImgs.drones;
  Layers.cartesLyr.addTo(map);
  Layers.dronesLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'drones';
  MenuDisplay.midScroll();
}

function displayTopo() {
  /**
   * Affiche la couche carte topo
   */
  removeAllLayers();
  document.getElementById("topo").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.topo;
  DOM.$legendImg.innerHTML = Texts.legendImgs.topo;
  Layers.topoLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'topo';
  MenuDisplay.midScroll();
}

function displayEtatMajor() {
  /**
   * Affiche la couche carte d'état major
   */
  removeAllLayers();
  document.getElementById("etat-major").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.etatmajor;
  DOM.$legendImg.innerHTML = Texts.legendImgs.etatmajor;
  Layers.etatmajorLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'etat-major';
  MenuDisplay.midScroll();
}

function displayOrthoHisto() {
  /**
   * Affiche la couche Photographies aériennes anciennes
   */
  removeAllLayers();
  document.getElementById("ortho-histo").classList.add("selectedLayer");
  DOM.$infoText.innerHTML = Texts.informationTexts.orthohisto;
  DOM.$legendImg.innerHTML = Texts.legendImgs.orthohisto;
  Layers.orthoHistoLyr.addTo(map);
  if (Globals.gpsMarkerLayer) {
    Globals.gpsMarkerLayer.addTo(map);
  }
  if (Globals.adressMarkerLayer) {
    Globals.adressMarkerLayer.addTo(map);
  }
  Globals.layerDisplayed = 'ortho-histo';
  MenuDisplay.midScroll();
}

export {
  removeAllLayers,
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

import Globals from './globals';

/**
 * Gestion des thematiques
 * @todo ...
 */
class LayerThematics {

  constructor(options) {
    this.options = options || {
      target : null
    };

    this.map = Globals.map
    this.mapRLT = Globals.mapRLT;

    this.#render();
    this.#listeners();
  }

  /**
   * Rendu
   */
  #render() {

  }

  /**
   * Ecouteurs
   */
  #listeners() {
    // clic sur une couche de fonds
    document.querySelectorAll(".baseLayer").forEach((el) => {
      el.addEventListener('click', () => this.addBaseLayer(el.id));
    });
    // clic sur une couche de données
    document.querySelectorAll(".dataLayer").forEach((el) => {
      el.addEventListener('click', () => this.addDataLayer(el.id));
    });
  }

  /**
   * Ajout de la couche de fonds sur la carte
   * @param {*} layerName 
   * @public
   */
  addBaseLayer(layerName) {
    /**
     * Affiche la couche de fond correspondant à l'id de l'objet baseLayers, en comparaison si
     * le contrôle de comparaison est activé
     */
    if (Globals.mapState === "compare") {
      document.querySelectorAll(".baseLayer").forEach(elem => {
        elem.classList.remove('comparedLayer');
      });
      document.getElementById(layerName).classList.add("comparedLayer");
  
      this.#setLayerSource(layerName, "basemap", "mapRLT");
    } else {
      document.querySelectorAll(".baseLayer").forEach(elem => {
        elem.classList.remove('selectedLayer');
      });
      document.getElementById(layerName).classList.add("selectedLayer");
  
      this.#setLayerSource(layerName, "basemap");
      Globals.baseLayerDisplayed = layerName;
    }
  }

  /**
   * Ajout de la couche de données sur la carte
   * @param {*} layerName 
   * @param {*} force 
   * @returns 
   * @public
   */
  addDataLayer(layerName, force=false) {
    /**
     * Affiche la couche de données correspondant à l'id de l'objet baseLayers
     */
    if (layerName == '') {
      return
    }
    document.querySelectorAll(".dataLayer").forEach(elem => {
      elem.classList.remove('selectedLayer');
    });
    if (Globals.dataLayerDisplayed !== layerName || force) {
      document.getElementById(layerName).classList.add("selectedLayer");
    }
  
    this.#setLayerSource("", "data-layer");
  
    if (Globals.dataLayerDisplayed === layerName && !force) {
      Globals.dataLayerDisplayed = '';
    } else {
      this.#setLayerSource(layerName, "data-layer");
      Globals.dataLayerDisplayed = layerName;
    }
  }

  /**
   * ...
   * @param {*} source 
   * @param {*} layerType 
   * @param {*} glMap 
   */
  #setLayerSource (source, layerType="basemap", glMap="map") {
    let oldLayers;
    if (glMap === "map") {
      oldLayers = this.map.getStyle().layers;
    } else if (glMap === "mapRLT") {
      oldLayers = this.mapRLT.getStyle().layers;
    }
  
    const layerIndex = oldLayers.findIndex(l => l.id === layerType);
    const layerDef = oldLayers[layerIndex];
    const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;
    if (source !== "") {
      layerDef.source = source;
      layerDef.type = "raster";
      delete layerDef.paint;
    } else {
      delete layerDef.source;
      layerDef.type = "background",
      layerDef.paint = {
        "background-opacity": 0,
      }
    }
    if (glMap === "map") {
      this.map.removeLayer(layerType);
      this.map.addLayer(layerDef, before);
    } else if (glMap === "mapRLT") {
      this.mapRLT.removeLayer(layerType);
      this.mapRLT.addLayer(layerDef, before);
    }
  }
  
  /**
   * Afficher le menu
   * @public
   */
  show() {}

  /**
   * Fermer le menu
   * @public
   */
  hide() {}
}

export default LayerThematics;

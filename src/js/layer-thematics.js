import Globals from './globals';
import LayersConfig from './layer-config';
import LayersAdditional from './layer-additional';

import ImageNotFound from '../html/img/image-not-found.png';

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
    var target = this.options.target || document.getElementById("layer-thematics");
    if (!target) {
      console.warn();
      return;
    }

    const tplLayer = (opts) => {
      return `
      <div class="layer ${opts.type}" id="${opts.layerID}">
        <div class="layerImg">
          <img src="${opts.layerQuickLook}" alt="${opts.layerName}" onerror="this.onerror=null;this.src='${ImageNotFound}'" />
          <div class="layer-info" layername="${opts.layerName}"></div>
          <div class="layer-legend" layername="${opts.layerName}"></div>
        </div>
        <div id="${opts.layerName}" class="textCouche">${opts.layerTitle}</div>
      </div>
      `;
    }

    var strBaseLayers = "";
    var baseLayers = LayersConfig.getBaseLayers();
    for(let i = 0; i < baseLayers.length; i++) {
      var props = LayersConfig.getLayerProps(baseLayers[i]);
      strBaseLayers += tplLayer({
        type : "baseLayer",
        layerID : baseLayers[i],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title
      });
    }

    var strDataLayers = "";
    var dataLayers = LayersConfig.getDataLayers();
    for(let j = 0; j < dataLayers.length; j++) {
      var props = LayersConfig.getLayerProps(dataLayers[j]);
      strDataLayers += tplLayer({
        type : "dataLayer",
        layerID : dataLayers[j],
        layerName : props.layer,
        layerQuickLook : LayersAdditional.getQuickLookUrl(props.layer),
        layerTitle : props.title
      });
    }
    
    var template = `
    <div class="layer-thematics">
      <h4 id="baseLayersLabel">Fonds de carte</h4>
      <div class="subCatMenu" id="baseLayers">
        ${strBaseLayers}
      </div>
      <h4 id="dataLayersLabel">Autres données</h4>
      <div class="subCatMenu" id="dataLayers">
        ${strDataLayers}
      </div>
      <h4 id="thematicLayersLabel">Données thématiques</h4>
      <div class="subCatMenu" id="thematicLayers">
        <!-- TODO -->
      </div>
    </div>`;

    const stringToHTML = (str) => {

      var support = function () {
        if (!window.DOMParser) return false;
        var parser = new DOMParser();
        try {
          parser.parseFromString('x', 'text/html');
        } catch (err) {
          return false;
        }
        return true;
      };

      // If DOMParser is supported, use it
      if (support()) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(str, 'text/html');
        return doc.body.firstChild;
      }

      // Otherwise, fallback to old-school method
      var dom = document.createElement('div');
      dom.innerHTML = str;
      return dom;

    };

    // transformation du container : String -> DOM
    var container = stringToHTML(template.trim());

    if (!container) {
      console.warn();
      return;
    }

    target.appendChild(container);
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
